import { MessageSquare, Plus, Trash2, Sparkles } from "lucide-react";

/**
 * Sidebar listing the user's conversations, grouped by recency.
 * Supports selecting, starting, deleting, and clearing conversations.
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

/** Format an ISO timestamp into a compact "HH:MM" or relative label. */
function formatTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function ChatSidebar({
  conversations,
  activeId,
  onSelect,
  onNewChat,
  onDelete,
  onClearChat,
}) {
  const groups = groupByDate(conversations);
  const order = ["Today", "Yesterday", "Last Week", "Older"];

  return (
    <aside className="cs-ai-sidebar">
      <div className="cs-ai-sidebar__actions">
        <button onClick={onNewChat} className="cs-ai-newchat">
          <Plus size={18} />
          <span>New Chat</span>
        </button>
        {activeId && onClearChat && (
          <button onClick={() => onClearChat(activeId)} className="cs-ai-clearchat">
            <Trash2 size={15} />
            <span>Clear Chat</span>
          </button>
        )}
      </div>

      <div className="cs-ai-sidebar__list">
        {conversations.length === 0 && (
          <div className="cs-ai-sidebar__empty">
            <Sparkles size={20} style={{ margin: "0 auto 8px", opacity: 0.5 }} />
            <p>No conversations yet.<br />Start a new chat with the AI assistant.</p>
          </div>
        )}

        {order.map((label) =>
          groups[label].length > 0 ? (
            <div key={label}>
              <p className="cs-ai-group-label">{label}</p>
              {groups[label].map((c) => (
                <button
                  key={c.id}
                  className={`cs-ai-conv ${c.id === activeId ? "cs-ai-conv--active" : ""}`}
                  onClick={() => onSelect(c.id)}
                >
                  <span className="cs-ai-conv__icon">
                    <MessageSquare size={16} />
                  </span>
                  <span className="cs-ai-conv__meta">
                    <span className="cs-ai-conv__title">{c.title}</span>
                    <span className="cs-ai-conv__time">
                      {formatTime(c.updated_at || c.created_at)}
                    </span>
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    className="cs-ai-conv__del"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(c.id);
                    }}
                    title="Delete conversation"
                  >
                    <Trash2 size={14} />
                  </span>
                </button>
              ))}
            </div>
          ) : null
        )}
      </div>
    </aside>
  );
}