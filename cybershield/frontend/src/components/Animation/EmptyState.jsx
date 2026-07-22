import EmptyStateBase from "../ui/EmptyState";

/** Re-export of the UI EmptyState under the Animation library (spec layout parity). */
export default function EmptyState(props) {
  return <EmptyStateBase {...props} />;
}
