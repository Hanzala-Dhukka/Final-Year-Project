import { forwardRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import "./Button.css";

/**
 * CyberShield Button
 * Variants: primary | secondary | outline | ghost | success | warning | danger | link
 * Sizes: sm | md | lg
 * States: loading, disabled, icon-only. Supports leftIcon / rightIcon and ripple.
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    iconOnly = false,
    leftIcon,
    rightIcon,
    type = "button",
    className = "",
    onClick,
    fullWidth = false,
    ...rest
  },
  ref
) {
  const [ripples, setRipples] = useState([]);

  const handleClick = useCallback(
    (e) => {
      if (loading || disabled) return;
      // Ripple origin
      const rect = e.currentTarget.getBoundingClientRect();
      const ripple = {
        id: Date.now(),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        size: Math.max(rect.width, rect.height),
      };
      setRipples((r) => [...r, ripple]);
      setTimeout(() => setRipples((r) => r.filter((x) => x.id !== ripple.id)), 600);
      onClick?.(e);
    },
    [loading, disabled, onClick]
  );

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      type={type}
      className={[
        "cs-btn",
        `cs-btn--${variant}`,
        `cs-btn--${size}`,
        iconOnly ? "cs-btn--icon" : "",
        fullWidth ? "cs-btn--full" : "",
        loading ? "cs-btn--loading" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      onClick={handleClick}
      {...rest}
    >
      {loading && <Loader2 className="cs-btn__spinner" size={size === "lg" ? 20 : 16} />}
      {!loading && leftIcon && <span className="cs-btn__icon">{leftIcon}</span>}
      {!iconOnly && <span className="cs-btn__label">{children}</span>}
      {!loading && rightIcon && <span className="cs-btn__icon">{rightIcon}</span>}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="cs-btn__ripple"
          style={{ left: r.x, top: r.y, width: r.size, height: r.size }}
        />
      ))}
    </button>
  );
});

export default Button;
