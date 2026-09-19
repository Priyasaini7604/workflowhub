import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";
import { statusColors } from "../constants/statusColors";

// reporting_manager may come back as a plain FK id or a nested object,
// depending on the serializer — handle both.
const getManagerId = (emp) => {
  if (!emp.reporting_manager) return null;
  return typeof emp.reporting_manager === "object" ? emp.reporting_manager.id : emp.reporting_manager;
};

const MyTeamPage = () => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setLoading(true);
    try {
      const meRes = await axiosInstance.get("/employees/me/");
      const myId = meRes.data.id;

      const allRes = await axiosInstance.get("/employees/");
      const allEmployees = allRes.data.results || allRes.data;

      setTeam(allEmployees.filter((emp) => getManagerId(emp) === myId));
    } catch (err) {
      setError("Failed to load team data");
    } finally {
      setLoading(false);
    }
  };

  const filteredTeam = team.filter(
    (emp) =>
      emp.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>My Team</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Your direct reports and their current status (read-only)</p>
      </div>

      {/* Search */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", maxWidth: "320px" }}>
        <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "15px", height: "15px" }} fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          placeholder="Search by name or ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "13px", color: "#f1f5f9" }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "#64748b", fontSize: "13px" }}>Loading team...</p>
        </div>
      ) : (
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>NAME</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>EMPLOYEE ID</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DESIGNATION</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DEPARTMENT</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeam.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#475569" }}>
                      No team members found
                    </td>
                  </tr>
                ) : (
                  filteredTeam.map((emp) => {
                    const statusStyle = statusColors[emp.current_status] || statusColors.active;
                    return (
                      <tr key={emp.id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", background: "#1e3a5f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 500 }}>
                                {emp.full_name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0 }}>{emp.full_name}</p>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{emp.employee_id}</td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{emp.designation}</td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{emp.department}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                            {emp.current_status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTeamPage;