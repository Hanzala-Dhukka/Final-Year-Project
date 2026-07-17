/**
 * Sidebar listing the user's conversations, grouped by recency.
 * Supports selecting, starting, and deleting conversations.
 */
function groupByDate(conversations) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(today.getDate() - 7);

  const groups = { Today: [], Yesterday: [], "Last Week": [], Older: [] };

  conversations.forEach((c) => {
    const d = new Date(c.updated_at || c.created_at);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups["Today"].push(c);
    else if (d.getTime() === yesterday.getTime()) groups["Yesterday"].push(c);
    else if (d.getTime() >= lastWeek.getTime()) groups["Last Week"].push(c);
    else groups["Older"].push(c);
  });

  return groups;
}

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
}) {
  const groups = groupByDate(conversations);
  const order = ["Today", "Yesterday", "Last Week", "Older"];

  return (
    <aside className="w-64 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full">
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          + New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {conversations.length === 0 && (
          <p className="text-xs text-gray-400 px-2 mt-2">No conversations yet.</p>
        )}

        {order.map((label) =>
          groups[label].length > 0 ? (
            <div key={label} className="mb-3">
              <p className="px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
                {label}
              </p>
              {groups[label].map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center justify-between rounded-lg px-2 py-2 cursor-pointer text-sm ${
                    c.id === activeId
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-200 text-gray-700"
                  }`}
                  onClick={() => onSelect(c.id)}
                >
                  <span className="truncate flex-1">{c.title}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 ml-2"
                    title="Delete conversation"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : null
        )}
      </div>
    </aside>
  );
}
