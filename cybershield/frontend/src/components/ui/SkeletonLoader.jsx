export default function SkeletonLoader({ variant = "text", width = "100%", height }) {
  const baseStyle = {
    background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: "8px",
  };

  const styles = {
    ...baseStyle,
    width,
    height: height || (variant === "card" ? "200px" : variant === "text" ? "1.5rem" : "1rem"),
  };

  return <div style={styles} className="skeleton-loader" />;
}