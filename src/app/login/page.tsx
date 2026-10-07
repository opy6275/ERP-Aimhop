import { LoginForm } from "@/components/auth/login-form";
import { AimHopLogo } from "@/components/ui/aimhop-logo";
import { ShieldCheck, CalendarCheck, FileCheck } from "@/components/ui/icons";

export const metadata = {
  title: "Sign In | AimHop ERP",
  description: "Enterprise authentication portal for AimHop ERP.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 text-slate-900 antialiased p-4 sm:p-8 lg:p-12">
      {/* Header bar on mobile / minimal top */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6">
        <AimHopLogo size={32} layout="horizontal" useBrandImage={true} />
        <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-md px-2.5 py-1 shadow-2xs">
          Enterprise v1.0
        </span>
      </header>

      {/* Main 2-column or centered container */}
      <main className="w-full max-w-5xl mx-auto my-auto py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          {/* Left: Brand message & restrained supporting points (visible on lg+) */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center space-y-8 pr-4">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-100 rounded-md px-2.5 py-1">
                Centralized ERP Platform
              </span>
              <h1 className="text-3xl xl:text-4xl font-semibold tracking-tight text-slate-900 leading-tight">
                Workforce, Operations & Payroll Management
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
                Manage employee lifecycles, attendance muster rolls, departmental hierarchies, 
                and salary disbursements through a unified, audit-ready operational workspace.
              </p>
            </div>

            <div className="space-y-3.5 pt-2 border-t border-slate-200/80 max-w-md">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 mt-0.5">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Role-Based Access Governance</p>
                  <p className="text-xs text-slate-500">Fine-grained operational permissions for administrators and staff members.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 mt-0.5">
                  <CalendarCheck size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Live Attendance & Leave Processing</p>
                  <p className="text-xs text-slate-500">Real-time daily punch auditing, monthly muster rolls, and structured approvals.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 mt-0.5">
                  <FileCheck size={16} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900">Automated Financial Ledger & Receipts</p>
                  <p className="text-xs text-slate-500">Instant generation and email delivery of official salary receipts and tax slips.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Login card / form (primary focus) */}
          <div className="w-full lg:col-span-6 xl:col-span-5 max-w-md mx-auto">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
              {/* Card Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Sign In
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter your credentials to access your workspace
                </p>
              </div>

              <LoginForm />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mx-auto pt-6 text-center lg:text-left flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-200/80">
        <p>© {new Date().getFullYear()} AimHop Technologies. All rights reserved.</p>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <span>Enterprise Resource Planning</span>
          <span>•</span>
          <span>SOC-2 Compliant Security</span>
        </div>
      </footer>
    </div>
  );
}
