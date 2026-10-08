import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { AimHopLogo } from "@/components/ui/aimhop-logo";
import { ShieldCheck, Lock, Activity, CheckCircle2 } from "@/components/ui/icons";

export const metadata = {
  title: "Sign In | AimHop ERP",
  description: "Enterprise authentication portal for AimHop ERP.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50 text-slate-900 antialiased p-4 sm:p-8 lg:p-12">
      {/* Mobile Header (visible only on small screens) */}
      <header className="w-full max-w-5xl mx-auto flex lg:hidden items-center justify-between pb-6">
        <AimHopLogo size={36} layout="horizontal" useBrandImage={true} />
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Enterprise v1.0
        </span>
      </header>

      {/* Main 2-column Container */}
      <main className="w-full max-w-5xl mx-auto my-auto py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Left: Professional Enterprise Brand Panel (visible on lg+) */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center space-y-8 pr-4">
            
            {/* Prominent High-Resolution Logo & Title Header */}
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="relative flex h-20 w-20 xl:h-24 xl:w-24 shrink-0 items-center justify-center">
                  <Image
                    src="/brand-logo.png"
                    alt="AimHop Logo"
                    width={88}
                    height={88}
                    priority
                    className="h-full w-full object-contain select-none"
                  />
                </div>
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl xl:text-3xl font-extrabold tracking-tight text-slate-900">
                      AimHop
                    </span>
                    <span className="text-2xl xl:text-3xl font-extrabold text-blue-600">.</span>
                    <span className="ml-2 text-xs font-bold tracking-wider uppercase text-blue-700 bg-blue-50 border border-blue-200/60 rounded-md px-2 py-0.5">
                      ERP
                    </span>
                  </div>
                  <p className="text-xs font-semibold tracking-wider uppercase text-slate-500 mt-0.5">
                    Enterprise Operations & Workforce Suite
                  </p>
                </div>
              </div>

              {/* Clean, Focused Executive Statement */}
              <div className="space-y-3 pt-2">
                <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                  Streamline Operations. <br className="hidden xl:inline" />
                  Empower Your Team.
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed max-w-lg">
                  A unified command center for real-time attendance, automated payroll disbursements, and intelligent workforce administration.
                </p>
              </div>
            </div>

            {/* Streamlined Professional Feature Badges (Concise & Clutter-Free) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg pt-1">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white/80 p-3 shadow-2xs backdrop-blur-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                  <ShieldCheck size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">Role-Based Access</p>
                  <p className="text-[11px] text-slate-500">Fine-grained permissions</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white/80 p-3 shadow-2xs backdrop-blur-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                  <CheckCircle2 size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">Live Attendance</p>
                  <p className="text-[11px] text-slate-500">Daily punch & leaves</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white/80 p-3 shadow-2xs backdrop-blur-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                  <Activity size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">Payroll Ledger</p>
                  <p className="text-[11px] text-slate-500">Receipts & disbursements</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-slate-200/80 bg-white/80 p-3 shadow-2xs backdrop-blur-xs">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-100">
                  <Lock size={17} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate">Security & Audit</p>
                  <p className="text-[11px] text-slate-500">Immutable activity logs</p>
                </div>
              </div>
            </div>

            {/* System Status & Trust Badge */}
            <div className="flex items-center gap-3 pt-2 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-600 bg-white border border-slate-200 rounded-full px-2.5 py-1 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </span>
              <span>•</span>
              <span className="text-[11px]">256-bit Encrypted Session</span>
            </div>
          </div>

          {/* Right: Login Card Form */}
          <div className="w-full lg:col-span-6 xl:col-span-5 max-w-md mx-auto">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8">
              {/* Card Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
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
