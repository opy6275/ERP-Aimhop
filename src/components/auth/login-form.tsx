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

    // Pre-populate with typical credentials for smooth switching/testing
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
      setError("Unable to connect to the authentication service. Please check your network and try again.");
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
      <div className="mb-6">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
          Select Login Portal
        </label>
        <div className="grid grid-cols-2 gap-2.5 p-1 rounded-2xl bg-slate-100/90 border border-slate-200/80">
          {/* Admin Login Button */}
          <button
            type="button"
            onClick={() => handleRoleSwitch("admin")}
            className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left cursor-pointer ${
              roleMode === "admin"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/30 font-semibold"
                : "bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                roleMode === "admin" ? "bg-white/20 text-white" : "bg-orange-50 text-orange-600"
              }`}
            >
              <Shield size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight">Admin Login</div>
              <div
                className={`text-[11px] truncate leading-normal ${
                  roleMode === "admin" ? "text-orange-100" : "text-slate-500"
                }`}
              >
                For authorized administrators
              </div>
            </div>
          </button>

          {/* Staff Login Button */}
          <button
            type="button"
            onClick={() => handleRoleSwitch("staff")}
            className={`relative flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left cursor-pointer ${
              roleMode === "staff"
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 ring-2 ring-orange-500/30 font-semibold"
                : "bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                roleMode === "staff" ? "bg-white/20 text-white" : "bg-orange-50 text-orange-600"
              }`}
            >
              <User size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold leading-tight">Staff Login</div>
              <div
                className={`text-[11px] truncate leading-normal ${
                  roleMode === "staff" ? "text-orange-100" : "text-slate-500"
                }`}
              >
                For team members
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Main Authentication Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Email or Username */}
        <div>
          <label
            htmlFor="login-identifier"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Email Address / Username
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Mail size={18} />
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
                  ? "Enter admin email (e.g. admin@aimhop.com)"
                  : "Enter email or staff code (e.g. STAFF-00001)"
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-3 focus:ring-orange-500/15"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-semibold text-slate-700 mb-1.5"
          >
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock size={18} />
            </div>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/40 py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-orange-500 focus:bg-white focus:ring-3 focus:ring-orange-500/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Options Row: Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded-md border-slate-300 text-orange-600 focus:ring-orange-500 accent-orange-600"
            />
            <span className="text-xs font-medium text-slate-600">Remember me</span>
          </label>

          <button
            type="button"
            onClick={() => setForgotModalOpen(true)}
            className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Inline Feedback Alerts */}
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs font-medium text-rose-800 flex items-start gap-2.5 animate-fadeIn">
            <span className="shrink-0 mt-0.5 text-rose-600 font-bold">⚠️</span>
            <div className="leading-relaxed">{error}</div>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs font-medium text-emerald-800 flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <div className="leading-relaxed">{success}</div>
          </div>
        ) : null}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 py-3 px-4 text-sm font-bold text-white shadow-lg shadow-orange-500/25 transition-all duration-200 hover:from-orange-600 hover:to-amber-700 hover:shadow-orange-500/35 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="relative my-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <span className="relative bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            OR
          </span>
        </div>

        {/* Enterprise Security Trust Banner */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
            <ShieldCheck size={16} />
          </div>
          <div className="text-left">
            <div className="text-xs font-bold text-slate-800">Secure Login</div>
            <div className="text-[11px] text-slate-500 leading-tight">
              Your data is protected with enterprise-grade security.
            </div>
          </div>
        </div>

        {/* Quick Demo Credentials Bar for Testing */}
        <div className="pt-2">
          <div className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider mb-2">
            Quick-Fill Test Accounts
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setQuickCredentials("admin", "superadmin@aimhop.com", "Admin@123")}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/30 text-left transition-colors cursor-pointer"
            >
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                Super Admin
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">superadmin@aimhop.com</div>
            </button>

            <button
              type="button"
              onClick={() => setQuickCredentials("staff", "staff@aimhop.com", "Staff@123")}
              className="p-2 rounded-lg border border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/30 text-left transition-colors cursor-pointer"
            >
              <div className="font-semibold text-slate-800 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                Staff Portal
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">staff@aimhop.com</div>
            </button>
          </div>
        </div>
      </form>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 mx-auto mb-4">
              <Lock size={22} />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              Password Reset Assistance
            </h3>
            <p className="mt-2 text-xs text-slate-600 text-center leading-relaxed">
              For security compliance, user credentials must be reset by an authorized system administrator.
            </p>
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/80">
              <div className="font-semibold text-slate-800">Support Desk:</div>
              <div className="font-mono text-slate-500 mt-0.5">admin@aimhop.com</div>
            </div>
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="mt-5 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
