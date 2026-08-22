import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { statusColors } from "../constants/statusColors";

const roleColors = {
  superadmin: { bg: "#1e1b4b", text: "#818cf8" },
  hr: { bg: "#064e3b", text: "#10b981" },
  manager: { bg: "#451a03", text: "#f59e0b" },
  it: { bg: "#1e3a5f", text: "#3b82f6" },
  employee: { bg: "#1e293b", text: "#94a3b8" },
};

const roleLabels = {
  superadmin: "Super Admin",
  hr: "HR",
  manager: "Manager",
  it: "IT Admin",
  employee: "Employee",
};

const EmployeesPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
  const delayDebounce = setTimeout(() => {
    fetchEmployees();
  }, 400); // typing rukne ke 400ms baad hi call jaaye

  return () => clearTimeout(delayDebounce);
}, [showArchived, search]);

const fetchEmployees = async () => {
  setLoading(true);
  setError("");
  try {
    const response = await axiosInstance.get(
      `/employees/?archived=${showArchived}&search=${encodeURIComponent(search)}`
    );
    setEmployees(response.data.results || response.data);
  } catch (err) {
    setError("Failed to load employees");
  } finally {
    setLoading(false);
  }
};


  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Employee Management</h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Manage all employees</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
  <button
    onClick={() => setShowArchived(!showArchived)}
    style={{
      background: showArchived ? "#451a03" : "#0a1628",
      color: showArchived ? "#f59e0b" : "#94a3b8",
      border: "0.5px solid #1e293b",
      borderRadius: "8px",
      padding: "10px 14px",
      fontSize: "13px",
      cursor: "pointer",
    }}
  >
    {showArchived ? "🗄️ Showing Archived" : "👥 Showing Active"}
  </button>
  <button
    onClick={() => navigate("/employees/bulk-import")}
    style={{ background: "#0a1628", color: "#94a3b8", border: "0.5px solid #1e3a5f", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
    📤 Bulk Import
  </button>
  <button
    onClick={() => navigate("/employees/add-candidate")}
    style={{ background: "#0a1628", color: "#94a3b8", border: "0.5px solid #1e3a5f", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
    + Add Candidate
  </button>
  <button
    onClick={() => navigate("/employees/add")}
    style={{ background: "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
    + Add Employee
  </button>
</div>
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
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
              <thead>
                <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>NAME</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>EMPLOYEE ID</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DEPARTMENT</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DESIGNATION</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ROLE</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>STATUS</th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#475569" }}>
                      {showArchived ? "No archived employees found" : "No employees found"}
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const statusStyle = statusColors[emp.current_status] || statusColors.active;
                    const roleStyle = roleColors[emp.role] || roleColors.employee;
                    return (
                      <tr key={emp.id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", background: "#1e3a5f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <span style={{ fontSize: "12px", color: "#3b82f6", fontWeight: 500 }}>
                                {emp.full_name?.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0, whiteSpace: "nowrap" }}>
                              {emp.full_name}
                            </p>
                          </div>
                        </td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{emp.employee_id}</td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{emp.department}</td>
                        <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{emp.designation}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: roleStyle.bg, color: roleStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                            {roleLabels[emp.role] || emp.role || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                            {emp.current_status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              onClick={() => navigate(`/employees/${emp.id}`)}
                              style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>View</button>
                            <button
                              onClick={() => navigate(`/employees/${emp.id}/edit`)}
                              style={{ background: "#064e3b", color: "#10b981", border: "none", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", cursor: "pointer" }}>Edit</button>
                          </div>
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

export default EmployeesPage;