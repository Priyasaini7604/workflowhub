import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#060b14" }}>

      {/* Navbar */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 32px", background: "#0a1628", borderBottom: "0.5px solid #1e293b" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", background: "#1d4ed8", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="#93c5fd" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>WorkflowHub</p>
            <p style={{ fontSize: "10px", color: "#475569", margin: 0 }}>by MPRW Research Workshop</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "13px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>{user?.username}</p>
            <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", color: "#fca5a5", fontSize: "12px", cursor: "pointer" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "14px", height: "14px" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ padding: "2rem" }}>

        {/* Welcome */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>
            Welcome back, {user?.username}! 👋
          </h2>
          <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
            Logged in as <span style={{ color: "#3b82f6" }}>{user?.role}</span>
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "2rem" }}>

          <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 500, color: "#64748b", margin: 0, letterSpacing: "0.8px" }}>EMPLOYEES</p>
              <div style={{ width: "32px", height: "32px", background: "#1e3a5f", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <p style={{ fontSize: "28px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>--</p>
            <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>Total employees</p>
          </div>

          <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 500, color: "#64748b", margin: 0, letterSpacing: "0.8px" }}>IT ASSETS</p>
              <div style={{ width: "32px", height: "32px", background: "#064e3b", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p style={{ fontSize: "28px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>--</p>
            <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>Total assets</p>
          </div>

          <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <p style={{ fontSize: "11px", fontWeight: 500, color: "#64748b", margin: 0, letterSpacing: "0.8px" }}>PENDING LEAVES</p>
              <div style={{ width: "32px", height: "32px", background: "#451a03", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "16px", height: "16px" }} fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p style={{ fontSize: "28px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 4px" }}>--</p>
            <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>Awaiting approval</p>
          </div>

        </div>

        {/* Quick Actions */}
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "12px", padding: "24px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 16px" }}>Quick Actions</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
            {[
              { label: "Add Employee", bg: "#1e3a5f", color: "#3b82f6" },
              { label: "Add Asset", bg: "#064e3b", color: "#10b981" },
              { label: "Leave Requests", bg: "#451a03", color: "#f59e0b" },
              { label: "View Reports", bg: "#1e1b4b", color: "#818cf8" },
            ].map((item) => (
              <button key={item.label}
                style={{ background: item.bg, color: item.color, border: `0.5px solid ${item.color}33`, borderRadius: "8px", padding: "12px 16px", fontSize: "12px", fontWeight: 500, cursor: "pointer", textAlign: "left" }}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;