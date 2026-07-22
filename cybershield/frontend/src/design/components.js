/**
 * CyberShield Component Sizes
 * Standard dimensions for buttons, inputs, and cards so every page reuses them.
 */

const components = {
  button: {
    sm: {
      height: "32px",
      paddingX: "12px",
      fontSize: "13px",
      radius: "8px",
    },
    md: {
      height: "40px",
      paddingX: "16px",
      fontSize: "14px",
      radius: "8px",
    },
    lg: {
      height: "48px",
      paddingX: "24px",
      fontSize: "16px",
      radius: "12px",
    },
  },

  input: {
    sm: { height: "32px", paddingX: "12px", fontSize: "13px", radius: "8px" },
    md: { height: "40px", paddingX: "14px", fontSize: "14px", radius: "8px" },
    lg: { height: "48px", paddingX: "16px", fontSize: "16px", radius: "12px" },
  },

  card: {
    sm: { padding: "12px", radius: "12px" },
    md: { padding: "20px", radius: "16px" },
    lg: { padding: "24px", radius: "16px" },
    fullWidth: { width: "100%" },
  },
};

export default components;
