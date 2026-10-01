"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  ArrowRight,
  Shield,
  CheckCircle2,
} from "@/components/ui/icons";

type LoginRole = "admin" | "staff";

export function LoginForm() {
  const router = useRouter();
  const [roleMode, setRoleMode] = useState<LoginRole>("admin");
  const [identifier, setIdentifier] = useState("superadmin@aimhop.com");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  function handleRoleSwitch(newMode: LoginRole) {
    if (newMode === roleMode) return;
    setRoleMode(newMode);
    setError(null);
    setSuccess(null);

    // Pre-populate with typical credentials for testing
    if (newMode === "admin") {
      setIdentifier("superadmin@aimhop.com");
      setPassword("Admin@123");
    } else {
      setIdentifier("staff@aimhop.com");
      setPassword("Staff@123");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Please fill in both email/username and password.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: identifier.trim(),
          password,
          roleMode,
        }),
      });

      const data = (await res.json()) as {
        message?: string;
        error?: string;
        redirectTo?: string;
        role?: string;
      };

      if (!res.ok) {
        setError(
          data.message ??
            data.error ??
            "Authentication failed. Please verify your credentials.",
        );
        return;
      }

      setSuccess("Authentication successful. Redirecting to workspace...");
      setTimeout(() => {
        router.push(data.redirectTo ?? (roleMode === "staff" ? "/app/dashboard" : "/admin/dashboard"));
        router.refresh();
      }, 350);
    } catch {
      setError("Unable to connect to authentication service. Check network.");
    } finally {
      setLoading(false);
    }
  }

  function setQuickCredentials(role: LoginRole, idVal: string, passVal: string) {
    setRoleMode(role);
    setIdentifier(idVal);
    setPassword(passVal);
    setError(null);
  }

  return (
    <div className="w-full">
      {/* Role Switcher / Toggle */}
      <div className="mb-3">
        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80">
          {/* Admin Login Button */}
          <button
            type="button"
            onClick={() => handleRoleSwitch("admin")}
            className={`relative flex items-center gap-2 p-2 sm:p-2.5 rounded-lg transition-all duration-200 text-left cursor-pointer ${
              roleMode === "admin"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/25 ring-2 ring-orange-500/20 font-semibold"
                : "bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                roleMode === "admin" ? "bg-white/20 text-white" : "bg-orange-50 text-orange-600"
              }`}
            >
              <Shield size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold leading-tight">Admin Login</div>
              <div
                className={`text-[10px] truncate leading-tight ${
                  roleMode === "admin" ? "text-orange-100" : "text-slate-400"
                }`}
              >
                Authorized admins
              </div>
            </div>
          </button>

          {/* Staff Login Button */}
          <button
            type="button"
            onClick={() => handleRoleSwitch("staff")}
            className={`relative flex items-center gap-2 p-2 sm:p-2.5 rounded-lg transition-all duration-200 text-left cursor-pointer ${
              roleMode === "staff"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-sm shadow-orange-500/25 ring-2 ring-orange-500/20 font-semibold"
                : "bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                roleMode === "staff" ? "bg-white/20 text-white" : "bg-orange-50 text-orange-600"
              }`}
            >
              <User size={15} />
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold leading-tight">Staff Login</div>
              <div
                className={`text-[10px] truncate leading-tight ${
                  roleMode === "staff" ? "text-orange-100" : "text-slate-400"
                }`}
              >
                Team members
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Authentication Form */}
      <form onSubmit={onSubmit} className="space-y-2.5">
        {/* Email or Username */}
        <div>
          <label
            htmlFor="login-identifier"
            className="block text-[11px] font-semibold text-slate-700 mb-1"
          >
            Email Address / Username
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail size={15} />
            </div>
            <input
              id="login-identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={
                roleMode === "admin"
                  ? "admin@aimhop.com"
                  : "staff@aimhop.com or STAFF-00001"
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50/40 py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-[11px] font-semibold text-slate-700 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock size={15} />
            </div>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-200 bg-slate-50/40 py-2 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Options Row: Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 accent-orange-600"
            />
            <span className="text-[11px] font-medium text-slate-600">Remember me</span>
          </label>

          <button
            type="button"
            onClick={() => setForgotModalOpen(true)}
            className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Inline Feedback Alerts */}
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50/90 p-2 text-xs font-medium text-rose-800 flex items-start gap-2">
            <span className="shrink-0 text-rose-600 font-bold">⚠️</span>
            <div className="leading-tight text-[11px]">{error}</div>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 p-2 text-xs font-medium text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
            <div className="leading-tight text-[11px]">{success}</div>
          </div>
        ) : null}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 py-2.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-all duration-200 hover:from-orange-600 hover:to-amber-700 hover:shadow-orange-500/35 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-1"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Authenticating…</span>
            </>
          ) : (
            <>
              <span>Login</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative my-2 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200/80" />
          </div>
          <span className="relative bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            OR
          </span>
        </div>

        {/* Enterprise Security Trust Banner */}
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 p-2 flex items-center gap-2.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-orange-100 text-orange-700">
            <ShieldCheck size={13} />
          </div>
          <div className="text-left">
            <div className="text-[11px] font-bold text-slate-800 leading-tight">Secure Login</div>
            <div className="text-[10px] text-slate-500 leading-tight">
              Enterprise-grade encryption and access controls.
            </div>
          </div>
        </div>

        {/* Quick Demo Credentials Bar */}
        <div className="pt-1 flex items-center justify-between gap-2 text-[10px]">
          <span className="text-slate-400 font-semibold uppercase tracking-wider shrink-0">
            Quick Fill:
          </span>
          <button
            type="button"
            onClick={() => setQuickCredentials("admin", "superadmin@aimhop.com", "Admin@123")}
            className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/30 text-slate-700 font-medium transition-colors cursor-pointer truncate"
          >
            Admin (Super)
          </button>
          <button
            type="button"
            onClick={() => setQuickCredentials("staff", "staff@aimhop.com", "Staff@123")}
            className="px-2 py-1 rounded-md border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 text-slate-700 font-medium transition-colors cursor-pointer truncate"
          >
            Staff Portal
          </button>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl border border-slate-200">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 mx-auto mb-3">
              <Lock size={18} />
            </div>
            <h3 className="text-sm font-bold text-slate-900 text-center">
              Password Reset Assistance
            </h3>
            <p className="mt-1.5 text-xs text-slate-600 text-center leading-relaxed">
              For security compliance, user credentials must be reset by an authorized system administrator.
            </p>
            <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 border border-slate-200/80 text-center">
              <div className="font-semibold text-slate-800">Support Desk:</div>
              <div className="font-mono text-slate-500 text-[11px] mt-0.5">admin@aimhop.com</div>
            </div>
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="mt-4 w-full rounded-xl bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
