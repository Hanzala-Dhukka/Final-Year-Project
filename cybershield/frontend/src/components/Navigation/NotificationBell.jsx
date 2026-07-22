import { useState, useRef, useEffect } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { useOnClickOutside } from "../ui/hooks";
import Badge from "../ui/Badge";

const MOCK = [
  { id: 1, type: "Quiz completed", text: "You scored 92% on Web Security Quiz", time: "2m", read: false },
  { id: 2, type: "Threat report ready", text: "Q3 threat report is ready to review", time: "1h", read: false },
  { id: 3, type: "New badge earned", text: "You unlocked the 'Defender' badge", time: "3h", read: false },
  { id: 4, type: "Daily challenge", text: "A new OWASP challenge is available", time: "1d", read: true },
  { id: 5, type: "GitHub scan complete", text: "Scan of api-gateway found 2 issues", time: "2d", read: true },
];

/** Notification center dropdown with unread count. */
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(MOCK);
  const ref = useRef(null);
  useOnClickOutside(ref, () => setOpen(false));

  const unread = items.filter((i) => !i.read).length;

  const markRead = (id) => setItems((s) => s.map((i) => (i.id === id ? { ...i, read: true } : i)));
  const remove = (id) => setItems((s) => s.filter((i) => i.id !== id));
  const markAll = () => setItems((s) => s.map((i) => ({ ...i, read: true })));

  return (
    <div className="cs-notif" ref={ref}>
      <button
        className="cs-notif__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="cs-notif__badge">
            <Badge variant="danger">{unread}</Badge>
          </span>
        )}
      </button>
      {open && (
        <div className="cs-notif__menu" role="menu">
          <div className="cs-notif__head">
            <span>Notifications {unread > 0 && <span className="cs-notif__count">{unread}</span>}</span>
            <button className="cs-notif__all" onClick={markAll} disabled={unread === 0}>
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>
          <div className="cs-notif__list">
            {items.length === 0 ? (
              <div className="cs-notif__empty">No notifications</div>
            ) : (
              items.map((n) => (
                <div key={n.id} className={`cs-notif__item ${n.read ? "" : "is-unread"}`}>
                  <div className="cs-notif__dot" />
                  <div className="cs-notif__body">
                    <div className="cs-notif__title">{n.type}</div>
                    <div className="cs-notif__text">{n.text}</div>
                    <div className="cs-notif__time">{n.time} ago</div>
                  </div>
                  <div className="cs-notif__actions">
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} aria-label="Mark read">
                        <Check size={14} />
                      </button>
                    )}
                    <button onClick={() => remove(n.id)} aria-label="Dismiss">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
