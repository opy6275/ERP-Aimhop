import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#dbeafe_0%,_transparent_55%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_100%)]"
      />
      <div className="relative z-10 mb-8 text-center flex flex-col items-center">
        <div className="relative mb-4 flex items-center justify-center transition-transform duration-300 hover:scale-105">
          <img
            src="/brand-logo.png"
            alt="AimHop Logo"
            className="h-28 w-28 sm:h-32 sm:w-32 object-contain drop-shadow-xl select-none"
          />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/80 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-800">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          AimHop Enterprise
        </div>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          AimHop CRM
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
          Workforce management, shift rosters, and operations platform.
        </p>
      </div>
      <div className="relative z-10 w-full max-w-md">
        <LoginForm />
      </div>
      <p className="relative z-10 mt-8 text-xs text-[var(--color-muted)]">
        Local development · Secure sign-in
      </p>
    </div>
  );
}
