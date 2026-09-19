import { useState, useEffect, useRef } from "react";
import axiosInstance from "../api/axiosInstance";
import { idsMatch } from '../utils/idUtils';

const typeColors = {
  onboarding: { bg: "#064e3b", text: "#10b981" },
  offboarding: { bg: "#451a03", text: "#f59e0b" },
  asset: { bg: "#1e3a5f", text: "#3b82f6" },
  task: { bg: "#1e1b4b", text: "#818cf8" },
  general: { bg: "#1e293b", text: "#94a3b8" },
};

const timeAgo = (dateStr) => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Close dropdown when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/notifications/");
      setNotifications(response.data.results || response.data);
    } catch (err) {
      console.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchNotifications();
  };

  const handleMarkAsRead = async (notification) => {
    if (notification.is_read) return;
    try {
      await axiosInstance.patch(`/notifications/${notification.id}/update/`, {
        is_read: true,
      });
      setNotifications((prev) =>
        prev.map((n) => (idsMatch(n.id, notification.id) ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    try {
      await Promise.all(
        unread.map((n) => axiosInstance.patch(`/notifications/${n.id}/update/`, { is_read: true }))
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark all as read");
    }
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={handleToggle}
        style={{
          position: "relative",
          background: "#0a1628",
          border: "0.5px solid #1e293b",
          borderRadius: "8px",
          width: "38px",
          height: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "18px", height: "18px" }} fill="none" viewBox="0 0 24 24" stroke="#94a3b8" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              background: "#ef4444",
              color: "white",
              borderRadius: "999px",
              fontSize: "10px",
              fontWeight: 600,
              minWidth: "16px",
              height: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0 3px",
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "46px",
            right: 0,
            width: "340px",
            maxHeight: "420px",
            background: "#0a1628",
            border: "0.5px solid #1e293b",
            borderRadius: "12px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
            overflow: "hidden",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "0.5px solid #1e293b" }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{ background: "transparent", border: "none", color: "#3b82f6", fontSize: "11px", cursor: "pointer" }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading ? (
              <p style={{ fontSize: "12px", color: "#64748b", textAlign: "center", padding: "24px" }}>Loading...</p>
            ) : notifications.length === 0 ? (
              <p style={{ fontSize: "12px", color: "#475569", textAlign: "center", padding: "24px" }}>No notifications</p>
            ) : (
              notifications.map((n) => {
                const style = typeColors[n.notification_type] || typeColors.general;
                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n)}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "0.5px solid #1e293b",
                      cursor: n.is_read ? "default" : "pointer",
                      background: n.is_read ? "transparent" : "#0f1a2e",
                      display: "flex",
                      gap: "10px",
                    }}
                  >
                    {!n.is_read && (
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3b82f6", marginTop: "6px", flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                        <p style={{ fontSize: "12.5px", color: "#f1f5f9", margin: 0, fontWeight: n.is_read ? 400 : 500 }}>{n.title}</p>
                        <span style={{ background: style.bg, color: style.text, borderRadius: "20px", padding: "1px 8px", fontSize: "10px", flexShrink: 0 }}>
                          {n.notification_type}
                        </span>
                      </div>
                      <p style={{ fontSize: "11.5px", color: "#64748b", margin: "0 0 3px" }}>{n.message}</p>
                      <p style={{ fontSize: "10.5px", color: "#475569", margin: 0 }}>{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;