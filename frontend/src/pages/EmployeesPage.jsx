import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { statusColors } from "../constants/statusColors";
import EmptyState from "../components/EmptyState";

// Consolidated style constants — no more repeated inline style objects
import { thStyle, tdMutedStyle, badgeStyle, actionBtnStyle, viewBtnColors, editBtnColors } from "../utils/tableStyles";

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

  // Pagination state
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const employeeIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "22px", height: "22px" }} fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  );

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchEmployees(1); // filter/search change hone par page 1 pe reset
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [showArchived, search]);

  const fetchEmployees = async (pageNum = page) => {
    setLoading(true);
    setError("");
    try {
      const response = await axiosInstance.get(
        `/employees/?archived=${showArchived}&search=${encodeURIComponent(search)}&page=${pageNum}`
      );
      const payload = response.data;
      setEmployees(payload.results || payload);
      setCount(payload.count ?? (payload.results || payload).length);
      setPage(pageNum);
    } catch (err) {
      setError("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    fetchEmployees(p);
  };

  return (
    <div>
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

      {error && (
        <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
          <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
        </div>
      )}

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
                  <th style={thStyle}>NAME</th>
                  <th style={thStyle}>EMPLOYEE ID</th>
                  <th style={thStyle}>DEPARTMENT</th>
                  <th style={thStyle}>DESIGNATION</th>
                  <th style={thStyle}>ROLE</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={thStyle}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <EmptyState
                        icon={employeeIcon}
                        title={showArchived ? "No Archived Employees found" : "No Employees found"}
                        message={
                          search
                            ? "Try a different search term."
                            : showArchived
                            ? "Employees you archive will show up here."
                            : "Get started by adding your first employee."
                        }
                        actionLabel={!search && !showArchived ? "+ Add Employee" : undefined}
                        onAction={() => navigate("/employees/add")}
                      />
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => {
                    const statusStyle = statusColors[emp.current_status] || statusColors.active;
                    const roleStyle = statusColors[emp.role] || statusColors.employee;
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
                        <td style={tdMutedStyle}>{emp.employee_id || "—"}</td>
                        <td style={tdMutedStyle}>{emp.department}</td>
                        <td style={tdMutedStyle}>{emp.designation}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={badgeStyle(roleStyle)}>
                            {roleLabels[emp.role] || emp.role || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={badgeStyle(statusStyle)}>
                            {emp.current_status}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <div style={{ display: "flex", gap: "6px" }}>
                           <button
  onClick={() => navigate(`/employees/${emp.id}`)}
  style={actionBtnStyle(viewBtnColors)}>View</button>
<button
  onClick={() => navigate(`/employees/${emp.id}/edit`)}
  style={actionBtnStyle(editBtnColors)}>Edit</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", padding: "16px", borderTop: "0.5px solid #1e293b" }}>
              <button
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                style={{ background: "#0a1628", color: page === 1 ? "#334155" : "#94a3b8", border: "0.5px solid #1e293b", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: page === 1 ? "not-allowed" : "pointer" }}>
                Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  style={{
                    background: p === page ? "#2563eb" : "#0a1628",
                    color: p === page ? "#eff6ff" : "#94a3b8",
                    border: "0.5px solid #1e293b",
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}>
                  {p}
                </button>
              ))}

              <button
                onClick={() => goToPage(page + 1)}
                disabled={page === totalPages}
                style={{ background: "#0a1628", color: page === totalPages ? "#334155" : "#94a3b8", border: "0.5px solid #1e293b", borderRadius: "6px", padding: "6px 12px", fontSize: "12px", cursor: page === totalPages ? "not-allowed" : "pointer" }}>
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;