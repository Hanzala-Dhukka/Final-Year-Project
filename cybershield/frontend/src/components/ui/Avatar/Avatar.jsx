import "./Avatar.css";

/**
 * CyberShield Avatar
 * src → image, else initials. status dot + badge overlay supported.
 * size: xs | sm | md | lg | xl (px)
 */
const SIZES = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 };

export default function Avatar({
  src,
  name,
  size = "md",
  status,
  badge,
  className = "",
}) {
  const px = typeof size === "number" ? size : SIZES[size] || SIZES.md;
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`cs-avatar ${className}`} style={{ width: px, height: px }}>
      {src ? (
        <img src={src} alt={name || "avatar"} className="cs-avatar__img" />
      ) : (
        <span className="cs-avatar__initials" style={{ fontSize: px * 0.4 }}>
          {initials}
        </span>
      )}
      {status && <span className={`cs-avatar__status cs-avatar__status--${status}`} />}
      {badge && <span className="cs-avatar__badge">{badge}</span>}
    </div>
  );
}
