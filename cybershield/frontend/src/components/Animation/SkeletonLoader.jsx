import Skeleton from "../ui/Skeleton";

/**
 * SkeletonLoader — thin re-export of the UI Skeleton with a convenience `variant`
 * set for page areas (dashboard, table, chart, profile, quiz, report, glossary).
 * Kept as a named entry so the Animation library mirrors the spec's component list.
 */
export default function SkeletonLoader(props) {
  return <Skeleton {...props} />;
}
