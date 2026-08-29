import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  Lightbulb,
  Award,
} from "lucide-react";
import owaspApi, { OWASP_VULNERABILITIES, OWASP_DIFFICULTIES } from "../../api/owaspApi";
import ScenarioCard from "../../components/OWASP/ScenarioCard";
import HintPanel from "../../components/OWASP/HintPanel";
import CodeEditor from "../../components/OWASP/CodeEditor";
import AIExplanation from "../../components/OWASP/AIExplanation";
import OWASPCertificate from "../../components/OWASP/OWASPCertificate";

function statusMeta(status) {
  if (status === "Passed") {
    return { cls: "cs-ow-status--success", Icon: CheckCircle2, text: "Passed" };
  }
  if (status === "Partial") {
    return { cls: "cs-ow-status--partial", Icon: AlertTriangle, text: "Partial" };
  }
  return { cls: "cs-ow-status--failed", Icon: XCircle, text: "Failed" };
}

/**
 * Defense Mode (spec Step 16). Start a defense session, edit the vulnerable
 * code, submit for AI review + validation, receive score + feedback.
 */
export default function DefenseMode({ initialLab, onBack, onComplete }) {
  const [vuln, setVuln] = useState(initialLab || OWASP_VULNERABILITIES[0]);
  const [difficulty, setDifficulty] = useState("Beginner");
  const [sim, setSim] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [certificate, setCertificate] = useState(null);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [certError, setCertError] = useState("");
  const navigate = useNavigate();

  const handleAskAI = () => {
    const owaspContext = {
      type: "owasp",
      scanData: {
        vulnerability: vuln,
        difficulty,
        simulation: sim,
        result,
        userCode: code,
      },
    };
    sessionStorage.setItem("aiAssistantContext", JSON.stringify(owaspContext));
    navigate("/ai-assistant");
  };

  const start = async () => {
    setError("");
    setLoading(true);
    setResult(null);
    setHintsUsed(0);
    setCode("");
    try {
      const r = await owaspApi.start({ vulnerability: vuln, mode: "defense", difficulty });
      setSim(r.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Could not start the lab. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setError("");
    setLoading(true);
    try {
      const r = await owaspApi.defense({ session_id: sim.session_id, user_code: code, hints_used: hintsUsed });
      setResult(r.data);
      if (r.data.status === "Passed" && onComplete) onComplete();
    } catch (e) {
      setError(e.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSim(null);
    setResult(null);
    setCode("");
    setError("");
    setHintsUsed(0);
    setCertificate(null);
    setCertError("");
  };

  const generateCertificate = async () => {
    setGeneratingCert(true);
    setCertError("");
    try {
      const r = await owaspApi.generateModeVulnCert("defense", vuln);
      setCertificate(r.data.certificate);
    } catch (e) {
      setCertError(e.response?.data?.detail || "Could not generate certificate. You may need to complete this vulnerability first.");
    } finally {
      setGeneratingCert(false);
    }
  };

  if (!sim) {
    return (
      <div className="cs-ow-wrap">
        <button className="cs-ow-back" onClick={onBack}>
          <ArrowLeft size={15} /> Back
        </button>

        <div className="cs-ow-setup">
          <div className="cs-ow-setup-head">
            <span className="cs-ow-setup-title">
              <span className="cs-ow-setup-title-icon cs-ow-setup-title-icon--defense">
                <Shield size={18} />
              </span>
              Defense Mode
            </span>
            <span className="cs-ow-chip cs-ow-chip--success">Defensive</span>
          </div>
          <p className="cs-ow-setup-sub">
            Patch a vulnerable code snippet and get validation plus AI feedback on your fix.
          </p>

          <div className="cs-ow-field">
            <label htmlFor="owasp-defense-vuln">Vulnerability</label>
            <select
              id="owasp-defense-vuln"
              className="cs-ow-select"
              value={vuln}
              onChange={(e) => setVuln(e.target.value)}
            >
              {OWASP_VULNERABILITIES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="cs-ow-field">
            <label>Difficulty</label>
            <div className="cs-ow-diffs">
              {OWASP_DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`cs-ow-pill ${difficulty === d ? "cs-ow-pill--active" : ""}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="cs-ow-alert cs-ow-alert--error">{error}</div>}

          <button className="cs-ow-btn cs-ow-btn--defense cs-ow-btn--block" disabled={loading} onClick={start}>
            {loading ? <span className="cs-ow-spin" /> : <Shield size={16} />}
            {loading ? "Starting lab…" : "Start Lab"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cs-ow-wrap">
      <button className="cs-ow-back" onClick={reset}>
        <ArrowLeft size={16} /> New Lab
      </button>

      <ScenarioCard simulation={sim} onAskAI={handleAskAI} />

      <HintPanel hints={sim.hints} onHint={(n) => setHintsUsed(n)} />

      {!result && <CodeEditor value={code} onChange={setCode} onSubmit={submit} disabled={loading} />}

      {error && <div className="cs-ow-alert cs-ow-alert--error">{error}</div>}

      {result && (
        <div className="cs-ow-result">
          <div className="cs-ow-result-header">
            {result.status && (() => {
              const m = statusMeta(result.status);
              const Icon = m.Icon;
              return (
                <span className={`cs-ow-status ${m.cls}`}>
                  <Icon size={16} /> {m.text}
                </span>
              );
            })()}
            {result.xp_earned > 0 && <span className="cs-ow-xp-tag">+{result.xp_earned} XP</span>}
          </div>

          <div className="cs-ow-result-stats">
            {typeof result.score === "number" && (
              <div className="cs-ow-result-stat">
                <b>{result.score}</b>
                <span>Score</span>
              </div>
            )}
            <div className="cs-ow-result-stat">
              <b>{result.hints_used ?? hintsUsed}</b>
              <span>Hints used</span>
            </div>
            {result.owasp_reference && (
              <div className="cs-ow-result-stat">
                <b style={{ fontSize: "0.78rem" }}>{result.owasp_reference}</b>
                <span>OWASP</span>
              </div>
            )}
          </div>

          {result.feedback && <p className="cs-ow-para">{result.feedback}</p>}

          {result.recommendation && (
            <p className="cs-ow-para">
              <b>Recommendation: </b>
              {result.recommendation}
            </p>
          )}

          <AIExplanation
            explanation={result.coach}
            bestPractices={result.best_practices || []}
            secureCodeExample={result.secure_code_example}
          />

          {/* Certificate section */}
          {result.status === "Passed" && (
            <div className="cs-ow-cert-section">
              {!certificate ? (
                <button
                  className="cs-ow-btn cs-ow-btn--certificate cs-ow-btn--certificate-defense"
                  onClick={generateCertificate}
                  disabled={generatingCert}
                >
                  {generatingCert ? (
                    <span className="cs-ow-spin" />
                  ) : (
                    <Award size={16} />
                  )}
                  {generatingCert ? "Generating Certificate..." : "Generate Certificate"}
                </button>
              ) : (
                <OWASPCertificate certificate={certificate} mode="defense" onClose={() => setCertificate(null)} />
              )}
              {certError && <div className="cs-ow-alert cs-ow-alert--error" style={{ marginTop: 8 }}>{certError}</div>}
            </div>
          )}

          <div className="cs-ow-editor-actions">
            <button className="cs-ow-btn cs-ow-btn--ghost" onClick={reset}>
              <Lightbulb size={15} /> Try Another
            </button>
            <button className="cs-ow-btn cs-ow-btn--primary" onClick={handleAskAI}>
              <Sparkles size={15} /> Ask AI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}