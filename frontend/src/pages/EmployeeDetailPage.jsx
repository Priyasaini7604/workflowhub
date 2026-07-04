import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/AuthContext";

const statusColors = {
  active: { bg: "#064e3b", text: "#10b981" },
  inactive: { bg: "#1e293b", text: "#94a3b8" },
  on_leave: { bg: "#451a03", text: "#f59e0b" },
};

const CAN_MANAGE_ROLES = ["superadmin", "hr_admin"];

// Section accent colors keep the three cards visually distinct at a glance
const ACCENTS = {
  account: "#3b82f6",
  personal: "#a78bfa",
  employment: "#10b981",
};

function Chip({ label, value }) {
  if (!value) return null;
  return (
    <div
      style={{
        background: "#0f1a2e",
        border: "0.5px solid #1e3a5f",
        borderRadius: "8px",
        padding: "8px 14px",
        minWidth: "110px",
      }}
    >
      <p style={{ fontSize: "10px", color: "#64748b", margin: "0 0 3px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
        {label}
      </p>
      <p style={{ fontSize: "13px", color: "#f1f5f9", margin: 0, fontWeight: 500, textTransform: "capitalize" }}>
        {value.replace ? value.replace("_", " ") : value}
      </p>
    </div>
  );
}

function InfoRow({ label, value, isLast }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "130px 1fr",
        gap: "12px",
        padding: "11px 0",
        borderBottom: isLast ? "none" : "0.5px solid #16233a",
      }}
    >
      <span style={{ fontSize: "12px", color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: "13px", color: value ? "#e2e8f0" : "#3f4a5f" }}>
        {value || "—"}
      </span>
    </div>
  );
}

function SectionCard({ title, accent, rows }) {
  return (
    <div
      style={{
        background: "#0a1628",
        border: "0.5px solid #1e293b",
        borderLeft: `3px solid ${accent}`,
        borderRadius: "10px",
        padding: "18px 22px",
        height: "100%",
      }}
    >
      <h3 style={{ fontSize: "12px", fontWeight: 600, color: accent, margin: "0 0 10px", letterSpacing: "0.6px", textTransform: "uppercase" }}>
        {title}
      </h3>
      <div>
        {rows.map((row, i) => (
          <InfoRow key={row.label} label={row.label} value={row.value} isLast={i === rows.length - 1} />
        ))}
      </div>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [archiving, setArchiving] = useState(false);

  const canManage = CAN_MANAGE_ROLES.includes(user?.role);

  useEffect(() => {
    let isMounted = true;
    const fetchEmployee = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axiosInstance.get(`/employees/${id}/`);
         
        if (isMounted) setEmployee(res.data);
      } catch (err) {
        if (isMounted) {
          setError(err.response?.status === 404 ? "Employee not found" : "Failed to load employee details");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchEmployee();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleArchive = async () => {
    const confirmed = window.confirm(`Archive ${employee.first_name} ${employee.last_name}?`);
    if (!confirmed) return;
    setArchiving(true);
    try {
      await axiosInstance.post(`/employees/${id}/archive/`);
      setEmployee((prev) => ({ ...prev, current_status: "inactive" }));
    } catch (err) {
      alert("Failed to archive employee");
    } finally {
      setArchiving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ color: "#64748b", fontSize: "13px" }}>Loading employee details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", padding: "80px 0" }}>
        <p style={{ color: "#fca5a5", fontSize: "13px", marginBottom: "16px" }}>{error}</p>
        <button
          onClick={() => navigate("/employees")}
          style={{ background: "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "9px 18px", fontSize: "13px", cursor: "pointer" }}
        >
          Back to Employees
        </button>
      </div>
    );
  }

  const status = statusColors[employee.current_status] || statusColors.active;
  const initial = employee.first_name?.charAt(0)?.toUpperCase() || "?";
  const fullName = `${employee.first_name} ${employee.last_name}`;

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto" }}>
      <button
        onClick={() => navigate("/employees")}
        style={{ background: "none", border: "none", color: "#64748b", fontSize: "13px", cursor: "pointer", padding: 0, marginBottom: "16px" }}
      >
        ← Back to Employees
      </button>

      {/* Banner with floating avatar */}
      <div
        style={{
          borderRadius: "14px",
          overflow: "hidden",
          border: "0.5px solid #1e293b",
          marginBottom: "22px",
        }}
      >
        <div
          style={{
            height: "70px",
            background: "linear-gradient(90deg, #1e3a8a 0%, #1e293b 100%)",
          }}
        />
        <div style={{ background: "#0a1628", padding: "0 26px 20px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: "-32px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "16px" }}>
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  background: "#2563eb",
                  border: "4px solid #0a1628",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: 600,
                  color: "#eff6ff",
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>
              <div style={{ paddingBottom: "4px" }}>
                <h2 style={{ fontSize: "19px", fontWeight: 600, color: "#f1f5f9", margin: "0 0 4px" }}>{fullName}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontFamily: "monospace" }}>{employee.employee_id}</span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      background: status.bg,
                      color: status.text,
                      borderRadius: "20px",
                      padding: "2px 10px",
                      textTransform: "capitalize",
                    }}
                  >
                    {employee.current_status?.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            {canManage && (
              <div style={{ display: "flex", gap: "10px", paddingBottom: "4px" }}>
                <button
                  onClick={() => navigate(`/employees/${id}/edit`)}
                  style={{ background: "#1e3a5f", color: "#3b82f6", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
                >
                  Edit
                </button>
                <button
                  onClick={handleArchive}
                  disabled={archiving || employee.current_status === "inactive"}
                  style={{
                    background: "#451a03",
                    color: "#f59e0b",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    opacity: archiving || employee.current_status === "inactive" ? 0.5 : 1,
                  }}
                >
                  {archiving ? "Archiving..." : "Archive"}
                </button>
              </div>
            )}
          </div>

          {/* Quick-glance chips */}
          <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
            <Chip label="Designation" value={employee.designation} />
            <Chip label="Department" value={employee.department} />
            <Chip label="Employee Type" value={employee.employee_type} />
            <Chip label="Work Mode" value={employee.work_mode} />
          </div>
        </div>
      </div>

      {/* Detail sections */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <SectionCard
          title="Account Info"
          accent={ACCENTS.account}
          rows={[
            { label: "Username", value: employee.username },
            { label: "Official Email", value: employee.official_email },
            { label: "Role", value: employee.role },
          ]}
        />
        <SectionCard
          title="Personal Info"
          accent={ACCENTS.personal}
          rows={[
            { label: "Personal Email", value: employee.personal_email },
            { label: "Mobile Number", value: employee.mobile_number },
            { label: "Gender", value: employee.gender },
            { label: "Date of Birth", value: employee.date_of_birth },
          ]}
        />
      </div>

      <SectionCard
        title="Employment Info"
        accent={ACCENTS.employment}
        rows={[
          { label: "Date of Joining", value: employee.date_of_joining },
          { label: "Reporting Manager", value: employee.reporting_manager_name },
        ]}
      />
    </div>
  );
}