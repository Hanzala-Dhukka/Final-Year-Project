"""
AI client — powered by Groq (drop-in replacement for the old Gemini wrapper).

Every other module imports `generate` and `is_available` from here (or from
the groq_client re-export shim), so swapping the underlying provider only
requires changing this one file.

Key behaviours
--------------
* OpenAI-compatible Groq SDK via `groq.AsyncGroq` — fully async, no thread pool needed.
* Lazy singleton — client is created on first use.
* Failure-reset — a transient init error does NOT permanently disable AI;
  _initialized is only set True on success, so the next call retries.
* Model fallback — if the primary model is unavailable, automatically tries
  AI_MODEL_FALLBACK from .env, then the hardcoded last-resort models.
* Retry with exponential back-off for transient / rate-limit errors.
* Per-call timeout controlled by AI_TIMEOUT in .env (default 30 s).
* Graceful offline mode when no API key is configured.
"""
from __future__ import annotations

import asyncio
from typing import List, Optional

try:
    from groq import AsyncGroq
    GROQ_AVAILABLE = True
except ImportError:
    fire_and_forget_log()
    AsyncGroq = None  # type: ignore
    GROQ_AVAILABLE = False

from app.config.settings import settings
from app.services.error_log_service import fire_and_forget_log

# ── Singleton state ───────────────────────────────────────────────────────────
_client: Optional[object] = None
_initialized: bool = False  # True only after a *successful* init

# ── Retry / timeout ───────────────────────────────────────────────────────────
MAX_RETRIES = 3
BASE_BACKOFF = 1.5       # seconds, doubled each retry
TIMEOUT_SECS: int = int(getattr(settings, "AI_TIMEOUT", 30))

# ── Error classifiers ─────────────────────────────────────────────────────────
_TRANSIENT_ERRORS = ("timeout", "connection", "reset", "unavailable", "503", "502", "500", "network")
_QUOTA_ERRORS     = ("rate_limit_exceeded", "429", "rate limit", "too many requests", "quota")
_MODEL_GONE_ERRORS = ("model_not_found", "404", "no longer available", "deprecated", "not_found",
                      "model not found", "does not exist")


def _is_transient(err: Exception) -> bool:
    msg = str(err).lower()
    return any(kw in msg for kw in _TRANSIENT_ERRORS)

def _is_quota(err: Exception) -> bool:
    msg = str(err).lower()
    return any(kw in msg for kw in _QUOTA_ERRORS)

def _is_model_gone(err: Exception) -> bool:
    msg = str(err).lower()
    return any(kw in msg for kw in _MODEL_GONE_ERRORS)


# ── Model list ────────────────────────────────────────────────────────────────

def _candidate_models() -> List[str]:
    """Ordered list of Groq model IDs to try: primary → fallback → last-resort."""
    primary  = getattr(settings, "AI_MODEL",          "llama-3.3-70b-versatile")
    fallback = getattr(settings, "AI_MODEL_FALLBACK",  "llama-3.1-8b-instant")
    seen, models = set(), []
    for m in [primary, fallback, "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
        if m and m not in seen:
            seen.add(m)
            models.append(m)
    return models


# ── Initialisation ────────────────────────────────────────────────────────────

def initialize() -> Optional[object]:
    """
    Create the AsyncGroq client (once).
    _initialized is only set True on success so transient failures are retried.
    """
    global _client, _initialized

    if _initialized:
        return _client

    if not GROQ_AVAILABLE or AsyncGroq is None:
        print("Warning: groq package not installed. Run: pip install groq")
        print("AI Assistant running in fallback mode.")
        _initialized = True
        _client = None
        return None

    key = (
        getattr(settings, "GROQ_API_KEY", "")
        or getattr(settings, "GEMINI_API_KEY", "")  # fallback if someone left old key
    )
    if not key or key in ("your_groq_api_key_here", ""):
        print("Warning: GROQ_API_KEY not set in backend/.env — AI Assistant in fallback mode.")
        _initialized = True
        _client = None
        return None

    try:
        _client = AsyncGroq(api_key=key)
        _initialized = True
        print(f"[Groq] AI client ready — models: {_candidate_models()}")
    except Exception as e:
        fire_and_forget_log()
        print(f"[Groq] Error initialising client: {e} — will retry on next request.")
        _client = None  # _initialized stays False → next call retries

    return _client


def get_model() -> Optional[object]:
    """Return the AsyncGroq client, initialising lazily if needed."""
    global _client
    if not _initialized:
        _client = initialize()
    return _client


def is_available() -> bool:
    """True when a working Groq client is ready."""
    return get_model() is not None


# ── Public async generate ─────────────────────────────────────────────────────

async def generate(prompt: str) -> str:
    """
    Send *prompt* to Groq and return the plain-text response.

    Tries each model in _candidate_models() in order.  Within each model,
    retries up to MAX_RETRIES times on transient / timeout errors.
    Quota errors back off for 60 s on the first hit, then raise.
    Model-gone errors skip straight to the next candidate.

    Returns:
        The model's reply as a string.

    Raises:
        RuntimeError: when every model / retry has been exhausted.
    """
    client = get_model()
    if not client:
        raise RuntimeError(
            "Groq AI is not available. "
            "Please set GROQ_API_KEY in backend/.env"
        )

    candidates = _candidate_models()
    overall_last_exc: Exception = RuntimeError("Unknown error")

    for model in candidates:
        last_exc: Exception = RuntimeError("Unknown error")

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = await asyncio.wait_for(
                    client.chat.completions.create(
                        model=model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=float(getattr(settings, "AI_TEMPERATURE", 0.2)),
                        max_tokens=int(getattr(settings, "AI_MAX_TOKENS", 2048)),
                    ),
                    timeout=TIMEOUT_SECS,
                )
                text = (response.choices[0].message.content or "").strip()
                if model != candidates[0]:
                    print(f"[Groq] Success with fallback model: {model}")
                return text

            except asyncio.TimeoutError:
                fire_and_forget_log()
                last_exc = RuntimeError(
                    f"Groq request timed out after {TIMEOUT_SECS}s "
                    f"(model={model}, attempt {attempt}/{MAX_RETRIES})."
                )
                print(f"[Groq] Timeout — model={model}, attempt {attempt}/{MAX_RETRIES}")

            except Exception as e:
                fire_and_forget_log()
                if _is_quota(e):
                    print(f"[Groq] Rate limit hit on model={model}: {e}")
                    # Back off 60 s on first quota hit, then move to next model
                    if attempt == 1:
                        print("[Groq] Waiting 60 s before retrying …")
                        await asyncio.sleep(60)
                    else:
                        overall_last_exc = e
                        break  # try next model
                    last_exc = e
                    continue

                if _is_model_gone(e):
                    print(f"[Groq] Model '{model}' not available — trying next model.")
                    overall_last_exc = e
                    break  # skip to next candidate model

                last_exc = e
                overall_last_exc = e

                if not _is_transient(e):
                    print(f"[Groq] Non-transient error (model={model}): {e}")
                    raise  # propagate unexpected errors immediately

                print(f"[Groq] Transient error — model={model}, attempt {attempt}/{MAX_RETRIES}: {e}")

            # Back-off before next retry (skip after final attempt)
            if attempt < MAX_RETRIES:
                sleep_time = BASE_BACKOFF * (2 ** (attempt - 1))
                print(f"[Groq] Retrying in {sleep_time:.1f}s …")
                await asyncio.sleep(sleep_time)

        else:
            overall_last_exc = last_exc

    raise RuntimeError(
        f"Groq AI failed on all models ({candidates}). "
        f"Last error: {overall_last_exc}"
    ) from overall_last_exc
