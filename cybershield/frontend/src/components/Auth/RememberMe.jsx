/**
 * RememberMe — accessible checkbox that also persists the user's preference
 * to localStorage so it can be restored on the next visit.
 */
const STORAGE_KEY = "cs_remember_me";

export default function RememberMe({ checked, onChange, disabled = false }) {
  const handleChange = (e) => {
    const next = e.target.checked;
    onChange(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, "true");
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage may be unavailable (private mode) — non-fatal */
    }
  };

  return (
    <label className="cs-remember" aria-disabled={disabled}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="cs-remember-check"
      />
      <span className="cs-remember-box" aria-hidden="true" />
      <span className="cs-remember-label">Remember me</span>
    </label>
  );
}
