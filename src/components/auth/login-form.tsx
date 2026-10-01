"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const DEMO_EMAIL = "demo@aimhop.com";
const DEMO_PASSWORD = "Demo@123";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as {
        message?: string;
        error?: string;
        redirectTo?: string;
      };

      if (!res.ok) {
        setError(data.message ?? data.error ?? "Login failed. Please try again.");
        return;
      }

      router.push(data.redirectTo ?? "/admin/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check the database and try again.");
    } finally {
      setLoading(false);
    }
  }

  function setCredentials(em: string, pw: string) {
    setEmail(em);
    setPassword(pw);
    setError(null);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_rgba(15,23,42,0.04)]",
      )}
    >
      <h2 className="text-xl font-semibold tracking-tight text-[var(--color-foreground)]">
        Sign in
      </h2>
      <p className="mt-1.5 text-sm text-[var(--color-muted)]">
        Use your work email to access AimHop CRM
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-[var(--color-foreground)]">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            placeholder="demo@aimhop.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-[var(--color-foreground)]">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-[var(--color-border)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            placeholder="••••••••"
          />
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-800 disabled:opacity-60 cursor-pointer"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-muted)]">
          Mock Accounts (Quick select)
        </p>
        <div className="mt-3 grid gap-2">
          <button
            type="button"
            onClick={() => setCredentials("demo@aimhop.com", "Demo@123")}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs transition hover:border-[var(--color-primary)] hover:bg-blue-50/40 cursor-pointer"
          >
            <div>
              <span className="font-semibold text-slate-800">Admin</span>
              <span className="text-slate-500"> — demo@aimhop.com</span>
            </div>
            <span className="font-mono text-slate-400">Demo@123</span>
          </button>
          <button
            type="button"
            onClick={() => setCredentials("superadmin@aimhop.com", "Admin@123")}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs transition hover:border-[var(--color-primary)] hover:bg-blue-50/40 cursor-pointer"
          >
            <div>
              <span className="font-semibold text-slate-800">Super Admin</span>
              <span className="text-slate-500"> — superadmin@aimhop.com</span>
            </div>
            <span className="font-mono text-slate-400">Admin@123</span>
          </button>
          <button
            type="button"
            onClick={() => setCredentials("staff@aimhop.com", "Staff@123")}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs transition hover:border-[var(--color-primary)] hover:bg-blue-50/40 cursor-pointer"
          >
            <div>
              <span className="font-semibold text-slate-800">Staff Portal</span>
              <span className="text-slate-500"> — staff@aimhop.com</span>
            </div>
            <span className="font-mono text-slate-400">Staff@123</span>
          </button>
        </div>
      </div>
    </form>
  );
}
