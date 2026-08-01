import { motion } from "framer-motion";
import { FiGitBranch } from "react-icons/fi";

export default function BranchSelector({ branches = [], selected, onSelect }) {
  return (
    <div className="branch-selector">
      <FiGitBranch className="branch-selector-icon" />
      <select
        value={selected || ""}
        onChange={(e) => onSelect?.(e.target.value)}
      >
        {branches.length === 0 && <option value="">No branches loaded</option>}
        {branches.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
      {branches.length > 0 && (
        <span className="branch-count">{branches.length} branches</span>
      )}
    </div>
  );
}
