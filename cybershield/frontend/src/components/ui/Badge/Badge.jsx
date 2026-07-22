import "./Badge.css";

/**
 * CyberShield Badge
 * Variants: success | danger | warning | info | primary | secondary
 * Use dot to show a leading status dot.
 */
export default function Badge({
  children,
  variant = "primary",
  dot = false,
  className = "",
  ...rest
}) {
  return (
    <span className={`cs-badge cs-badge--${variant} ${className}`} {...rest}>
      {dot && <span className="cs-badge__dot" />}
      {children}
    </span>
  );
}
