import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

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
          available: assets.filter(a => a.status === "available").length,
        });
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Super Admin Dashboard</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Full system overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "2rem" }}>
        {[
          { label: "TOTAL EMPLOYEES", value: stats.employees, color: "#3b82f6", bg: "#1e3a5f", path: "/employees" },
          { label: "ACTIVE EMPLOYEES", value: stats.active, color: "#10b981", bg: "#064e3b", path: "/employees" },
          { label: "TOTAL ASSETS", value: stats.assets, color: "#f59e0b", bg: "#451a03", path: "/assets" },
          { label: "AVAILABLE ASSETS", value: stats.available, color: "#818cf8", bg: "#1e1b4b", path: "/assets" },
        ].map((item) => (
          <div key={item.label} onClick={() => navigate(item.path)}
            style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px", letterSpacing: "0.8px" }}>{item.label}</p>
            <p style={{ fontSize: "28px", fontWeight: 500, color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px" }}>Quick Actions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
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
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>HR Admin Dashboard</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Employee management overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "2rem" }}>
        {[
          { label: "TOTAL EMPLOYEES", value: stats.employees, color: "#3b82f6" },
          { label: "ACTIVE", value: stats.active, color: "#10b981" },
          { label: "ON LEAVE", value: stats.on_leave, color: "#f59e0b" },
          { label: "INACTIVE", value: stats.inactive, color: "#94a3b8" },
        ].map((item) => (
          <div key={item.label} onClick={() => navigate("/employees")}
            style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px", letterSpacing: "0.8px" }}>{item.label}</p>
            <p style={{ fontSize: "28px", fontWeight: 500, color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px" }}>Quick Actions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
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
  const [stats, setStats] = useState({ total: "--", available: "--", assigned: "--", repair: "--" });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get("/assets/");
        const assets = response.data.results || response.data;
        setStats({
          total: assets.length,
          available: assets.filter(a => a.status === "available").length,
          assigned: assets.filter(a => a.status === "assigned").length,
          repair: assets.filter(a => a.status === "under_repair").length,
        });
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>IT Manager Dashboard</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Asset management overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "2rem" }}>
        {[
          { label: "TOTAL ASSETS", value: stats.total, color: "#3b82f6" },
          { label: "AVAILABLE", value: stats.available, color: "#10b981" },
          { label: "ASSIGNED", value: stats.assigned, color: "#f59e0b" },
          { label: "UNDER REPAIR", value: stats.repair, color: "#fca5a5" },
        ].map((item) => (
          <div key={item.label} onClick={() => navigate("/assets")}
            style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
            <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px", letterSpacing: "0.8px" }}>{item.label}</p>
            <p style={{ fontSize: "28px", fontWeight: 500, color: item.color, margin: 0 }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px" }}>Quick Actions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
          {[
            { label: "Add Asset", bg: "#064e3b", color: "#10b981", path: "/assets/add" },
            { label: "View Assets", bg: "#1e3a5f", color: "#3b82f6", path: "/assets" },
            { label: "View Reports", bg: "#1e1b4b", color: "#818cf8", path: "/reports" },
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
const ManagerDashboard = ({ navigate }) => {
  const [stats, setStats] = useState({ team: "--" });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get("/employees/");
        const employees = response.data.results || response.data;
        setStats({ team: employees.length });
      } catch (err) {
        console.error("Failed to fetch stats");
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>Manager Dashboard</h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Your team overview</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "2rem" }}>
        <div onClick={() => navigate("/employees")}
          style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px", cursor: "pointer" }}>
          <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 8px", letterSpacing: "0.8px" }}>TEAM MEMBERS</p>
          <p style={{ fontSize: "28px", fontWeight: 500, color: "#3b82f6", margin: 0 }}>{stats.team}</p>
        </div>
      </div>

      <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "24px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px" }}>Quick Actions</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
          {[
            { label: "View Team", bg: "#1e3a5f", color: "#3b82f6", path: "/employees" },
            { label: "View Reports", bg: "#1e1b4b", color: "#818cf8", path: "/reports" },
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
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>
          Welcome, {username}! 👋
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>Your personal workspace</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
        {[
          { label: "My Profile", desc: "View and update your profile", icon: "👤", color: "#3b82f6", bg: "#1e3a5f", path: "/my-profile" },
          { label: "My Assets", desc: "View assigned assets", icon: "💻", color: "#10b981", bg: "#064e3b", path: "/my-assets" },
          { label: "My Documents", desc: "Upload and view documents", icon: "📄", color: "#f59e0b", bg: "#451a03", path: "/my-profile" },
        ].map((item) => (
          <div key={item.label} onClick={() => navigate(item.path)}
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
      case "hr_admin":
        return <HRAdminDashboard navigate={navigate} />;
      case "it_manager":
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