import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import SoftwareAccessSection from '../pages/SoftwareAccessSection';

const statusColors = {
  joining_pending: { bg: "#1e293b", text: "#94a3b8" },
  active: { bg: "#064e3b", text: "#10b981" },
  notice_period: { bg: "#451a03", text: "#f59e0b" },
  offboarding: { bg: "#450a0a", text: "#f87171" },
  exited: { bg: "#1e293b", text: "#64748b" },
};

const VALID_NEXT = {
  joining_pending: ["active"],
  active: ["notice_period"],
  notice_period: ["offboarding"],
  offboarding: ["exited"],
  exited: [],
};

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusError, setStatusError] = useState("");
  const [changingStatus, setChangingStatus] = useState(false);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/employees/${id}/`);
      setEmployee(response.data);
    } catch (err) {
      setError("Failed to load employee details");
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm("Are you sure you want to archive this employee?")) return;
    try {
      await axiosInstance.post(`/employees/${id}/archive/`);
      navigate("/employees");
    } catch (err) {
      setError("Failed to archive employee");
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`Change status to "${newStatus}"?`)) return;
    setChangingStatus(true);
    setStatusError("");
    try {
      await axiosInstance.patch(`/employees/${id}/status/`, { new_status: newStatus });
      fetchEmployee(); // refresh karke naya status dikhao
    } catch (err) {
      setStatusError(err.response?.data?.new_status?.[0] || "Failed to change status");
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "60px 0" }}>
      <p style={{ color: "#64748b", fontSize: "13px" }}>Loading employee details...</p>
    </div>
  );

  if (error) return (
    <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "12px" }}>
      <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
    </div>
  );

  const statusStyle = statusColors[employee?.current_status] || statusColors.active;

  const sectionStyle = {
    background: "#0a1628",
    border: "0.5px solid #1e293b",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "16px",
  };

  const sectionTitleStyle = {
    fontSize: "14px",
    fontWeight: 500,
    color: "#f1f5f9",
    margin: "0 0 20px",
    paddingBottom: "12px",
    borderBottom: "0.5px solid #1e293b",
  };

  const fieldLabel = {
    fontSize: "11px",
    color: "#64748b",
    margin: "0 0 4px",
    letterSpacing: "0.8px",
  };

  const fieldValue = {
    fontSize: "13px",
    color: "#f1f5f9",
    margin: 0,
  };

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/employees")}
            style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "8px", padding: "8px 12px", color: "#64748b", fontSize: "12px", cursor: "pointer" }}
          >
            ← Back
          </button>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Employee Detail</h2>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>View employee information</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => navigate(`/employees/${id}/edit`)}
            style={{ background: "#064e3b", color: "#10b981", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
          >
            ✏️ Edit
          </button>
          <button
            onClick={handleArchive}
            style={{ background: "#451a03", color: "#f59e0b", border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
          >
            🗄️ Archive
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div style={{ ...sectionStyle, display: "flex", alignItems: "center", gap: "20px" }}>
        <div style={{ width: "64px", height: "64px", background: "#1e3a5f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: "24px", color: "#3b82f6", fontWeight: 500 }}>
            {employee?.first_name?.charAt(0)}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: "18px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>
            {employee?.first_name} {employee?.middle_name} {employee?.last_name}
          </h3>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 8px" }}>
            {employee?.designation} — {employee?.department}
          </p>

          {/* Status row — badge + id + type + change-status dropdown, all in ONE row */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <span style={{ background: statusStyle.bg, color: statusStyle.text, borderRadius: "20px", padding: "3px 10px", fontSize: "11px" }}>
              {employee?.current_status}
            </span>
            <span style={{ fontSize: "12px", color: "#475569" }}>
              {employee?.employee_id}
            </span>
            <span style={{ fontSize: "12px", color: "#475569" }}>
              {employee?.employee_type}
            </span>

            {VALID_NEXT[employee?.current_status]?.length > 0 && (
              <select
                disabled={changingStatus}
                onChange={(e) => e.target.value && handleStatusChange(e.target.value)}
                value=""
                style={{ background: "#0f1a2e", border: "0.5px solid #1e3a5f", borderRadius: "6px", padding: "4px 8px", fontSize: "11px", color: "#f1f5f9" }}
              >
                <option value="">Change Status →</option>
                {VALID_NEXT[employee?.current_status].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>

          {statusError && (
            <p style={{ color: "#fca5a5", fontSize: "12px", marginTop: "6px" }}>{statusError}</p>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>👤 Personal Information</h3>
        <div style={gridStyle}>
          <div>
            <p style={fieldLabel}>GENDER</p>
            <p style={fieldValue}>{employee?.gender || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>DATE OF BIRTH</p>
            <p style={fieldValue}>{employee?.date_of_birth || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>BLOOD GROUP</p>
            <p style={fieldValue}>{employee?.blood_group || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>PERSONAL EMAIL</p>
            <p style={fieldValue}>{employee?.personal_email || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>MOBILE NUMBER</p>
            <p style={fieldValue}>{employee?.mobile_number || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>ALTERNATE MOBILE</p>
            <p style={fieldValue}>{employee?.alternate_mobile_number || "—"}</p>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>🚨 Emergency Contact</h3>
        <div style={gridStyle}>
          <div>
            <p style={fieldLabel}>NAME</p>
            <p style={fieldValue}>{employee?.emergency_contact_name || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>NUMBER</p>
            <p style={fieldValue}>{employee?.emergency_contact_number || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>RELATIONSHIP</p>
            <p style={fieldValue}>{employee?.emergency_contact_relationship || "—"}</p>
          </div>
        </div>
      </div>

      {/* Employment Info */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>💼 Employment Information</h3>
        <div style={gridStyle}>
          <div>
            <p style={fieldLabel}>OFFICIAL EMAIL</p>
            <p style={fieldValue}>{employee?.official_email || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>DATE OF JOINING</p>
            <p style={fieldValue}>{employee?.date_of_joining || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>WORK MODE</p>
            <p style={fieldValue}>{employee?.work_mode || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>CONFIRMATION DATE</p>
            <p style={fieldValue}>{employee?.confirmation_date || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>PROBATION END DATE</p>
            <p style={fieldValue}>{employee?.probation_end_date || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>REPORTING MANAGER</p>
            <p style={fieldValue}>{employee?.reporting_manager || "—"}</p>
          </div>
        </div>
      </div>

      {/* Lifecycle Info */}
      <div style={sectionStyle}>
        <h3 style={sectionTitleStyle}>📋 Lifecycle Information</h3>
        <div style={gridStyle}>
          <div>
            <p style={fieldLabel}>STATUS START DATE</p>
            <p style={fieldValue}>{employee?.status_start_date || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>NOTICE PERIOD START</p>
            <p style={fieldValue}>{employee?.notice_period_start_date || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>LAST WORKING DATE</p>
            <p style={fieldValue}>{employee?.last_working_date || "—"}</p>
          </div>
          <div>
            <p style={fieldLabel}>EXIT DATE</p>
            <p style={fieldValue}>{employee?.exit_date || "—"}</p>
          </div>
        </div>
      </div>
      {/* Software Access */}
      <SoftwareAccessSection employeeId={id} />
    </div>
  );
};

export default EmployeeDetailPage;