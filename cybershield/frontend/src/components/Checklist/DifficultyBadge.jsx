import colors from "../../styles/colors";

const map = {
  Easy: colors.success,
  Medium: colors.warning,
  Hard: colors.error,
};

/**
 * DifficultyBadge — coloured difficulty label (Step 9).
 */
export default function DifficultyBadge({ difficulty }) {
  const bg = map[difficulty] || colors.textSecondary;
  return (
    <span
      className="text-xs font-medium px-2 py-0.5 rounded text-white"
      style={{ backgroundColor: bg }}
    >
      {difficulty}
    </span>
  );
}
