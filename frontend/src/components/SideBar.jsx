import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const menuItems = {
  superadmin: [
    { label: "Dashboard", icon: "🏠", path: "/dashboard" },
    { label: "Employees", icon: "👥", path: "/employees" },
    { label: "IT Assets", icon: "💻", path: "/assets" },
    { label: "Leave Management", icon: "📅", path: "/leaves" },
    { label: "Documents", icon: "📄", path: "/documents" },
    { label: "Reports", icon: "📊", path: "/reports" },
  ],
  hr_admin: [
    { label: "Dashboard", icon: "🏠", path: "/dashboard" },
    { label: "Employees", icon: "👥", path: "/employees" },
    { label: "Leave Management", icon: "📅", path: "/leaves" },
    { label: "Documents", icon: "📄", path: "/documents" },
    { label: "Reports", icon: "📊", path: "/reports" },
  ],
  it_manager: [
    { label: "Dashboard", icon: "🏠", path: "/dashboard" },
    { label: "IT Assets", icon: "💻", path: "/assets" },
    { label: "Reports", icon: "📊", path: "/reports" },
  ],
  employee: [
    { label: "Dashboard", icon: "🏠", path: "/dashboard" },
    { label: "My Assets", icon: "💻", path: "/my-assets" },
    { label: "My Leaves", icon: "📅", path: "/my-leaves" },
    { label: "Documents", icon: "📄", path: "/documents" },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const role = user?.role || "employee";
  const items = menuItems[role] || menuItems.employee;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const firstLetter = user?.username?.charAt(0).toUpperCase() || "U";

  return (
    <div style={{
      width: "220px",
      background: "#0a1628",
      borderRight: "0.5px solid #1e293b",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "16px 12px",
      flexShrink: 0,
      minHeight: "100vh",
      position: "fixed",
      left: 0,
      top: 0,
      bottom: 0,
    }}>

      {/* Top — Logo + Menu */}
      <div>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px", padding: "0 4px" }}>
          <div style={{ width: "30px", height: "30px", background: "#1d4ed8", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "15px", height: "15px" }} fill="none" viewBox="0 0 24 24" stroke="#93c5fd" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>WorkflowHub</p>
            <p style={{ fontSize: "10px", color: "#475569", margin: 0 }}>MPRW Research</p>
          </div>
        </div>

        {/* Menu Label */}
        <p style={{ fontSize: "10px", color: "#475569", letterSpacing: "0.8px", margin: "0 0 8px 4px" }}>MAIN MENU</p>

        {/* Menu Items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {items.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 10px",
                  background: isActive ? "#1e3a5f" : "transparent",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  width: "100%",
                  textAlign: "left",
                  transition: "background 0.2s",
                }}
              >
                <span style={{ fontSize: "16px" }}>{item.icon}</span>
                <span style={{ fontSize: "13px", color: isActive ? "#3b82f6" : "#64748b", fontWeight: isActive ? 500 : 400 }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom — User Info + Logout */}
      <div>
        <div style={{ height: "0.5px", background: "#1e293b", marginBottom: "12px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px" }}>
          <div style={{ width: "28px", height: "28px", background: "#1e3a5f", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: "11px", fontWeight: 500, color: "#3b82f6" }}>{firstLetter}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "12px", fontWeight: 500, color: "#f1f5f9", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.username}</p>
            <p style={{ fontSize: "10px", color: "#475569", margin: 0 }}>{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{ background: "transparent", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0 }}
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
};

export default Sidebar;