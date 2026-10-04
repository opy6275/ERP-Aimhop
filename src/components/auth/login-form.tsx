"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Shield,
  CheckCircle2,
  Key,
  X,
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

  // Email OTP Forgot Password states
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [devOtpNote, setDevOtpNote] = useState<string | null>(null);

  function openForgotModal() {
    setResetStep(1);
    setResetEmail(identifier.includes("@") ? identifier : "");
    setResetOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError(null);
    setResetSuccess(null);
    setDevOtpNote(null);
    setForgotModalOpen(true);
  }

  async function handleRequestOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!resetEmail.trim() || !resetEmail.includes("@")) {
      setResetError("Please enter a valid email address.");
      return;
    }
    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error?.message ?? data.message ?? "Failed to send code. Please try again.");
        return;
      }
      setResetStep(2);
      setResetSuccess(data.message ?? data.data?.message ?? `Verification code sent to ${resetEmail}`);
      const otpCode = data.devOtp ?? data.data?.devOtp;
      if (otpCode) {
        setDevOtpNote(otpCode);
      }
    } catch {
      setResetError("Network error while requesting code. Please try again.");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (resetOtp.length !== 6) {
      setResetError("Please enter the complete 6-digit code.");
      return;
    }
    if (newPassword.length < 8) {
      setResetError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    setResetError(null);
    setResetSuccess(null);

    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail.trim(),
          otp: resetOtp.trim(),
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error?.message ?? data.message ?? "Failed to reset password.");
        return;
      }

      setResetSuccess("Password reset successfully! Updating login form...");
      setIdentifier(resetEmail.trim());
      setPassword(newPassword);

      setTimeout(() => {
        setForgotModalOpen(false);
        setSuccess("Password updated! Click Sign In to access your workspace.");
      }, 1400);
    } catch {
      setResetError("Network error while resetting password.");
    } finally {
      setResetLoading(false);
    }
  }

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



  return (
    <div className="w-full">
      {/* Role Switcher Tabs */}
      <div className="mb-4">
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/80">
          <button
            type="button"
            onClick={() => handleRoleSwitch("admin")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              roleMode === "admin"
                ? "bg-white text-orange-600 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Shield size={14} />
            <span>Admin</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSwitch("staff")}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              roleMode === "staff"
                ? "bg-white text-orange-600 shadow-xs border border-slate-200/60"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <User size={14} />
            <span>Staff</span>
          </button>
        </div>
      </div>

      {/* Main Authentication Form */}
      <form onSubmit={onSubmit} className="space-y-3.5">
        {/* Email or Username */}
        <div>
          <label
            htmlFor="login-identifier"
            className="block text-xs font-medium text-slate-700 mb-1"
          >
            Email Address
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
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="login-password"
            className="block text-xs font-medium text-slate-700 mb-1"
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
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500 accent-orange-600"
            />
            <span className="text-xs text-slate-600">Remember me</span>
          </label>

          <button
            type="button"
            onClick={openForgotModal}
            className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        {/* Inline Feedback Alerts */}
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50/90 p-2.5 text-xs text-rose-800 flex items-start gap-2">
            <span className="shrink-0 font-bold">⚠️</span>
            <div className="leading-tight">{error}</div>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
            <div className="leading-tight">{success}</div>
          </div>
        ) : null}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-orange-600 py-2.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer pt-2"
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
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      {/* Forgot Password Modal - Email OTP Based */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setForgotModalOpen(false);
                setResetError(null);
                setResetSuccess(null);
                setDevOtpNote(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600 mx-auto mb-3">
              <Key size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center">
              Reset Your Password
            </h3>
            <p className="mt-1 text-xs text-slate-500 text-center">
              {resetStep === 1
                ? "Enter your registered email to receive a 6-digit verification code."
                : `Enter the 6-digit code sent to ${resetEmail} and your new password.`}
            </p>

            {/* Step 1: Send OTP to Email */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="reset-email-input"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Mail size={15} />
                    </div>
                    <input
                      id="reset-email-input"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. admin@aimhop.com or staff@aimhop.com"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    />
                  </div>
                </div>

                {resetError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50/90 p-2.5 text-xs text-rose-800 leading-tight">
                    {resetError}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="w-1/3 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 rounded-xl bg-orange-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {resetLoading ? (
                      <>
                        <span className="inline-block animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full mr-1.5" />
                        <span>Sending OTP…</span>
                      </>
                    ) : (
                      <>
                        <span>Send Email OTP</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Enter OTP & New Password */}
            {resetStep === 2 && (
              <form onSubmit={handleResetPassword} className="mt-5 space-y-3.5">
                <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200/80 rounded-lg p-2 text-slate-600">
                  <span className="truncate max-w-[200px]">
                    To: <strong className="text-slate-800">{resetEmail}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      setResetOtp("");
                      setResetError(null);
                      setResetSuccess(null);
                    }}
                    className="text-orange-600 hover:underline font-medium cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                {/* Dev Mode OTP Indicator for testing */}
                {devOtpNote && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 flex items-center justify-between">
                    <span>
                      Dev Code: <strong className="font-mono text-sm tracking-wider text-amber-950">{devOtpNote}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetOtp(devOtpNote)}
                      className="text-[11px] bg-amber-200/80 hover:bg-amber-300 px-2 py-0.5 rounded font-semibold cursor-pointer"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                {/* 6-Digit OTP */}
                <div>
                  <label
                    htmlFor="reset-otp-input"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    6-Digit Verification Code
                  </label>
                  <input
                    id="reset-otp-input"
                    type="text"
                    required
                    maxLength={6}
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full text-center tracking-widest font-mono text-base font-bold rounded-lg border border-slate-200 bg-slate-50/50 py-2 text-slate-900 placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="reset-new-password"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock size={15} />
                    </div>
                    <input
                      id="reset-new-password"
                      type={showResetPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(!showResetPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showResetPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="reset-confirm-password"
                    className="block text-xs font-semibold text-slate-700 mb-1"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                      <Lock size={15} />
                    </div>
                    <input
                      id="reset-confirm-password"
                      type={showResetPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/15"
                    />
                  </div>
                </div>

                {resetError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50/90 p-2.5 text-xs text-rose-800 leading-tight">
                    {resetError}
                  </div>
                )}

                {resetSuccess && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50/90 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={resetLoading}
                    className="w-1/3 rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Resend Code
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 rounded-xl bg-orange-600 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-700 active:scale-[0.99] disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {resetLoading ? (
                      <>
                        <span className="inline-block animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full mr-1.5" />
                        <span>Updating Password…</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <CheckCircle2 size={14} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
