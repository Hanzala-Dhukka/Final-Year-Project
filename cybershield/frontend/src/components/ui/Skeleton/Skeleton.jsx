import "./Skeleton.css";

/**
 * CyberShield Skeleton — prevents layout shift while loading.
 * variant: text | rectangle | circle | card
 */
export default function Skeleton({
  variant = "rectangle",
  width,
  height,
  lines = 3,
  className = "",
  style = {},
}) {
  if (variant === "text") {
    return (
      <div className={`cs-skeleton-group ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <span
            key={i}
            className="cs-skeleton cs-skeleton--text"
            style={{ width: i === lines - 1 ? "60%" : "100%", ...style }}
          />
        ))}
      </div>
    );
  }
  if (variant === "card") {
    return (
      <div className={`cs-skeleton-card ${className}`} style={style}>
        <span className="cs-skeleton cs-skeleton--circle" style={{ width: 44, height: 44 }} />
        <span className="cs-skeleton cs-skeleton--text" style={{ width: "60%", height: 16 }} />
        <span className="cs-skeleton cs-skeleton--text" style={{ width: "100%", height: 12 }} />
        <span className="cs-skeleton cs-skeleton--text" style={{ width: "85%", height: 12 }} />
      </div>
    );
  }
  return (
    <span
      className={`cs-skeleton cs-skeleton--${variant} ${className}`}
      style={{ width, height, ...style }}
    />
  );
}
