import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { statusColors } from "../constants/statusColors";

const TYPE_CONFIG = {
  document: { icon: "📄", label: "Document" },
  onboarding_task: { icon: "🚀", label: "Onboarding" },
  offboarding_task: { icon: "🚪", label: "Offboarding" },
  asset_acknowledgment: { icon: "💻", label: "Asset" },
};


const FILTERS = [
  { value: "all", label: "All" },
  { value: "document", label: "Documents" },
  { value: "onboarding_task", label: "Onboarding" },
  { value: "offboarding_task", label: "Offboarding" },
  { value: "asset_acknowledgment", label: "Assets" },
];

// Human-friendly "time ago" from an ISO timestamp
const timeAgo = (isoString) => {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
};

const ApprovalsCenterPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [totalPending, setTotalPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/approvals/");
      setItems(res.data.items || []);
      setTotalPending(res.data.total_pending || 0);
    } catch (err) {
      setError("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    return items.filter((item) => item.type === activeFilter);
  }, [items, activeFilter]);

  // Count per type, for the filter tab badges
  const countsByType = useMemo(() => {
    const counts = {};
    items.forEach((item) => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });
    return counts;
  }, [items]);

  const sectionStyle = {
    background: "#0a1628",
    border: "0.5px solid #1e293b",
    borderRadius: "12px",
    padding: "24px",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>
          Approvals Center
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
          {loading ? "Loading pending items..." : `${totalPending} item${totalPending !== 1 ? "s" : ""} need your attention`}
        </p>
      </div>

      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {FILTERS.map((f) => {
          const count = f.value === "all" ? items.length : (countsByType[f.value] || 0);
          const isActive = activeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              style={{
                background: isActive ? "#1e3a5f" : "#0a1628",
                border: `0.5px solid ${isActive ? "#3b82f6" : "#1e293b"}`,
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "12px",
                color: isActive ? "#3b82f6" : "#64748b",
                fontWeight: isActive ? 500 : 400,
                cursor: "pointer",
              }}
            >
              {f.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {/* List */}
      <div style={sectionStyle}>
        {loading ? (
          <p style={{ fontSize: "13px", color: "#64748b" }}>Loading...</p>
        ) : filteredItems.length === 0 ? (
          <p style={{ fontSize: "13px", color: "#475569" }}>
            {activeFilter === "all" ? "Nothing pending — all caught up! 🎉" : "No items in this category"}
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredItems.map((item) => {
              const config = TYPE_CONFIG[item.type] || { icon: "📌", label: item.type };
              const statusStyle = statusColors[item.status] || statusColors.pending;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => navigate(item.action_path)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                    background: "#0f1a2e",
                    border: "0.5px solid #1e293b",
                    borderRadius: "8px",
                    cursor: "pointer",
                    gap: "12px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                    <span style={{ fontSize: "18px", flexShrink: 0 }}>{config.icon}</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: "13px", color: "#f1f5f9", margin: "0 0 2px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.title}
                      </p>
                      <p style={{ fontSize: "11px", color: "#64748b", margin: 0 }}>
                        {item.employee_name} · {config.label} · {timeAgo(item.created_at)}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                    <span
                      style={{
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        borderRadius: "20px",
                        padding: "3px 10px",
                        fontSize: "11px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.status.replace(/_/g, " ")}
                    </span>
                    <span style={{ color: "#475569", fontSize: "14px" }}>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalsCenterPage;