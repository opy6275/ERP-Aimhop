"use client";

import { useState } from "react";
import { Building2, Lock, Mail } from "@/components/ui/icons";
import { CompanySettingsForm } from "@/components/admin/company-settings-form";
import { EmailSettingsForm } from "@/components/admin/email-settings-form";
import { AdminPasswordForm } from "@/components/admin/admin-password-form";

type SettingsTab = "company" | "security" | "email";

interface SettingsTabsViewProps {
  adminEmail: string;
  initialCompany: {
    name: string;
    legalName: string | null;
    currency: string;
    timezone: string;
    receiptFooter: string | null;
  } | null;
  initialSmtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    hasPassword: boolean;
    fromEmail: string;
    fromName: string;
    replyTo?: string | null;
    isEnabled: boolean;
  };
}

export function SettingsTabsView({
  adminEmail,
  initialCompany,
  initialSmtp,
}: SettingsTabsViewProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");

  const tabs = [
    {
      id: "company" as const,
      label: "Company Profile",
      icon: <Building2 size={16} />,
    },
    {
      id: "security" as const,
      label: "Admin Security",
      icon: <Lock size={16} />,
    },
    {
      id: "email" as const,
      label: "Email & SMTP",
      icon: <Mail size={16} />,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-12 items-start">
      {/* Left Inner Sidebar Navigation - Clean & Compact */}
      <aside className="md:col-span-3 lg:col-span-3">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xs">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`shrink-0 ${
                      isActive ? "text-orange-400" : "text-slate-400"
                    }`}
                  >
                    {tab.icon}
                  </span>
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Right Content Panel */}
      <main className="md:col-span-9 lg:col-span-9">
        {activeTab === "company" && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-sm font-bold text-slate-900">
                Company Profile & Branding
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Official company details for receipts, salary slips, and accounting statements.
              </p>
            </div>

            <CompanySettingsForm initialCompany={initialCompany} />
          </div>
        )}

        {activeTab === "security" && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-sm font-bold text-slate-900">
                Admin Security
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Update your administrator password and login credentials.
              </p>
            </div>

            <AdminPasswordForm adminEmail={adminEmail} />
          </div>
        )}

        {activeTab === "email" && (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs animate-fadeIn">
            <div className="border-b border-slate-100 pb-3 mb-5">
              <h3 className="text-sm font-bold text-slate-900">
                Email & SMTP Gateway
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure outgoing mail server for automated salary slips and OTP verification codes.
              </p>
            </div>

            <EmailSettingsForm initialConfig={initialSmtp} />
          </div>
        )}
      </main>
    </div>
  );
}
