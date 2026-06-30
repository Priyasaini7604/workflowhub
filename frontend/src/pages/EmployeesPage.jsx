import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const statusColors = {
  active: { bg: "#064e3b", text: "#10b981" },
  inactive: { bg: "#1e293b", text: "#94a3b8" },
  on_leave: { bg: "#451a03", text: "#f59e0b" },
};

const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/employees/");
      setEmployees(response.data.results || response.data);
    } catch (err) {
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Employee Management</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Manage all employees</p>
        </div>
        <button style={{ background: "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
          + Add Employee
        </button>
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

      {/* Loading */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "#64748b", fontSize: "13px" }}>Loading employees...</p>
        </div>
      ) : (
        /* Table */
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>EMPLOYEE</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DEPARTMENT</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DESIGNATION</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>STATUS</th>
                <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#475569" }}>
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const statusStyle = statusColors[emp.current_status] || statusColors.active;
                  return (
                    <tr key={emp.id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", background: "#1e3a5f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 500 }}>
                              {emp.first_name?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0 }}>
                              {emp.first_name} {emp.last_name}
                            </p>
                            <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{emp.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{emp.department}</td>
                      <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{emp.designation}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                          {emp.current_status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>View</button>
                          <button style={{ background: "#064e3b", color: "#10b981", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>Edit</button>
                        </div>
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

export default EmployeesPage;