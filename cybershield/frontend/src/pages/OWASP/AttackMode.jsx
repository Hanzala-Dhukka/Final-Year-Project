import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Swords,
  ArrowLeft,
  Target,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Award,
} from "lucide-react";
import owaspApi, { OWASP_VULNERABILITIES, OWASP_DIFFICULTIES } from "../../api/owaspApi";
import ScenarioCard from "../../components/OWASP/ScenarioCard";
import HintPanel from "../../components/OWASP/HintPanel";
import PayloadEditor from "../../components/OWASP/PayloadEditor";
import AIExplanation from "../../components/OWASP/AIExplanation";
import OWASPCertificate from "../../components/OWASP/OWASPCertificate";

/**
 * Attack Mode (spec Step 15). Pick a vulnerability + difficulty, start a
 * session, submit payloads, use hints, and receive AI coach feedback.
 * Generates a certificate on successful completion.
 */
export default function AttackMode({ initialLab, onBack, onComplete }) {
  const [vuln, setVuln] = useState(initialLab || OWASP_VULNERABILITIES[0]);
  const [difficulty, setDifficulty] = useState("Beginner");
  const [sim, setSim] = useState(null);
  const [hintsUsed, setHintsUsed] = useState(0);
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
    try {
      const r = await owaspApi.start({ vulnerability: vuln, mode: "attack", difficulty });
      setSim(r.data);
    } catch (e) {
      setError(e.response?.data?.detail || "Could not start the simulation. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const submit = async (payload) => {
    setError("");
    setLoading(true);
    try {
      const r = await owaspApi.attack({ session_id: sim.session_id, payload, hints_used: hintsUsed });
      setResult(r.data);
      if (r.data.success && onComplete) onComplete();
    } catch (e) {
      setError(e.response?.data?.detail || "Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSim(null);
    setResult(null);
    setError("");
    setHintsUsed(0);
    setCertificate(null);
    setCertError("");
  };

  const generateCertificate = async () => {
    setGeneratingCert(true);
    setCertError("");
    try {
      const r = await owaspApi.generateModeVulnCert("attack", vuln);
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
              <span className="cs-ow-setup-title-icon cs-ow-setup-title-icon--attack">
                <Swords size={18} />
              </span>
              Attack Mode
            </span>
            <span className="cs-ow-chip cs-ow-chip--danger">
              <Zap size={11} /> Offensive
            </span>
          </div>
          <p className="cs-ow-setup-sub">
            Simulate exploiting a known vulnerability and get AI coach feedback on your payload.
          </p>

          <div className="cs-ow-field">
            <label htmlFor="owasp-attack-vuln">Vulnerability</label>
            <select
              id="owasp-attack-vuln"
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

          <button className="cs-ow-btn cs-ow-btn--attack cs-ow-btn--block" disabled={loading} onClick={start}>
            {loading ? <span className="cs-ow-spin" /> : <Target size={16} />}
            {loading ? "Starting simulation…" : "Start Simulation"}
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

      {!result && <PayloadEditor onSubmit={submit} disabled={loading} />}

      {error && <div className="cs-ow-alert cs-ow-alert--error">{error}</div>}

      {result && (
        <div className="cs-ow-result">
          <div className="cs-ow-result-header">
            <span className={`cs-ow-status ${result.success ? "cs-ow-status--success" : "cs-ow-status--failed"}`}>
              {result.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              {result.success ? "Attack Successful" : "Not triggered"}
            </span>
            {result.xp_earned > 0 && <span className="cs-ow-xp-tag">+{result.xp_earned} XP</span>}
            {result.no_hint_bonus && (
              <span className="cs-ow-chip cs-ow-chip--success">No-hint bonus +20 XP</span>
            )}
          </div>

          {result.vulnerability && (
            <p className="cs-ow-para">
              <b>Target:</b> {result.vulnerability} · <b>Hints used:</b> {result.hints_used}
            </p>
          )}

          {result.analysis && <p className="cs-ow-para">{result.analysis}</p>}

          <AIExplanation explanation={result.coach} provider={result.provider} />

          {/* Certificate section */}
          {result.success && (
            <div className="cs-ow-cert-section">
              {!certificate ? (
                <button
                  className="cs-ow-btn cs-ow-btn--certificate"
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
                <OWASPCertificate certificate={certificate} mode="attack" onClose={() => setCertificate(null)} />
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