import { ArrowRight, ArrowLeft } from "lucide-react";

// Preset avatar choices (stored as emoji strings — no file upload needed).
const AVATARS = ["🛡️", "🦊", "🐉", "🚀", "🦉", "⚡", "🔥", "👾", "🐺", "🦅", "🧠", "🌐"];

export default function ProfileStep({ form, update, next }) {
  const canContinue = form.name.trim().length > 0;

  return (
    <div className="ob-step">
      <h2>Complete your profile</h2>
      <p className="ob-step-sub">
        Tell us a little about yourself. This helps personalize your dashboard.
      </p>

      <label className="ob-label">Full Name</label>
      <input
        className="ob-input"
        placeholder="e.g. Jane Doe"
        value={form.name}
        onChange={(e) => update({ name: e.target.value })}
        maxLength={60}
      />

      <label className="ob-label">Avatar</label>
      <div className="ob-avatar-grid">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            className={"ob-avatar" + (form.avatar === a ? " selected" : "")}
            onClick={() => update({ avatar: a })}
          >
            {a}
          </button>
        ))}
      </div>

      <label className="ob-label">Bio</label>
      <textarea
        className="ob-textarea"
        placeholder="Tell us about yourself (optional)"
        value={form.bio}
        onChange={(e) => update({ bio: e.target.value })}
        maxLength={240}
        rows={3}
      />
      <div className="ob-char-count">{form.bio.length}/240</div>

      <div className="ob-actions">
        <span className="ob-actions-spacer" />
        <button
          className="ob-btn-primary"
          onClick={next}
          disabled={!canContinue}
        >
          Continue <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
