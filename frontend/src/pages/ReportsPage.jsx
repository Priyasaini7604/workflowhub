import { useState, useEffect } from "react";
import axiosInstance from "../api/axiosInstance";

const statusColors = {
  active: { bg: "#064e3b", text: "#10b981" },
  inactive: { bg: "#1e293b", text: "#94a3b8" },
  on_leave: { bg: "#451a03", text: "#f59e0b" },
  available: { bg: "#064e3b", text: "#10b981" },
  assigned: { bg: "#1e3a5f", text: "#3b82f6" },
  under_repair: { bg: "#451a03", text: "#f59e0b" },
  retired: { bg: "#1e293b", text: "#94a3b8" },
};

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState("employees");
  const [employeeReport, setEmployeeReport] = useState([]);
  const [assetReport, setAssetReport] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [empResponse, assetResponse] = await Promise.all([
        axiosInstance.get("/employees/report/"),
        axiosInstance.get("/assets/report/"),
      ]);
      setEmployeeReport(empResponse.data.results || empResponse.data);
      setAssetReport(assetResponse.data.results || assetResponse.data);
    } catch (err) {
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const tabStyle = (tab) => ({
    padding: "8px 20px",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    border: "none",
    borderRadius: "8px",
    background: activeTab === tab ? "#2563eb" : "#0a1628",
    color: activeTab === tab ? "#eff6ff" : "#64748b",
  });

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Reports & Analytics</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>View employee and asset reports</p>
      </div>

      {/* Stats Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
          <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px", letterSpacing: "0.8px" }}>TOTAL EMPLOYEES</p>
          <p style={{ fontSize: "24px", fontWeight: 500, color: "#3b82f6", margin: 0 }}>{employeeReport.length}</p>
        </div>
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
          <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px", letterSpacing: "0.8px" }}>ACTIVE</p>
          <p style={{ fontSize: "24px", fontWeight: 500, color: "#10b981", margin: 0 }}>
            {employeeReport.filter(e => e.current_status === "active").length}
          </p>
        </div>
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
          <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px", letterSpacing: "0.8px" }}>ON LEAVE</p>
          <p style={{ fontSize: "24px", fontWeight: 500, color: "#f59e0b", margin: 0 }}>
            {employeeReport.filter(e => e.current_status === "on_leave").length}
          </p>
        </div>
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
          <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px", letterSpacing: "0.8px" }}>TOTAL ASSETS</p>
          <p style={{ fontSize: "24px", fontWeight: 500, color: "#3b82f6", margin: 0 }}>{assetReport.length}</p>
        </div>
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
          <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px", letterSpacing: "0.8px" }}>AVAILABLE ASSETS</p>
          <p style={{ fontSize: "24px", fontWeight: 500, color: "#10b981", margin: 0 }}>
            {assetReport.filter(a => a.status === "available").length}
          </p>
        </div>
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "16px" }}>
          <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 6px", letterSpacing: "0.8px" }}>ASSIGNED ASSETS</p>
          <p style={{ fontSize: "24px", fontWeight: 500, color: "#f59e0b", margin: 0 }}>
            {assetReport.filter(a => a.status === "assigned").length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
        <button style={tabStyle("employees")} onClick={() => setActiveTab("employees")}>
          👥 Employee Report
        </button>
        <button style={tabStyle("assets")} onClick={() => setActiveTab("assets")}>
          💻 Asset Report
        </button>
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
          <p style={{ color: "#64748b", fontSize: "13px" }}>Loading reports...</p>
        </div>
      ) : (
        <>
          {/* Employee Report Table */}
          {activeTab === "employees" && (
            <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>EMPLOYEE ID</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>NAME</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DEPARTMENT</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DESIGNATION</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>STATUS</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>JOINING DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeReport.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#475569" }}>No data found</td>
                    </tr>
                  ) : (
                    employeeReport.map((emp) => {
                      const statusStyle = statusColors[emp.current_status] || statusColors.active;
                      return (
                        <tr key={emp.employee_id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{emp.employee_id}</td>
                          <td style={{ padding: "14px 16px", fontSize: "13px", color: "#f1f5f9" }}>{emp.full_name}</td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{emp.department}</td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{emp.designation}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                              {emp.current_status}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{emp.date_of_joining}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Asset Report Table */}
          {activeTab === "assets" && (
            <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "0.5px solid #1e293b" }}>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ASSET ID</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>TYPE</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>MODEL</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>ASSIGNED TO</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>DEPARTMENT</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>STATUS</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>CONDITION</th>
                    <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "11px", color: "#64748b", fontWeight: 500, letterSpacing: "0.8px" }}>WARRANTY</th>
                  </tr>
                </thead>
                <tbody>
                  {assetReport.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "#475569" }}>No data found</td>
                    </tr>
                  ) : (
                    assetReport.map((asset) => {
                      const statusStyle = statusColors[asset.status] || statusColors.available;
                      return (
                        <tr key={asset.asset_id} style={{ borderBottom: "0.5px solid #1e293b" }}>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{asset.asset_id}</td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{asset.asset_type}</td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#f1f5f9" }}>{asset.model_name || "—"}</td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{asset.assigned_to_name || "Unassigned"}</td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{asset.department || "—"}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
                              {asset.status}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{asset.condition}</td>
                          <td style={{ padding: "14px 16px", fontSize: "12px", color: "#64748b" }}>{asset.warranty_expiry_date || "—"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;