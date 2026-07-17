/**
 * Ordered list of step-by-step remediation actions.
 */
export default function FixSteps({ steps = [] }) {
  if (!steps || steps.length === 0) {
    return <p className="text-sm text-gray-400">No steps provided.</p>;
  }
  return (
    <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
      {steps.map((step, i) => (
        <li key={i}>{step}</li>
      ))}
    </ol>
  );
}
