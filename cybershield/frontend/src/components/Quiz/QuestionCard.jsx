/**
 * A single quiz question with one-select options (spec Step 14).
 * Enforces "one answer per question" by swapping the selected option.
 */
export default function QuestionCard({ index, question, selected, onSelect }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        <span className="text-blue-600 mr-2">{index + 1}.</span>
        {question}
      </h3>
      <div className="space-y-2">
        {question.options.map((opt, i) => {
          const isSelected = selected === opt;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(opt)}
              className={`w-full text-left px-4 py-2.5 rounded-lg border transition ${
                isSelected
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-blue-400 text-gray-700"
              }`}
            >
              <span className="mr-2 inline-block w-5 text-center">
                {isSelected ? "●" : "○"}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
