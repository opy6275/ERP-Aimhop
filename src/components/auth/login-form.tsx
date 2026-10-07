"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Key,
  IdCard,
  X,
} from "@/components/ui/icons";

type LoginRole = "admin" | "staff";

export function LoginForm() {
  const router = useRouter();
  const [roleMode, setRoleMode] = useState<LoginRole>("admin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
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
    setIdentifier("");
    setPassword("");
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
      <div className="mb-5">
        <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200">
          <button
            type="button"
            onClick={() => handleRoleSwitch("admin")}
            className={cn(
              "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer",
              roleMode === "admin"
                ? "bg-white text-blue-700 shadow-2xs font-semibold border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <Shield size={14} className={roleMode === "admin" ? "text-blue-600" : "text-slate-400"} />
            <span>Administrator</span>
          </button>

          <button
            type="button"
            onClick={() => handleRoleSwitch("staff")}
            className={cn(
              "flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer",
              roleMode === "staff"
                ? "bg-white text-blue-700 shadow-2xs font-semibold border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            <User size={14} className={roleMode === "staff" ? "text-blue-600" : "text-slate-400"} />
            <span>Staff Portal</span>
          </button>
        </div>
      </div>

      {/* Main Authentication Form */}
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Email or Identifier */}
        <div>
          <label
            htmlFor="login-identifier"
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {roleMode === "admin" ? "Administrator Email Address" : "Staff Email Address or Staff ID"}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              {roleMode === "admin" ? <Mail size={16} /> : <IdCard size={16} />}
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
                  ? "admin@company.com"
                  : "staff@company.com or STAFF-00001"
              }
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-300 focus-visible:outline-hidden focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {roleMode === "admin"
              ? "Enter your administrator email address"
              : "Sign in with your corporate email or employee code"}
          </p>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <button
              type="button"
              onClick={openForgotModal}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock size={16} />
            </div>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-300 focus-visible:outline-hidden focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
            />
            <span className="text-xs text-slate-600">Keep me signed in on this device</span>
          </label>
        </div>

        {/* Inline Feedback Alerts */}
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-snug">{error}</div>
          </div>
        ) : null}

        {success ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <div className="leading-snug">{success}</div>
          </div>
        ) : null}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          loading={loading}
          size="lg"
          className="w-full h-11 text-sm font-semibold rounded-lg shadow-2xs mt-2"
        >
          <span>Sign In</span>
          <ArrowRight size={15} />
        </Button>
      </form>

      {/* Forgot Password Modal - Email OTP Based */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200 relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setForgotModalOpen(false);
                setResetError(null);
                setResetSuccess(null);
                setDevOtpNote(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 mx-auto mb-3">
              <Key size={18} />
            </div>
            <h3 className="text-base font-semibold text-slate-900 text-center">
              Reset Your Password
            </h3>
            <p className="mt-1 text-xs text-slate-500 text-center">
              {resetStep === 1
                ? "Enter your registered email address to receive a 6-digit verification code."
                : `Enter the 6-digit code sent to ${resetEmail} and your new password.`}
            </p>

            {/* Step 1: Send OTP to Email */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestOtp} className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="reset-email-input"
                    className="block text-xs font-medium text-slate-700 mb-1.5"
                  >
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                      <Mail size={16} />
                    </div>
                    <input
                      id="reset-email-input"
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3.5 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-300 focus-visible:outline-hidden focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    />
                  </div>
                </div>

                {resetError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setForgotModalOpen(false)}
                    className="w-1/3"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={resetLoading}
                    loading={resetLoading}
                    className="flex-1"
                  >
                    <span>Send Verification Code</span>
                    <ArrowRight size={15} />
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Enter OTP & New Password */}
            {resetStep === 2 && (
              <form onSubmit={handleResetPassword} className="mt-5 space-y-3.5">
                <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-600">
                  <span className="truncate max-w-[220px]">
                    Recipient: <strong className="text-slate-800 font-semibold">{resetEmail}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setResetStep(1);
                      setResetOtp("");
                      setResetError(null);
                      setResetSuccess(null);
                    }}
                    className="text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Change Email
                  </button>
                </div>

                {/* Dev OTP Helper */}
                {devOtpNote && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700 flex items-center justify-between">
                    <span>
                      Dev OTP: <strong className="font-mono text-sm tracking-wider text-slate-900">{devOtpNote}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetOtp(devOtpNote)}
                      className="text-xs bg-white border border-slate-200 hover:bg-slate-50 px-2 py-0.5 rounded font-medium text-slate-700 cursor-pointer shadow-2xs"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}

                {/* 6-Digit OTP */}
                <div>
                  <label
                    htmlFor="reset-otp-input"
                    className="block text-xs font-medium text-slate-700 mb-1"
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
                    className="w-full text-center tracking-widest font-mono text-base font-bold rounded-lg border border-slate-200 bg-white py-2 text-slate-900 placeholder:text-slate-300 placeholder:font-normal placeholder:tracking-normal outline-none transition hover:border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label
                    htmlFor="reset-new-password"
                    className="block text-xs font-medium text-slate-700 mb-1"
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
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 py-2 text-xs text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-300 focus-visible:outline-hidden focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20"
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
                    className="block text-xs font-medium text-slate-700 mb-1"
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
                      className="flex h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 transition-colors placeholder:text-slate-400 hover:border-slate-300 focus-visible:outline-hidden focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-500/20"
                    />
                  </div>
                </div>

                {resetError && (
                  <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                    <span>{resetError}</span>
                  </div>
                )}

                {resetSuccess && (
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 size={15} className="shrink-0 text-emerald-600" />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRequestOtp}
                    disabled={resetLoading}
                    className="w-1/3"
                  >
                    Resend Code
                  </Button>
                  <Button
                    type="submit"
                    disabled={resetLoading}
                    loading={resetLoading}
                    className="flex-1"
                  >
                    <span>Update Password</span>
                    <CheckCircle2 size={15} />
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
