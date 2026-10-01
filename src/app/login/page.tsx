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
    <div className="relative min-h-screen w-full bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-slate-900 antialiased overflow-x-hidden flex flex-col justify-between">
      {/* Background Ambient Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-orange-400/10 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-500/10 blur-[140px]"
      />

      {/* Top Header Bar */}
      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center">
          <AimHopLogo size={36} layout="horizontal" />
        </div>
        <div className="text-center sm:text-right">
          <p className="text-xs sm:text-[13px] font-medium tracking-wide text-slate-500 select-none">
            <span className="hover:text-slate-800 transition-colors">Smarter Systems</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="hover:text-slate-800 transition-colors">Better Operations</span>
            <span className="mx-2 text-slate-300">/</span>
            <span className="hover:text-slate-800 transition-colors">Greater Growth</span>
          </p>
        </div>
      </header>

      {/* Main Showcase Section: Split Screen on Desktop */}
      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT COLUMN: Enterprise Value Proposition & Visual Showcase */}
          <section className="lg:col-span-7 flex flex-col justify-center order-2 lg:order-1 pt-6 lg:pt-0">
            {/* Tagline Pill */}
            <div className="flex items-center gap-2 mb-3">
              <span className="h-1.5 w-6 rounded-full bg-orange-500 inline-block" />
              <span className="text-xs font-black tracking-[0.2em] text-orange-600 uppercase">
                AIMHOP ERP
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Streamline Your <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
                Business Operations
              </span>
            </h1>

            {/* Subtitle Description */}
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-slate-600 max-w-xl">
              A powerful, modern ERP solution designed to help your team work smarter, faster, and achieve more — all in one unified enterprise platform.
            </p>

            {/* 4 Feature Badges */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
              {/* Badge 1 */}
              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/70 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md hover:bg-white transition-all duration-200">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Users size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Manage</div>
                  <div className="text-[11px] text-slate-500 font-medium">Teams</div>
                </div>
              </div>

              {/* Badge 2 */}
              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/70 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md hover:bg-white transition-all duration-200">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Target size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Track</div>
                  <div className="text-[11px] text-slate-500 font-medium">Performance</div>
                </div>
              </div>

              {/* Badge 3 */}
              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/70 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md hover:bg-white transition-all duration-200">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Layers size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Simplify</div>
                  <div className="text-[11px] text-slate-500 font-medium">Workflows</div>
                </div>
              </div>

              {/* Badge 4 */}
              <div className="flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl bg-white/70 backdrop-blur-xs border border-slate-200/80 shadow-xs hover:shadow-md hover:bg-white transition-all duration-200">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <TrendingUp size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-800 leading-tight">Drive</div>
                  <div className="text-[11px] text-slate-500 font-medium">Growth</div>
                </div>
              </div>
            </div>

            {/* Architectural Building Graphic with Glass Overlay Widgets */}
            <div className="mt-8 relative rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl bg-white group max-w-2xl">
              <div className="relative aspect-[16/9] w-full overflow-hidden">
                <img
                  src="/aimhop-hero-building.jpg"
                  alt="AimHop Campus & Enterprise Architecture"
                  className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/10" />

                {/* Floating Widget 1: Efficiency Growth Success */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 rounded-2xl bg-white/85 backdrop-blur-md p-3 sm:p-3.5 border border-white/60 shadow-lg flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-xs">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Metrics</div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Efficiency</span>
                      <span className="text-orange-500">•</span>
                      <span>Growth</span>
                      <span className="text-orange-500">•</span>
                      <span>Success</span>
                    </div>
                  </div>
                </div>

                {/* Floating Widget 2: Better Together Analytical Card */}
                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 rounded-2xl bg-slate-900/85 backdrop-blur-md p-3 sm:p-3.5 border border-white/10 text-white shadow-xl flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-orange-400">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">Better Together</div>
                    <div className="text-[11px] text-slate-300 font-medium">Real-time collaboration across departments</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Left Column Footer Powered By Tag */}
            <div className="mt-6 flex items-center gap-2">
              <span className="h-0.5 w-6 bg-orange-500 inline-block" />
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400">
                POWERED BY AIMHOP TECHNOLOGIES
              </span>
            </div>
          </section>

          {/* RIGHT COLUMN: Elevated Unified Login Portal Card */}
          <section className="lg:col-span-5 flex justify-center order-1 lg:order-2">
            <div className="w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-md border border-slate-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] p-6 sm:p-8 md:p-10 transition-all duration-300">
              
              {/* Card Header with Centered AimHop Logo & Welcome Title */}
              <div className="text-center mb-6">
                <div className="inline-flex justify-center mb-3">
                  <AimHopLogo size={42} layout="vertical" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Welcome Back
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500">
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
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-4 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-400 border-t border-slate-200/40 mt-8">
        <div>
          © {new Date().getFullYear()} AimHop Technologies. All rights reserved.
        </div>
        <div className="mt-2 sm:mt-0 flex items-center justify-center gap-4 text-slate-500">
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
