import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import CyberShieldLogo from "../../components/Auth/CyberShieldLogo";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember_me: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(formData);
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Left brand panel (hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 cs-gradient-bg relative overflow-hidden items-center justify-center">
        {/* Floating decorative shield */}
        <div className="absolute cs-float opacity-90">
          <div className="relative">
            <span className="absolute inset-0 cs-pulse-ring rounded-full bg-sky-400/40" />
            <CyberShieldLogo size={120} light />
          </div>
        </div>

        <div className="relative z-10 text-center px-10 cs-animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <CyberShieldLogo size={44} light />
            <span className="text-3xl font-extrabold text-white tracking-tight">
              CyberShield
            </span>
          </div>
          <h1 className="text-white text-4xl font-bold leading-tight max-w-md mx-auto">
            Your AI-Powered Security Companion
          </h1>
          <p className="text-sky-100/80 mt-4 max-w-sm mx-auto">
            Scan code, assess threats, and learn secure practices — all in one
            place.
          </p>

          {/* Feature bullets */}
          <div className="mt-10 grid grid-cols-1 gap-3 text-left max-w-sm mx-auto">
            {[
              "AI Code Review & Vulnerability Detection",
              "GitHub Security Scanner",
              "Threat Reports & OWASP Simulator",
            ].map((f) => (
              <div
                key={f}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-3"
              >
                <span className="h-2 w-2 rounded-full bg-sky-300" />
                <span className="text-white text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Soft glow blobs */}
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <div className="w-full max-w-md cs-animate-fade-up">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <CyberShieldLogo size={36} />
            <span className="text-2xl font-extrabold text-slate-800">
              CyberShield
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
            <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-slate-500 text-sm mt-1">
              Sign in to continue to your dashboard.
            </p>

            {error && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    name="remember_me"
                    checked={formData.remember_me}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Remember me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-blue-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-sky-500 text-white font-semibold py-2.5 rounded-lg shadow-md hover:from-blue-700 hover:to-sky-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-60 transition"
              >
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-blue-600 font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
