import { LoginForm } from "@/components/auth/login-form";
import { AimHopLogo } from "@/components/ui/aimhop-logo";

export const metadata = {
  title: "Login | AimHop ERP",
  description: "Sign in to your AimHop ERP account.",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-slate-50/80 text-slate-900 antialiased p-4 sm:p-6">
      <div />

      <main className="w-full max-w-[400px] mx-auto my-auto">
        <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-6 sm:p-8">
          {/* Logo & Simple Header */}
          <div className="text-center mb-6">
            <div className="inline-flex justify-center mb-3">
              <AimHopLogo size={40} layout="vertical" useBrandImage={true} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Sign In
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Sign in to access your dashboard
            </p>
          </div>

          <LoginForm />
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} AimHop ERP. All rights reserved.
      </footer>
    </div>
  );
}
