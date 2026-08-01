import { useState } from "react";
import { motion } from "framer-motion";
import { FiX } from "react-icons/fi";

export default function CancelScanButton({ scanId, onCancel, disabled = false }) {
  const [cancelling, setCancelling] = useState(false);

  const handleClick = async () => {
    if (!scanId || cancelling) return;
    setCancelling(true);
    try {
      await onCancel?.(scanId);
    } catch {
      // Error handled by parent
    } finally {
      setCancelling(false);
    }
  };

  return (
    <motion.button
      className="cancel-scan-btn"
      onClick={handleClick}
      disabled={disabled || cancelling}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <FiX />
      <span>{cancelling ? "Cancelling..." : "Cancel Scan"}</span>
    </motion.button>
  );
}
