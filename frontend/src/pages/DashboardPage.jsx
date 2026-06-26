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
    <div className="min-h-screen" style={{ background: "#060b14" }}>

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4"
        style={{ borderBottom: "0.5px solid #1e293b", background: "#0a1628" }}>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "#1d4ed8" }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"
              fill="none" viewBox="0 0 24 24" stroke="#93c5fd" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>WorkflowHub</p>
            <p className="text-xs" style={{ color: "#475569" }}>by MPRW Research Workshop</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium" style={{ color: "#f1f5f9" }}>{user?.name}</p>
            <p className="text-xs" style={{ color: "#475569" }}>{user?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition"
            style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", color: "#fca5a5" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8">

        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-medium mb-1" style={{ color: "#f1f5f9" }}>
            Welcome back, {user?.username}! 👋
          </h2>
          <p className="text-sm" style={{ color: "#64748b" }}>
           Logged in as <span>{user?.role}</span> 
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

          <div className="rounded-xl p-5" style={{ background: "#0a1628", border: "0.5px solid #1e293b" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: "#64748b", letterSpacing: "0.8px" }}>EMPLOYEES</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "#1e3a5f" }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"
                  fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-medium" style={{ color: "#f1f5f9" }}>--</p>
            <p className="text-xs mt-1" style={{ color: "#475569" }}>Total employees</p>
          </div>

          <div className="rounded-xl p-5" style={{ background: "#0a1628", border: "0.5px solid #1e293b" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: "#64748b", letterSpacing: "0.8px" }}>IT ASSETS</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "#064e3b" }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"
                  fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-medium" style={{ color: "#f1f5f9" }}>--</p>
            <p className="text-xs mt-1" style={{ color: "#475569" }}>Total assets</p>
          </div>

          <div className="rounded-xl p-5" style={{ background: "#0a1628", border: "0.5px solid #1e293b" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium" style={{ color: "#64748b", letterSpacing: "0.8px" }}>PENDING LEAVES</p>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "#451a03" }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"
                  fill="none" viewBox="0 0 24 24" stroke="#f59e0b" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-medium" style={{ color: "#f1f5f9" }}>--</p>
            <p className="text-xs mt-1" style={{ color: "#475569" }}>Awaiting approval</p>
          </div>

        </div>

        {/* Quick Actions */}
        <div className="rounded-xl p-6" style={{ background: "#0a1628", border: "0.5px solid #1e293b" }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: "#f1f5f9" }}>Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Add Employee", color: "#1e3a5f", text: "#3b82f6" },
              { label: "Add Asset", color: "#064e3b", text: "#10b981" },
              { label: "Leave Requests", color: "#451a03", text: "#f59e0b" },
              { label: "View Reports", color: "#1e1b4b", text: "#818cf8" },
            ].map((item) => (
              <button key={item.label}
                className="rounded-lg py-3 px-4 text-xs font-medium text-left transition hover:opacity-80"
                style={{ background: item.color, color: item.text, border: `0.5px solid ${item.text}22` }}>
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