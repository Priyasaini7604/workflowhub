import { useState, useEffect, useMemo } from "react";
import axiosInstance from "../api/axiosInstance";

const ROLE_COLORS = {
  superadmin: { bg: "#450a0a", text: "#f87171" },
  hr: { bg: "#064e3b", text: "#10b981" },
  it: { bg: "#1e3a5f", text: "#3b82f6" },
  manager: { bg: "#451a03", text: "#f59e0b" },
  employee: { bg: "#1e293b", text: "#94a3b8" },
};

const ROLE_FILTERS = [
  { value: "all", label: "All Roles" },
  { value: "superadmin", label: "Super Admin" },
  { value: "hr", label: "HR" },
  { value: "it", label: "IT Admin" },
  { value: "manager", label: "Manager" },
  { value: "employee", label: "Employee" },
];

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/users/list/");
      setUsers(res.data);
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user) => {
    const action = user.is_active ? "deactivate" : "activate";
    if (!window.confirm(`${action === "deactivate" ? "Deactivate" : "Activate"} "${user.username}"?`)) return;

    setTogglingId(user.id);
    try {
      await axiosInstance.patch(`/users/${user.id}/${action}/`, {});
      fetchUsers();
    } catch (err) {
      setError(`Failed to ${action} user`);
    } finally {
      setTogglingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        u.username?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term);
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, searchTerm]);

  const inputStyle = {
    background: "#0f1a2e",
    border: "0.5px solid #1e293b",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "12px",
    color: "#f1f5f9",
    outline: "none",
    boxSizing: "border-box",
  };

  const sectionStyle = {
    background: "#0a1628",
    border: "0.5px solid #1e293b",
    borderRadius: "12px",
    overflow: "hidden",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>
          User Management
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
          Manage user accounts and access status
        </p>
      </div>

      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by username or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: "220px" }}
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={inputStyle}
        >
          {ROLE_FILTERS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={sectionStyle}>
        {loading ? (
          <div style={{ padding: "24px", textAlign: "center" }}>
            <p style={{ color: "#64748b", fontSize: "13px" }}>Loading...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: "24px", textAlign: "center" }}>
            <p style={{ color: "#475569", fontSize: "13px" }}>No users match your filters</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", color: "#64748b", letterSpacing: "0.8px" }}>USERNAME</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", color: "#64748b", letterSpacing: "0.8px" }}>EMAIL</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", color: "#64748b", letterSpacing: "0.8px" }}>ROLE</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", color: "#64748b", letterSpacing: "0.8px" }}>STATUS</th>
                <th style={{ textAlign: "right", padding: "12px 16px", fontSize: "11px", color: "#64748b", letterSpacing: "0.8px" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const roleStyle = ROLE_COLORS[u.role] || ROLE_COLORS.employee;
                return (
                  <tr key={u.id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                    <td style={{ padding: "12px 16px", fontSize: "13px", color: "#f1f5f9" }}>{u.username}</td>
                    <td style={{ padding: "12px 16px", fontSize: "12px", color: "#64748b" }}>{u.email || "—"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: roleStyle.bg, color: roleStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        style={{
                          background: u.is_active ? "#064e3b" : "#1e293b",
                          color: u.is_active ? "#10b981" : "#64748b",
                          borderRadius: "20px",
                          padding: "3px 10px",
                          fontSize: "11px",
                        }}
                      >
                        {u.is_active ? "active" : "inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button
                        onClick={() => handleToggleActive(u)}
                        disabled={togglingId === u.id}
                        style={{
                          background: u.is_active ? "#450a0a" : "#064e3b",
                          color: u.is_active ? "#fca5a5" : "#10b981",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 14px",
                          fontSize: "11px",
                          cursor: "pointer",
                          opacity: togglingId === u.id ? 0.6 : 1,
                        }}
                      >
                        {togglingId === u.id
                          ? "Working..."
                          : u.is_active
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagementPage;