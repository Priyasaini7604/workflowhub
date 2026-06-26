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
    <div className="min-h-screen flex" style={{ background: "#060b14" }}>

      {/* Left Side */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-10 relative overflow-hidden">

        {/* Background orbs */}
        <div className="absolute top-0 left-1/4 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "#1d4ed8", opacity: 0.06, transform: "translateY(-40%)" }} />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full pointer-events-none"
          style={{ background: "#7c3aed", opacity: 0.07, transform: "translate(-30%, 30%)" }} />

        {/* Logo */}
        <div className="flex items-center gap-3 relative">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "#1d4ed8" }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none"
              viewBox="0 0 24 24" stroke="#93c5fd" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <div>
            <p className="text-base font-medium" style={{ color: "#f1f5f9" }}>WorkflowHub</p>
            <p className="text-xs" style={{ color: "#475569" }}>by MPRW Research Workshop</p>
          </div>
        </div>

        {/* Tagline + Stats */}
        <div className="relative">
          <h1 className="text-5xl font-medium mb-3" style={{ color: "#f1f5f9", lineHeight: 1.2 }}>
            Track.<br />
            <span style={{ color: "#3b82f6" }}>Manage.</span><br />
            Grow.
          </h1>
          <p className="text-sm mb-10 max-w-xs" style={{ color: "#64748b", lineHeight: 1.8 }}>
            A unified platform for HR operations and IT asset lifecycle management — built for modern teams.
          </p>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-2xl font-medium" style={{ color: "#3b82f6" }}>50+</p>
              <p className="text-xs" style={{ color: "#475569" }}>Employees</p>
            </div>
            <div className="w-px h-8" style={{ background: "#1e293b" }} />
            <div>
              <p className="text-2xl font-medium" style={{ color: "#10b981" }}>200+</p>
              <p className="text-xs" style={{ color: "#475569" }}>Assets tracked</p>
            </div>
            <div className="w-px h-8" style={{ background: "#1e293b" }} />
            <div>
              <p className="text-2xl font-medium" style={{ color: "#f59e0b" }}>100%</p>
              <p className="text-xs" style={{ color: "#475569" }}>Secure</p>
            </div>
          </div>
        </div>

        <p className="text-xs relative" style={{ color: "#1e3a5f" }}>
          © 2025 WorkflowHub · MPRW Research Workshop
        </p>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-[420px] flex flex-col justify-center p-8 mr-16"
  style={{ borderLeft: "none" }}>
        <div className="mb-6">
          <div className="inline-block rounded-full px-3 py-1 mb-3 text-xs"
            style={{ background: "#0f1a2e", border: "0.5px solid #1e3a5f", color: "#38bdf8", letterSpacing: "0.8px" }}>
            SECURE WORKSPACE
          </div>
          <h2 className="text-lg font-medium mb-1" style={{ color: "#f1f5f9" }}>Welcome back</h2>
          <p className="text-xs" style={{ color: "#64748b" }}>Sign in to your dashboard</p>
        </div>

        {/* Form */}
        <div className="rounded-xl p-6 mb-4"
          style={{ background: "#0a1628", border: "0.5px solid #1e293b" }}>

          {error && (
            <div className="rounded-lg px-3 py-2 mb-4 text-xs"
              style={{ background: "#1a0a0a", border: "0.5px solid #7f1d1d", color: "#fca5a5" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <label className="block text-xs font-medium mb-1"
              style={{ color: "#64748b", letterSpacing: "0.8px" }}>EMAIL</label>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
              style={{ background: "#0f1a2e", border: "0.5px solid #1e3a5f" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: "#f1f5f9" }}
              />
            </div>

            {/* Password */}
            <div className="flex justify-between mb-1">
              <label className="text-xs font-medium"
                style={{ color: "#64748b", letterSpacing: "0.8px" }}>PASSWORD</label>
              <span className="text-xs cursor-pointer" style={{ color: "#3b82f6" }}>Forgot?</span>
            </div>
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
              style={{ background: "#0f1a2e", border: "0.5px solid #1e3a5f" }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0"
                fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="flex-1 bg-transparent text-xs outline-none"
                style={{ color: "#f1f5f9" }}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"
                  fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={1.5}>
                  {showPassword
                    ? <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    : <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  }
                </svg>
              </button>
            </div>

            {/* Remember me */}
           
  
  <div className="flex flex-row items-center gap-2 mb-4">
  <input
    type="checkbox"
    id="remember"
    className="w-3 h-3 cursor-pointer flex-shrink-0"
    style={{ accentColor: "#2563eb", colorScheme: "dark" }}
  />
  <label htmlFor="remember" className="text-xs cursor-pointer"
    style={{ color: "#64748b" }}>
    Remember me
  </label>
</div>
            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-3 flex items-center justify-center gap-2 text-sm font-medium transition disabled:opacity-50"
              style={{ background: "#2563eb", color: "#eff6ff" }}
            >
              {loading ? "Signing in..." : "Sign in to WorkflowHub"}
              {!loading && (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4"
                  fill="none" viewBox="0 0 24 24" stroke="#93c5fd" strokeWidth={2}>
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