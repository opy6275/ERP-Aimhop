import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl border border-slate-200/90 shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 font-mono text-2xl font-black">
          404
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">Resource Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The page or employee record you are attempting to access does not exist, has been archived, or you may not have authorization.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            href="/admin/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-500 transition"
          >
            <LayoutDashboard size={14} />
            <span>Admin Console</span>
          </Link>
          <Link
            href="/app/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <span>Staff Portal</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
