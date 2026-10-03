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
    <div className="relative min-h-screen overflow-hidden bg-[#060b14]">
      {/* Background orbs */}
      <div className="pointer-events-none absolute -top-20 left-1/4 h-80 w-80 rounded-full bg-[#1d4ed8] opacity-[0.08] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-60 w-60 rounded-full bg-[#7c3aed] opacity-[0.09] blur-3xl" />

      {/* Centered container */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1040px] flex-col px-6 py-8">

        {/* Logo */}
        <header className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#1d4ed8]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#93c5fd" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
            </svg>
          </div>
          <div>
            <p className="text-base font-medium text-[#f1f5f9]">WorkflowHub</p>
            <p className="text-[11px] text-[#475569]">by MPRW Research Workshop</p>
          </div>
        </header>

        {/* Main: hero + form side by side (auto-stacks on small screens) */}
        <main className="grid flex-1 grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-center gap-x-16 gap-y-12 py-10">

          {/* Tagline + Stats */}
          <section>
            <h1 className="mb-4 text-5xl font-medium leading-[1.15] text-[#f1f5f9] sm:text-[56px]">
              Track.<br />
              <span className="text-[#3b82f6]">Manage.</span><br />
              Grow.
            </h1>
            <p className="mb-10 max-w-[340px] text-sm leading-[1.8] text-[#64748b]">
              A unified platform for HR operations and IT asset lifecycle management — built for modern teams.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-2xl font-medium text-[#3b82f6]">50+</p>
                <p className="text-xs text-[#475569]">Employees</p>
              </div>
              <div className="h-[34px] w-px bg-[#1e293b]" />
              <div>
                <p className="text-2xl font-medium text-[#10b981]">200+</p>
                <p className="text-xs text-[#475569]">Assets tracked</p>
              </div>
              <div className="h-[34px] w-px bg-[#1e293b]" />
              <div>
                <p className="text-2xl font-medium text-[#f59e0b]">100%</p>
                <p className="text-xs text-[#475569]">Secure</p>
              </div>
            </div>
          </section>

          {/* Login side */}
          <section className="w-full max-w-[420px] justify-self-center">
            <div className="mb-6">
              <div className="mb-3 inline-block rounded-full border border-[#1e3a5f] bg-[#0f1a2e] px-3.5 py-1">
                <span className="text-[11px] tracking-[0.8px] text-[#38bdf8]">SECURE WORKSPACE</span>
              </div>
              <h2 className="mb-1.5 text-2xl font-medium text-[#f1f5f9]">Welcome back</h2>
              <p className="text-[13px] text-[#64748b]">Sign in to your dashboard</p>
            </div>

            {/* Form card */}
            <div className="rounded-[14px] border border-[#1e293b] bg-[#0a1628] p-6">
              {error && (
                <div className="mb-4 rounded-lg border border-[#7f1d1d] bg-[#1a0a0a] px-3 py-2.5">
                  <p className="text-xs text-[#fca5a5]">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <label className="mb-1.5 block text-[11px] font-medium tracking-[0.8px] text-[#64748b]">
                  EMAIL
                </label>
                <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-[#1e3a5f] bg-[#0f1a2e] px-3.5 py-[11px] focus-within:border-[#3b82f6]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-[#f1f5f9] outline-none placeholder:text-[#475569]"
                  />
                </div>

                {/* Password */}
                <div className="mb-1.5 flex justify-between">
                  <label className="text-[11px] font-medium tracking-[0.8px] text-[#64748b]">PASSWORD</label>
                  <span className="cursor-pointer text-[11px] text-[#3b82f6]">Forgot?</span>
                </div>
                <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-[#1e3a5f] bg-[#0f1a2e] px-3.5 py-[11px] focus-within:border-[#3b82f6]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="#3b82f6" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-[#f1f5f9] outline-none placeholder:text-[#475569]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="flex cursor-pointer border-none bg-transparent"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="#475569" strokeWidth={1.5}>
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      )}
                    </svg>
                  </button>
                </div>

                {/* Remember me */}
                <div className="mb-5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-[#2563eb] [color-scheme:dark]"
                  />
                  <label htmlFor="remember" className="cursor-pointer text-xs text-[#64748b]">
                    Remember me
                  </label>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg border-none p-3 text-sm font-medium text-[#eff6ff] transition-opacity duration-200 ${
                    loading
                      ? "cursor-not-allowed bg-[#1e3a5f]"
                      : "cursor-pointer bg-[#2563eb] hover:opacity-90"
                  }`}
                >
                  {loading ? "Signing in..." : "Sign in to WorkflowHub"}
                  {!loading && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="#93c5fd" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  )}
                </button>
              </form>
            </div>
          </section>
        </main>

        <footer className="text-[11px] text-[#334155]">
          © {new Date().getFullYear()} WorkflowHub · MPRW Research Workshop
        </footer>
      </div>
    </div>
  );
};

export default LoginPage;