/**
 * PasswordStrength — lightweight meter (Weak / Medium / Strong).
 * Mirrors the spec's scoring: weak < 6 chars, strong when it has an
 * uppercase + number and is >= 8 chars, otherwise medium.
 */
export default function PasswordStrength({ password = "" }) {
  const checkStrength = () => {
    if (password.length < 6) return "Weak";
    if (password.match(/[A-Z]/) && password.match(/[0-9]/) && password.length >= 8)
      return "Strong";
    return "Medium";
  };

  const strength = checkStrength();

  return (
    <div className="password-strength">
      <p>
        Password Strength: <span>{password ? strength : "—"}</span>
      </p>
      {password && <div className={`strength-bar ${strength}`} />}
    </div>
  );
}
