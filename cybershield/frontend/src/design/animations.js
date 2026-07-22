/**
 * CyberShield Animation Principles
 * Smooth, subtle, and consistent motion tokens.
 */

const animations = {
  // Durations
  duration: {
    fast: "150ms",
    base: "250ms",
    slow: "350ms",
  },

  // Easing
  easing: {
    "in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
    "in": "cubic-bezier(0.4, 0, 1, 1)",
    "out": "cubic-bezier(0, 0, 0.2, 1)",
  },

  // Hover / interaction transforms
  hover: {
    scale: "scale(1.02)",
    buttonScale: "scale(0.98)",
    cardLift: "translateY(-4px)",
  },

  // Reusable transition shorthand strings
  transition: {
    base: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
    fast: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  // Keyframe definitions (for CSS / framer-motion)
  keyframes: {
    fadeIn: {
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    slideUp: {
      from: { opacity: 0, transform: "translateY(12px)" },
      to: { opacity: 1, transform: "translateY(0)" },
    },
    slideInRight: {
      from: { opacity: 0, transform: "translateX(16px)" },
      to: { opacity: 1, transform: "translateX(0)" },
    },
    pulseGlow: {
      "0%": { boxShadow: "0 0 0 0 rgba(37, 99, 235, 0.45)" },
      "70%": { boxShadow: "0 0 0 10px rgba(37, 99, 235, 0)" },
      "100%": { boxShadow: "0 0 0 0 rgba(37, 99, 235, 0)" },
    },
    shimmer: {
      "100%": { transform: "translateX(100%)" },
    },
  },
};

export default animations;
