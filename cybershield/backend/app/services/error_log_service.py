"""
Error logging service.

Records every exception into the MongoDB `log` collection in real time so that
server-side errors (e.g. a changed API requirement breaking a function) can be
inspected later with full context.

Three layers of automatic coverage:

1. ``fire_and_forget_log`` — callable from ANY code path (sync or async). Auto
   derives the caller's folder/file/function, so a single no-arg call inside an
   ``except`` block is enough: ``fire_and_forget_log()``.

2. ``install_global_hooks`` — overrides ``sys.excepthook``, ``threading.excepthook``
   and the asyncio loop exception handler, so even uncaught exceptions in threads,
   scheduled jobs and event-loop tasks are recorded automatically.

3. ``with_error_logging`` — opt-in decorator for functions you want fully wrapped.

Every entry stores:
- DateTime, Folder_Name, File_Name, Function, Line
- Error_Message, Error_Type, full Traceback
- System_Info (host, OS, python version, process / thread ids)
- Extra_Info (caller-supplied context such as request path, user, payload keys)
"""
import asyncio
import inspect
import os
import platform
import socket
import sys
import threading
import traceback
from datetime import datetime, timezone
from functools import wraps
from typing import Any, Callable, Dict, Optional

from app.database.db import database

LOG_COLLECTION = "log"

# Dedicated WebSocket manager so real-time log events never leak into the
# dashboard stream (and vice versa).
#
# NOTE: intentionally created lazily (not at import time) to avoid a circular
# import — app.websocket.manager imports this module too.
_log_manager = None


def _get_log_manager():
    """Lazily build and return the shared real-time log WebSocket manager."""
    global _log_manager
    if _log_manager is None:
        try:
            from app.websocket.manager import ConnectionManager
            _log_manager = ConnectionManager()
        except Exception:
            _log_manager = None
    return _log_manager


def __getattr__(name):
    """Support ``from app.services.error_log_service import log_manager``."""
    if name == "log_manager":
        return _get_log_manager()
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")


def get_current_datetime() -> str:
    """ISO-8601 timestamp (UTC) used for every log entry."""
    return datetime.now(timezone.utc).isoformat()


def _safe_get_ip(hostname: str) -> str:
    try:
        return socket.gethostbyname(hostname)
    except Exception:
        return "0.0.0.0"


def _capture_system_info() -> Dict[str, Any]:
    hostname = socket.gethostname()
    return {
        "Host": hostname,
        "IP": _safe_get_ip(hostname),
        "OS": platform.system(),
        "OS_Version": platform.version(),
        "Python_Version": platform.python_version(),
        "Process_ID": os.getpid(),
        "Thread": str(threading.get_ident()),
        "Working_Dir": os.getcwd(),
    }


async def _broadcast_log(data: Dict[str, Any]) -> None:
    """Push the log entry to every connected /ws/logs client (best-effort)."""
    try:
        manager = _get_log_manager()
        if manager is not None:
            await manager.broadcast({"event": "log", "data": data})
    except Exception:
        pass


async def log_error(
    folder_name: str,
    file_name: str,
    function: str,
    error: Exception,
    extra_info: dict = None,
) -> Optional[str]:
    """
    Write a full error report into the `log` collection in real time.

    The traceback of the passed exception is captured from ``error.__traceback__``
    so it works from any context (except block, decorator, thread hook, task).

    Returns the inserted MongoDB ``_id`` as a string, or ``None`` if the
    database write failed.
    """
    exc_type = type(error)
    tb = getattr(error, "__traceback__", None)
    if tb is not None:
        tb_str = "".join(traceback.format_exception(exc_type, error, tb))
        line = tb.tb_lineno
    else:
        tb_str = f"{exc_type.__name__}: {error}"
        line = None

    data = {
        "DateTime": get_current_datetime(),
        "Folder_Name": folder_name,
        "File_Name": file_name,
        "Function": function,
        "Error_Message": str(error),
        "Error_Type": exc_type.__name__,
        "Line": line,
        "Traceback": tb_str,
        "System_Info": _capture_system_info(),
        "Extra_Info": extra_info or {},
    }

    print(
        f"\n[ERROR LOG]\n"
        f"DateTime: {data['DateTime']}\n"
        f"Location: {folder_name}/{file_name}:{line} | Function: {function}\n"
        f"Type: {data['Error_Type']} | Message: {data['Error_Message']}\n"
        f"Traceback:\n{tb_str}"
        f"Line: {line}\n"
    )

    await _broadcast_log(data)

    inserted_id: Optional[str] = None
    try:
        result = await database[LOG_COLLECTION].insert_one(data)
        inserted_id = str(getattr(result, "inserted_id", None) or "")
    except Exception:
        inserted_id = None
    return inserted_id or None


async def log_exception(
    folder_name: str,
    file_name: str,
    function: str,
    error: Exception,
    extra_info: dict = None,
) -> Optional[str]:
    """Alias of :func:`log_error` for readability inside `except` blocks."""
    return await log_error(folder_name, file_name, function, error, extra_info)


def _derive_caller(frame) -> tuple:
    """Auto-derive (folder_name, file_name, function) from a caller frame."""
    function = frame.f_code.co_name
    file_name = os.path.basename(frame.f_code.co_filename)
    folder_name = os.path.basename(os.path.dirname(frame.f_code.co_filename))
    return folder_name, file_name, function


