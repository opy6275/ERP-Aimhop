"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, CheckCircle2, Lock } from "@/components/ui/icons";

export type SmtpFormProps = {
  initialConfig: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    hasPassword: boolean;
    fromEmail: string;
    fromName: string;
    replyTo?: string | null;
    isEnabled: boolean;
  } | null;
};

export function EmailSettingsForm({ initialConfig }: SmtpFormProps) {
  const router = useRouter();

  const [host, setHost] = useState(initialConfig?.host || "smtp.gmail.com");
  const [port, setPort] = useState(initialConfig?.port || 465);
  const [secure, setSecure] = useState(initialConfig?.secure ?? true);
  const [user, setUser] = useState(initialConfig?.user || "");
  const [pass, setPass] = useState("");
  const [fromEmail, setFromEmail] = useState(initialConfig?.fromEmail || initialConfig?.user || "");
  const [fromName, setFromName] = useState(initialConfig?.fromName || "AimHop ERP");
  const [replyTo] = useState(initialConfig?.replyTo || "");
  const [isEnabled, setIsEnabled] = useState(initialConfig?.isEnabled ?? true);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [testEmail, setTestEmail] = useState(initialConfig?.user || "");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  function applyPreset(type: "gmail" | "outlook" | "brevo" | "custom") {
    if (type === "gmail") {
      setHost("smtp.gmail.com");
      setPort(465);
      setSecure(true);
    } else if (type === "outlook") {
      setHost("smtp-mail.outlook.com");
      setPort(587);
      setSecure(false);
    } else if (type === "brevo") {
      setHost("smtp-relay.brevo.com");
      setPort(587);
      setSecure(false);
    } else if (type === "custom") {
      setHost("");
      setPort(587);
      setSecure(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/v1/admin/settings/smtp", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          port: Number(port),
          secure,
          user,
          pass: pass || undefined,
          fromEmail: fromEmail || user,
          fromName,
          replyTo: replyTo || undefined,
          isEnabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.message || data.error || "Failed to save settings");
        return;
      }

      setSaveSuccess(true);
      setPass("");
      router.refresh();
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch {
      setSaveError("Network error while saving settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!testEmail || !testEmail.includes("@")) {
      alert("Please enter a valid email address to receive the test message.");
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/v1/admin/settings/smtp/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTestResult({
          success: false,
          message: data.message || data.error || "Failed to deliver test message",
        });
      } else {
        setTestResult({
          success: true,
          message: data.message || "Test email delivered successfully! Check your inbox.",
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: "Network error while connecting to email testing service",
      });
    } finally {
      setTesting(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15";
  const labelClass = "block text-xs font-semibold text-slate-700 mb-1";

  return (
    <div className="space-y-6">
      {/* Quick Provider Presets */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Provider Presets
        </label>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "gmail" as const, label: "Gmail" },
            { id: "outlook" as const, label: "Outlook / Office365" },
            { id: "brevo" as const, label: "Brevo" },
            { id: "custom" as const, label: "Custom SMTP" },
          ].map((preset) => {
            const isSelected =
              (preset.id === "gmail" && host === "smtp.gmail.com") ||
              (preset.id === "outlook" && host === "smtp-mail.outlook.com") ||
              (preset.id === "brevo" && host === "smtp-relay.brevo.com");
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border ${
                  isSelected
                    ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>SMTP Host *</label>
            <input
              type="text"
              required
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="smtp.gmail.com"
              className={`${inputClass} font-mono`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Port *</label>
              <input
                type="number"
                required
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                placeholder="465"
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={secure}
                  onChange={(e) => setSecure(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 accent-orange-600"
                />
                <span>SSL / TLS</span>
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>Username / Sender Email *</label>
            <input
              type="text"
              required
              value={user}
              onChange={(e) => {
                setUser(e.target.value);
                if (!fromEmail || fromEmail === user) setFromEmail(e.target.value);
              }}
              placeholder="accounts@aimhop.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Password / App Password {initialConfig?.hasPassword ? "(Saved ✓)" : "*"}
            </label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder={
                initialConfig?.hasPassword
                  ? "•••••••• (Leave blank to keep existing)"
                  : "Enter SMTP or App Password"
              }
              className={`${inputClass} font-mono`}
            />
          </div>

          <div>
            <label className={labelClass}>From Display Name</label>
            <input
              type="text"
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="AimHop ERP"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>From Email Address</label>
            <input
              type="email"
              value={fromEmail}
              onChange={(e) => setFromEmail(e.target.value)}
              placeholder="accounts@aimhop.com"
              className={inputClass}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="rounded text-orange-600 focus:ring-orange-500 accent-orange-600"
            />
            <span>Enable Automated Email Delivery</span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-orange-700 transition cursor-pointer disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Configuration"}
          </button>
        </div>

        {saveSuccess && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>Settings saved successfully!</span>
          </div>
        )}

        {saveError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 flex items-center gap-2">
            <span className="shrink-0 font-bold">✕</span>
            <span>{saveError}</span>
          </div>
        )}
      </form>

      {/* Test Email Connection Box - Compact & Clean */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5">
        <div>
          <h4 className="text-xs font-bold text-slate-900">Test Connection</h4>
          <p className="text-[11px] text-slate-500">
            Send a quick verification email to ensure outgoing SMTP is working properly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Recipient email address..."
            className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/15"
          />
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer disabled:opacity-60"
          >
            {testing ? "Testing…" : "Send Test"}
          </button>
        </div>

        {testResult && (
          <div
            className={`rounded-lg border p-2.5 text-xs ${
              testResult.success
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            {testResult.message}
          </div>
        )}
      </div>
    </div>
  );
}
