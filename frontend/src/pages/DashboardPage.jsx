import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { getEffectiveAssetStatus } from "../utils/assetStatus";
import LifecycleStepper from "../components/LifecycleStepper";

// Shared responsive styles injected once for all dashboards
const DashboardResponsiveStyles = () => (
  <style>{`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 2rem;
    }
    .dashboard-actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
    }
    @media (max-width: 640px) {
      .dashboard-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .dashboard-actions-grid {
        grid-template-columns: 1fr;
        gap: 10px;
      }
      .dashboard-card {
        padding: 14px !important;
      }
      .dashboard-card-value {
        font-size: 22px !important;
      }
      .dashboard-title {
        font-size: 18px !important;
      }
    }
    @media (max-width: 380px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `}</style>
);

// ============ SUPER ADMIN DASHBOARD ============
const SuperAdminDashboard = ({ navigate }) => {
  const [stats, setStats] = useState({ employees: "--", assets: "--", active: "--", available: "--" });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [empRes, assetRes] = await Promise.all([
          axiosInstance.get("/employees/"),
          axiosInstance.get("/assets/"),
        ]);
        const employees = empRes.data.results || empRes.data;
        const assets = assetRes.data.results || assetRes.data;
        setStats({
          employees: employees.length,
          assets: assets.length,
          active: employees.filter(e => e.current_status === "active").length,
          available: assets.filter(a => getEffectiveAssetStatus(a) === "available").length,
        });
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <DashboardResponsiveStyles />
      <div style={{ marginBottom: "2rem" }}>
        <h2 className="dashboard-title" style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Super Admin Dashboard</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Full system overview</p>
      </div>

      <div className="dashboard-grid">
        {[
          { label: "TOTAL EMPLOYEES", value: stats.employees, color: "#3b82f6", bg: "#1e3a5f", path: "/employees" },
          { label: "ACTIVE EMPLOYEES", value: stats.active, color: "#10b981", bg: "#064e3b", path: "/employees" },
          { label: "TOTAL ASSETS", value: stats.assets, color: "#f59e0b", bg: "#451a03", path: "/assets" },
          { label: "AVAILABLE ASSETS", value: stats.available, color: "#818cf8", bg: "#1e1b4b", path: "/assets" },
        ].map((item) => (
          <div key={item.label} className="dashboard-card" onClick={() => navigate(item.path)}
            style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px", letterSpacing: "0.8px" }}>{item.label}</p>
            <p className="dashboard-card-value" style={{ fontSize: "28px", fontWeight: 500, color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px" }}>Quick Actions</h3>
        <div className="dashboard-actions-grid">
          {[
            { label: "Add Employee", bg: "#1e3a5f", color: "#3b82f6", path: "/employees/add" },
            { label: "Add Asset", bg: "#064e3b", color: "#10b981", path: "/assets/add" },
            { label: "View Reports", bg: "#1e1b4b", color: "#818cf8", path: "/reports" },
            { label: "Audit Logs", bg: "#451a03", color: "#f59e0b", path: "/audit-logs" },
          ].map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)}
              style={{ background: item.bg, color: item.color, border: `0.5px solid ${item.color}33`, borderRadius: "8px", padding: "12px 16px", fontSize: "12px", fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ HR ADMIN DASHBOARD ============
const HRAdminDashboard = ({ navigate }) => {
  const [stats, setStats] = useState({ employees: "--", active: "--", on_leave: "--", inactive: "--" });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get("/employees/");
        const employees = response.data.results || response.data;
        setStats({
          employees: employees.length,
          active: employees.filter(e => e.current_status === "active").length,
          on_leave: employees.filter(e => e.current_status === "on_leave").length,
          inactive: employees.filter(e => e.current_status === "inactive").length,
        });
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <DashboardResponsiveStyles />
      <div style={{ marginBottom: "2rem" }}>
        <h2 className="dashboard-title" style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>HR Admin Dashboard</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Employee management overview</p>
      </div>

      <div className="dashboard-grid">
        {[
          { label: "TOTAL EMPLOYEES", value: stats.employees, color: "#3b82f6" },
          { label: "ACTIVE", value: stats.active, color: "#10b981" },
          { label: "ON LEAVE", value: stats.on_leave, color: "#f59e0b" },
          { label: "INACTIVE", value: stats.inactive, color: "#94a3b8" },
        ].map((item) => (
          <div key={item.label} className="dashboard-card" onClick={() => navigate("/employees")}
            style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px", letterSpacing: "0.8px" }}>{item.label}</p>
            <p className="dashboard-card-value" style={{ fontSize: "28px", fontWeight: 500, color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px" }}>Quick Actions</h3>
        <div className="dashboard-actions-grid">
          {[
            { label: "Add Employee", bg: "#1e3a5f", color: "#3b82f6", path: "/employees/add" },
            { label: "Onboarding", bg: "#064e3b", color: "#10b981", path: "/onboarding" },
            { label: "Offboarding", bg: "#451a03", color: "#f59e0b", path: "/offboarding" },
            { label: "Documents", bg: "#1e1b4b", color: "#818cf8", path: "/documents" },
          ].map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)}
              style={{ background: item.bg, color: item.color, border: `0.5px solid ${item.color}33`, borderRadius: "8px", padding: "12px 16px", fontSize: "12px", fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ IT MANAGER DASHBOARD ============
const ITManagerDashboard = ({ navigate }) => {
  const [stats, setStats] = useState({ total: "--", available: "--", assigned: "--", repair: "--", retired: "--" });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get("/assets/");
        const assets = response.data.results || response.data;
        setStats({
          total: assets.length,
          available: assets.filter(a => getEffectiveAssetStatus(a) === "available").length,
          assigned: assets.filter(a => getEffectiveAssetStatus(a) === "assigned").length,
          repair: assets.filter(a => getEffectiveAssetStatus(a) === "under_repair").length,
          retired: assets.filter(a => getEffectiveAssetStatus(a) === "retired").length,
        });
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <DashboardResponsiveStyles />
      <div style={{ marginBottom: "2rem" }}>
        <h2 className="dashboard-title" style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>IT Manager Dashboard</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Asset management overview</p>
      </div>

      <div className="dashboard-grid">
        {[
          { label: "TOTAL ASSETS", value: stats.total, color: "#3b82f6", path: "/assets/stock-overview" },
          { label: "AVAILABLE", value: stats.available, color: "#10b981", path: "/assets/stock-overview" },
          { label: "ASSIGNED", value: stats.assigned, color: "#f59e0b", path: "/assets/stock-overview" },
          { label: "UNDER REPAIR", value: stats.repair, color: "#fca5a5", path: "/assets/stock-overview" },
          { label: "RETIRED", value: stats.retired, color: "#94a3b8", path: "/assets/stock-overview" },
        ].map((item) => (
          <div key={item.label} className="dashboard-card" onClick={() => navigate(item.path)}
            style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px", letterSpacing: "0.8px" }}>{item.label}</p>
            <p className="dashboard-card-value" style={{ fontSize: "28px", fontWeight: 500, color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px" }}>Quick Actions</h3>
        <div className="dashboard-actions-grid">
          {[
            { label: "Add Asset", bg: "#064e3b", color: "#10b981", path: "/assets/add" },
            { label: "View Assets", bg: "#1e3a5f", color: "#3b82f6", path: "/assets" },
            { label: "Stock Overview", bg: "#1e1b4b", color: "#818cf8", path: "/assets/stock-overview" },
            { label: "Employee Assets", bg: "#0f1a2e", color: "#94a3b8", path: "/it/employee-assets" },
            { label: "View Reports", bg: "#451a03", color: "#f59e0b", path: "/reports" },
          ].map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)}
              style={{ background: item.bg, color: item.color, border: `0.5px solid ${item.color}33`, borderRadius: "8px", padding: "12px 16px", fontSize: "12px", fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ MANAGER DASHBOARD ============
const getManagerId = (emp) => {
  if (!emp.reporting_manager) return null;
  return typeof emp.reporting_manager === "object" ? emp.reporting_manager.id : emp.reporting_manager;
};

const ManagerDashboard = ({ navigate }) => {
  const [stats, setStats] = useState({ team: "--", active: "--", inactive: "--" });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const meRes = await axiosInstance.get("/employees/me/");
        const myId = meRes.data.id;

        const allRes = await axiosInstance.get("/employees/");
        const allEmployees = allRes.data.results || allRes.data;
        const team = allEmployees.filter((emp) => getManagerId(emp) === myId);

        setStats({
          team: team.length,
          active: team.filter((e) => e.current_status === "active").length,
          inactive: team.filter((e) => e.current_status === "inactive").length,
        });
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <DashboardResponsiveStyles />
      <div style={{ marginBottom: "2rem" }}>
        <h2 className="dashboard-title" style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Manager Dashboard</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Your team overview</p>
      </div>

      <div className="dashboard-grid">
        {[
          { label: "TEAM MEMBERS", value: stats.team, color: "#3b82f6" },
          { label: "ACTIVE", value: stats.active, color: "#10b981" },
          { label: "INACTIVE", value: stats.inactive, color: "#94a3b8" },
        ].map((item) => (
          <div key={item.label} className="dashboard-card" onClick={() => navigate("/my-team")}
            style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px", letterSpacing: "0.8px" }}>{item.label}</p>
            <p className="dashboard-card-value" style={{ fontSize: "28px", fontWeight: 500, color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px" }}>Quick Actions</h3>
        <div className="dashboard-actions-grid">
          {[
            { label: "View My Team", bg: "#1e3a5f", color: "#3b82f6", path: "/my-team" },
          ].map((item) => (
            <button key={item.label} onClick={() => navigate(item.path)}
              style={{ background: item.bg, color: item.color, border: `0.5px solid ${item.color}33`, borderRadius: "8px", padding: "12px 16px", fontSize: "12px", fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============ EMPLOYEE DASHBOARD ============
const EmployeeDashboard = ({ navigate, username }) => {
  const [stats, setStats] = useState({ assets: "--", documents: "--", pending: "--" });
  const [myStatus, setMyStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get own employee profile first (gives us the employee id)
        const profileRes = await axiosInstance.get("/employees/me/");
        const empId = profileRes.data.id;
        setMyStatus({ current_status: profileRes.data.current_status, is_archived: profileRes.data.is_archived, });

        const [assetRes, docRes] = await Promise.all([
          axiosInstance.get("/assets/"),
          axiosInstance.get(`/documents/${empId}/list/`),
        ]);

        const allAssets = assetRes.data.results || assetRes.data;
        const myAssets = allAssets.filter((a) => idsMatch(a.assigned_to?.id, empId));

        const myDocuments = docRes.data.results || docRes.data;

        setStats({
          assets: myAssets.length,
          documents: myDocuments.length,
          pending: myDocuments.filter((d) => d.verification_status === "pending").length,
        });
      } catch (err) {
        console.error("Failed to fetch employee dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <DashboardResponsiveStyles />
      <div style={{ marginBottom: "2rem" }}>
        <h2 className="dashboard-title" style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>
          Welcome, {username}! 👋
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Your personal workspace</p>
      </div>
      {myStatus && (
  <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "16px", marginBottom: "1.5rem" }}>
    <LifecycleStepper currentStatus={myStatus.current_status} isArchived={myStatus.is_archived} variant="compact" />
  </div>
)}

      {/* Real-data stat cards */}
      <div className="dashboard-grid">
        {[
          { label: "MY ASSETS", value: loading ? "--" : stats.assets, color: "#10b981", path: "/my-assets" },
          { label: "MY DOCUMENTS", value: loading ? "--" : stats.documents, color: "#f59e0b", path: "/my-documents" },
          { label: "PENDING VERIFICATION", value: loading ? "--" : stats.pending, color: "#818cf8", path: "/my-documents" },
        ].map((item) => (
          <div key={item.label} className="dashboard-card" onClick={() => navigate(item.path)}
            style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px", letterSpacing: "0.8px" }}>{item.label}</p>
            <p className="dashboard-card-value" style={{ fontSize: "28px", fontWeight: 500, color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Navigation cards */}
      <div className="dashboard-grid">
        {[
          { label: "My Profile", desc: "View and update your profile", icon: "👤", color: "#3b82f6", path: "/my-profile" },
          { label: "My Assets", desc: "View assigned assets", icon: "💻", color: "#10b981", path: "/my-assets" },
          { label: "My Documents", desc: "Upload and view documents", icon: "📄", color: "#f59e0b", path: "/my-documents" },
        ].map((item) => (
          <div key={item.label} className="dashboard-card" onClick={() => navigate(item.path)}
            style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
            <span style={{ fontSize: "24px" }}>{item.icon}</span>
            <p style={{ fontSize: "14px", fontWeight: 500, color: item.color, margin: "8px 0 4px" }}>{item.label}</p>
            <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============ MAIN DASHBOARD ============
const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const renderDashboard = () => {
    switch (user?.role) {
      case "superadmin":
        return <SuperAdminDashboard navigate={navigate} />;
      case "hr":
        return <HRAdminDashboard navigate={navigate} />;
      case "it":
        return <ITManagerDashboard navigate={navigate} />;
      case "manager":
        return <ManagerDashboard navigate={navigate} />;
      case "employee":
        return <EmployeeDashboard navigate={navigate} username={user?.username} />;
      default:
        return <SuperAdminDashboard navigate={navigate} />;
    }
  };

  return renderDashboard();
};

export default DashboardPage;