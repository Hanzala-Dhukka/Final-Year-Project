import colors from "../../styles/colors";

const map = {
  Critical: colors.critical,
  High: colors.high,
  Medium: colors.medium,
  Low: colors.low,
};

/**
 * PriorityBadge — coloured priority label (Step 8).
 */
export default function PriorityBadge({ priority }) {
  const bg = map[priority] || colors.textSecondary;
  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded text-white"
      style={{ backgroundColor: bg }}
    >
      {priority}
    </span>
  );
}
