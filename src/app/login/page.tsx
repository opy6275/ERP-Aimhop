import { LoginForm } from "@/components/auth/login-form";
import { AimHopLogo } from "@/components/ui/aimhop-logo";
import {
  Users,
  Target,
  Layers,
  TrendingUp,
  BarChart3,
  Sparkles,
} from "@/components/ui/icons";

export const metadata = {
  title: "Login | AimHop ERP Enterprise",
  description: "Secure unified authentication portal for AimHop ERP administrators and staff.",
};

export default function LoginPage() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-slate-900 antialiased flex flex-col justify-between">
      {/* Background Ambient Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-[450px] w-[450px] rounded-full bg-orange-400/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[130px]"
      />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-2.5 sm:py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          <AimHopLogo size={34} layout="horizontal" useBrandImage={true} />
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[11px] sm:text-xs font-semibold tracking-wide text-slate-500 select-none">
            <span className="hover:text-slate-800 transition-colors">Smarter Systems</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="hover:text-slate-800 transition-colors">Better Operations</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="hover:text-slate-800 transition-colors">Greater Growth</span>
          </p>
        </div>
      </header>

      {/* Main Showcase Section: Split Screen Fitted to Single Viewport */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1 flex items-center">
        <div className="w-full h-full max-h-[86vh] grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          
          {/* LEFT COLUMN: Enterprise Value Proposition & Visual Showcase */}
          <section className="hidden lg:flex lg:col-span-7 flex-col justify-center h-full max-h-full py-1">
            {/* Tagline Pill */}
            <div className="flex items-center gap-2 mb-1.5">
              <span className="h-1.5 w-5 rounded-full bg-orange-500 inline-block" />
              <span className="text-[11px] font-black tracking-[0.2em] text-orange-600 uppercase">
                AIMHOP ERP
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-[34px] xl:text-[38px] font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Streamline Your <br />
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                Business Operations
              </span>
            </h1>

            {/* Subtitle Description */}
            <p className="mt-2 text-xs sm:text-[13px] leading-relaxed text-slate-600 max-w-lg">
              A powerful, modern ERP solution designed to help your team work smarter, faster, and achieve more — all in one unified platform.
            </p>

            {/* 4 Feature Badges in 1 compact row */}
            <div className="mt-3.5 grid grid-cols-4 gap-2 max-w-xl">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/75 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:bg-white transition-all">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <Users size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 leading-tight">Manage</div>
                  <div className="text-[10px] text-slate-500 font-medium">Teams</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/75 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:bg-white transition-all">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Target size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 leading-tight">Track</div>
                  <div className="text-[10px] text-slate-500 font-medium">Performance</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/75 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:bg-white transition-all">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Layers size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 leading-tight">Simplify</div>
                  <div className="text-[10px] text-slate-500 font-medium">Workflows</div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/75 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:bg-white transition-all">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <TrendingUp size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 leading-tight">Drive</div>
                  <div className="text-[10px] text-slate-500 font-medium">Growth</div>
                </div>
              </div>
            </div>

            {/* Architectural Building Graphic with Glass Overlay Widgets */}
            <div className="mt-3.5 relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-lg bg-white group max-w-xl aspect-[16/7] w-full">
              <img
                src="/aimhop-hero-building.jpg"
                alt="AimHop Campus Architecture"
                className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/10" />

              {/* Floating Widget 1: Efficiency Growth Success */}
              <div className="absolute top-3 left-3 rounded-xl bg-white/90 backdrop-blur-md px-2.5 py-1.5 border border-white/60 shadow-md flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-2xs">
                  <Sparkles size={12} />
                </div>
                <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Metrics</div>
                  <div className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                    <span>Efficiency</span>
                    <span className="text-orange-500">•</span>
                    <span>Growth</span>
                    <span className="text-orange-500">•</span>
                    <span>Success</span>
                  </div>
                </div>
              </div>

              {/* Floating Widget 2: Better Together Analytical Card */}
              <div className="absolute bottom-3 left-3 rounded-xl bg-slate-900/85 backdrop-blur-md px-2.5 py-1.5 border border-white/10 text-white shadow-lg flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15 text-orange-400">
                  <BarChart3 size={13} />
                </div>
                <div>
                  <div className="text-[11px] font-bold leading-tight">Better Together</div>
                  <div className="text-[9px] text-slate-300 font-medium">Real-time department synchronization</div>
                </div>
              </div>
            </div>

            {/* Left Column Footer Powered By Tag */}
            <div className="mt-2.5 flex items-center gap-2">
              <span className="h-0.5 w-5 bg-orange-500 inline-block" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                POWERED BY AIMHOP TECHNOLOGIES
              </span>
            </div>
          </section>

          {/* RIGHT COLUMN: Elevated Unified Login Portal Card */}
          <section className="lg:col-span-5 flex justify-center items-center h-full max-h-full py-1">
            <div className="w-full max-w-[410px] rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-md border border-slate-100 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.08)] p-5 sm:p-6 transition-all duration-300 flex flex-col justify-center">
              
              {/* Card Header with Centered AimHop Logo & Welcome Title */}
              <div className="text-center mb-3">
                <div className="inline-flex justify-center mb-1.5">
                  <AimHopLogo size={36} layout="vertical" useBrandImage={true} />
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                  Welcome Back
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Sign in to your account to continue
                </p>
              </div>

              {/* Unified Login Form with Interactive Role Switcher & Strict Role Validation */}
              <LoginForm />
            </div>
          </section>

        </div>
      </main>

      {/* Subtle Bottom Global Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-2 text-center sm:flex sm:items-center sm:justify-between text-[11px] text-slate-400 border-t border-slate-200/50 shrink-0">
        <div>
          © {new Date().getFullYear()} AimHop Technologies. All rights reserved.
        </div>
        <div className="mt-1 sm:mt-0 flex items-center justify-center gap-3 text-slate-500">
          <span>Enterprise ERP v2.4</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
            System Operational
          </span>
        </div>
      </footer>
    </div>
  );
}
