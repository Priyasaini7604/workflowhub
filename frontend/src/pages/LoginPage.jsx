import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../api/axiosInstance";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axiosInstance.post("/users/login/", {
        username: email,
        password,
      });
      const { access, refresh, user } = response.data;
      login(user, access, refresh);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#060b14" }}>

      {/* Left Side */}
      <div style={{ flex: 1.2, padding: "2.5rem", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }} className="hidden-mobile">

        {/* Background orbs */}
        <div style={{ position: "absolute", top: "-80px", left: "25%", width: "320px", height: "320px", background: "#1d4ed8", borderRadius: "50%", opacity: 0.06, pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-40px", width: "220px", height: "220px", background: "#7c3aed", borderRadius: "50%", opacity: 0.07, pointerEvents: "none" }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", position: "relative" }}>
          <div style={{ width: "36px", height: "36px", background: "#1d4ed8", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "18px", height: "18px" }} fill="none" viewBox="0 0 24 24" stroke="#93c5fd" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <div>
            <p style={{ fontSize: "15px", fontWeight: 500, color: "#f1f5f9", margin: 0 }}>WorkflowHub</p>
            <p style={{ fontSize: "10px", color: "#475569", margin: 0 }}>by MPRW Research Workshop</p>
          </div>
        </div>

        {/* Tagline + Stats */}
        <div style={{ position: "relative" }}>
          <h1 style={{ fontSize: "48px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 12px", lineHeight: 1.2 }}>
            Track.<br />
            <span style={{ color: "#3b82f6" }}>Manage.</span><br />
            Grow.
          </h1>
          <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.8, margin: "0 0 2.5rem", maxWidth: "280px" }}>
            A unified platform for HR operations and IT asset lifecycle management — built for modern teams.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div>
              <p style={{ fontSize: "22px", fontWeight: 500, color: "#3b82f6", margin: 0 }}>50+</p>
              <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>Employees</p>
            </div>
            <div style={{ width: "0.5px", height: "32px", background: "#1e293b" }} />
            <div>
              <p style={{ fontSize: "22px", fontWeight: 500, color: "#10b981", margin: 0 }}>200+</p>
              <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>Assets tracked</p>
            </div>
            <div style={{ width: "0.5px", height: "32px", background: "#1e293b" }} />
            <div>
              <p style={{ fontSize: "22px", fontWeight: 500, color: "#f59e0b", margin: 0 }}>100%</p>
              <p style={{ fontSize: "11px", color: "#475569", margin: 0 }}>Secure</p>
            </div>
          </div>
        </div>

        <p style={{ fontSize: "11px", color: "#1e3a5f", margin: 0, position: "relative" }}>© 2025 WorkflowHub · MPRW Research Workshop</p>
      </div>

      {/* Right Side */}
      <div style={{ width: "420px", display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem 2.5rem", borderLeft: "none" }} className="right-side">

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "inline-block", background: "#0f1a2e", border: "0.5px solid #1e3a5f", borderRadius: "20px", padding: "3px 12px", marginBottom: "10px" }}>
            <span style={{ fontSize: "11px", color: "#38bdf8", letterSpacing: "0.8px" }}>SECURE WORKSPACE</span>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 500, color: "#f1f5f9", margin: "0 0 5px" }}>Welcome back</h2>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Sign in to your dashboard</p>
        </div>

        {/* Form */}
        <div style={{ background: "#0a1628", border: "0.5px solid #1e293b", borderRadius: "14px", padding: "1.5rem" }}>

          {error && (
            <div style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", borderRadius: "8px", padding: "10px 12px", marginBottom: "1rem" }}>
              <p style={{ fontSize: "12px", color: "#fca5a5", margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "#64748b", marginBottom: "5px", letterSpacing: "0.8px" }}>EMAIL</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#0f1a2e", border: "0.5px solid #1e3a5f", borderRadius: "8px", padding: "10px 14px", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "15px", height: "15px", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "12px", color: "#f1f5f9" }}
              />
            </div>

            {/* Password */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <label style={{ fontSize: "10px", fontWeight: 500, color: "#64748b", letterSpacing: "0.8px" }}>PASSWORD</label>
              <span style={{ fontSize: "10px", color: "#3b82f6", cursor: "pointer" }}>Forgot?</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#0f1a2e", border: "0.5px solid #1e3a5f", borderRadius: "8px", padding: "10px 14px", marginBottom: "1rem" }}>
              <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "15px", height: "15px", flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "12px", color: "#f1f5f9" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "15px", height: "15px" }} fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={1.5}>
                  {showPassword
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  }
                </svg>
              </button>
            </div>

            {/* Remember me */}
            <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "8px", marginBottom: "1.25rem" }}>
              <input
                type="checkbox"
                id="remember"
                style={{ width: "13px", height: "13px", accentColor: "#2563eb", colorScheme: "dark", flexShrink: 0, cursor: "pointer" }}
              />
              <label htmlFor="remember" style={{ fontSize: "11px", color: "#64748b", cursor: "pointer" }}>Remember me</label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", background: loading ? "#1e3a5f" : "#2563eb", color: "#eff6ff", border: "none", borderRadius: "8px", padding: "12px", fontSize: "13px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "opacity 0.2s" }}
            >
              {loading ? "Signing in..." : "Sign in to WorkflowHub"}
              {!loading && (
                <svg xmlns="http://www.w3.org/2000/svg" style={{ width: "15px", height: "15px" }} fill="none" viewBox="0 0 24 24" stroke="#93c5fd" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;