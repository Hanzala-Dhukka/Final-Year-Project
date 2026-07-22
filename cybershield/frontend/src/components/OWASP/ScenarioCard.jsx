/**
 * Scenario card (spec Step 15). Shows the vulnerability scenario description,
 * difficulty, and the input field/example.
 */
export default function ScenarioCard({ simulation }) {
  if (!simulation) return null;
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-gray-800">{simulation.title}</h2>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500">
          {simulation.difficulty}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{simulation.scenario}</p>
      <div className="text-xs text-gray-400">
        Target field: <span className="font-mono text-gray-600">{simulation.field}</span>
      </div>
      {simulation.example_payload && (
        <div className="mt-2 text-xs text-gray-400">
          Example: <code className="bg-gray-100 px-1 rounded">{simulation.example_payload}</code>
        </div>
      )}
    </div>
  );
}
