import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const actionColors = {
  create: { bg: "#064e3b", text: "#10b981" },
  update: { bg: "#1e3a5f", text: "#3b82f6" },
  delete: { bg: "#1a0a0a", text: "#fca5a5" },
  view: { bg: "#1e293b", text: "#94a3b8" },
};

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLogs();
    }, 400); // typing rukne ke 400ms baad hi call jaaye

    return () => clearTimeout(delayDebounce);
  }, [search, filterAction]);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterAction) params.append("action", filterAction);

      const response = await axiosInstance.get(`/audit/?${params.toString()}`);
      const results = response.data.results || response.data;
      setLogs(results);
      setTotalCount(response.data.count ?? results.length);
    } catch (err) {
      setError("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Audit Logs</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Track all system activities</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "10px 14px", flex: 1, maxWidth: "320px" }}>
          <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "15px", height: "15px" }} fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "#f1f5f9" }}
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "#64748b", outline: "none" }}
        >
          <option value="">All Actions</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
          <option value="view">View</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "#64748b", fontSize: "13px" }}>Loading audit logs...</p>
        </div>
      ) : (
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "16px", borderBottom: "0.5px solid #1e293b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>Total: {totalCount} logs</p>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ACTION</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>MODEL</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DESCRIPTION</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>USER</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>IP ADDRESS</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>TIME</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#475569" }}>
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const actionStyle = actionColors[log.action] || actionColors.view;
                  return (
                    <tr key={log.id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: actionStyle.bg, color: actionStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#f1f5f9" }}>{log.model_name}</td>
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b", maxWidth: "300px" }}>{log.description}</td>
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>
                        {log.user ? (log.user.username || log.user.email || "Unknown") : "System"}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{log.ip_address || "—"}</td>
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;