def _schedule(coro) -> None:
    """Run a coroutine in the safest available way (best-effort, never raises)."""
    try:
        loop = asyncio.get_running_loop()
        if loop.is_running():
            loop.create_task(coro)
        else:
            loop.run_until_complete(coro)
    except RuntimeError:
        # No running event loop (e.g. plain thread / scheduler) — run inline.
        try:
            asyncio.run(coro)
        except Exception:
            pass
    except Exception:
        pass


def fire_and_forget_log(
    error: Exception = None,
    extra_info: dict = None,
    folder_name: str = None,
    file_name: str = None,
    function: str = None,
) -> None:
    """
    Record an error into the `log` collection from any code path.

    Call it as the first statement of an ``except`` block:

        except Exception:
            fire_and_forget_log()

    The folder / file / function are auto-derived from the caller frame, and the
    current exception is taken from ``sys.exc_info()`` when ``error`` is omitted.
    It never raises and never blocks the caller.
    """
    if error is None:
        exc = sys.exc_info()[1]
        if exc is None:
            return
        error = exc

    if folder_name is None or file_name is None or function is None:
        try:
            frame = sys._getframe(1)
            d_folder, d_file, d_func = _derive_caller(frame)
            folder_name = folder_name or d_folder
            file_name = file_name or d_file
            function = function or d_func
        except Exception:
            folder_name = folder_name or "app"
            file_name = file_name or "unknown"
            function = function or "unknown"

    _schedule(log_error(folder_name, file_name, function, error, extra_info))


# ── Global safety nets ──────────────────────────────────────────────────────

# Saved originals so we can preserve default behaviour after overriding.
_ORIG_THREAD_EXCEPTHOOK = threading.excepthook
_ORIG_SYS_EXCEPTHOOK = sys.excepthook


def _thread_excepthook(args) -> None:
    """Record exceptions that escape a thread (background jobs, scheduler)."""
    if args.exc_value is not None:
        fire_and_forget_log(
            args.exc_value,
            extra_info={"Thread": args.thread.name if args.thread else None},
        )
    # Keep the default behaviour (prints the traceback) as well.
    _ORIG_THREAD_EXCEPTHOOK(args)


def _main_excepthook(exc_type, exc_value, exc_tb) -> None:
    """Record exceptions that escape the main thread / interpreter."""
    fire_and_forget_log(
        exc_value,
        extra_info={"Hook": "sys.excepthook"},
    )
    # Keep the default behaviour.
    _ORIG_SYS_EXCEPTHOOK(exc_type, exc_value, exc_tb)


def _loop_exception_handler(loop, context) -> None:
    """Record exceptions raised by asyncio tasks that were never awaited."""
    exc = context.get("exception")
    message = context.get("message", "Unhandled exception in asyncio task")
    if exc is not None:
        fire_and_forget_log(exc, extra_info={"Async_Message": message})
    else:
        print(f"[Async] {message}")
    # Preserve standard asyncio behaviour (logs + task cleanup).
    try:
        loop.default_exception_handler(context)
    except Exception:
        pass


def install_global_hooks() -> None:
    """
    Install project-wide automatic error logging.

    Call once at app startup. Overrides:
    - ``sys.excepthook`` (uncaught exceptions in the main thread)
    - ``threading.excepthook`` (uncaught exceptions in worker threads)
    - asyncio loop exception handler (unhandled task exceptions)

    Also safe to call multiple times (idempotent for the asyncio part).
    """
    try:
        sys.excepthook = _main_excepthook
    except Exception:
        pass

    try:
        threading.excepthook = _thread_excepthook
    except Exception:
        pass

    try:
        loop = asyncio.get_running_loop()
        loop.set_exception_handler(_loop_exception_handler)
    except RuntimeError:
        pass  # not inside an event loop yet — installed again on startup event


def install_loop_exception_handler() -> None:
    """Attach the asyncio exception handler. Must be called from inside the loop."""
    try:
        loop = asyncio.get_running_loop()
        loop.set_exception_handler(_loop_exception_handler)
    except RuntimeError:
        pass


# ── Opt-in decorator ────────────────────────────────────────────────────────


def _derive_location(func: Callable) -> tuple:
    """Auto-derive (folder_name, file_name) from the wrapped function's file."""
    folder_name = file_name = None
    try:
        source_file = inspect.getsourcefile(func)
        if source_file:
            file_name = os.path.basename(source_file)
            folder_name = os.path.basename(os.path.dirname(source_file))
    except Exception:
        pass
    return folder_name, file_name


def with_error_logging(
    folder_name: str = None,
    file_name: str = None,
    extra_info: dict = None,
) -> Callable:
    """
    Decorator that logs any exception raised by the wrapped function into the
    `log` collection, then re-raises it.

    Works for both async and sync functions. When ``folder_name`` / ``file_name``
    are omitted they are derived from the function's source file automatically.

    Usage::

        @with_error_logging(extra_info={"module": "reports"})
        async def generate_report(user_id: str) -> bytes:
            ...

    The decorator NEVER swallows the exception — the caller still receives it.
    """

    def decorator(func: Callable) -> Callable:
        actual_folder = folder_name
        actual_file = file_name
        if actual_folder is None or actual_file is None:
            derived_folder, derived_file = _derive_location(func)
            actual_folder = actual_folder or derived_folder or "app"
            actual_file = actual_file or derived_file or getattr(func, "__module__", "unknown")

        @wraps(func)
        async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                await log_error(actual_folder, actual_file, func.__name__, e, extra_info)
                raise

        @wraps(func)
        def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return func(*args, **kwargs)
            except Exception as e:
                fire_and_forget_log(e, folder_name=actual_folder, file_name=actual_file, function=func.__name__)
                raise

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator