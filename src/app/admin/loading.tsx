export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded-md bg-slate-200" />
          <div className="h-7 w-64 rounded-lg bg-slate-200" />
          <div className="h-4 w-96 max-w-full rounded-md bg-slate-100" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-slate-200 shrink-0" />
      </div>

      {/* KPI Cards Grid Skeleton */}
      <div className="mb-6 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3.5 w-24 rounded bg-slate-200" />
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 w-28 rounded-md bg-slate-200 mb-2" />
            <div className="h-3 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="h-5 w-48 rounded bg-slate-200" />
          <div className="h-8 w-24 rounded-lg bg-slate-100" />
        </div>
        <div className="space-y-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100" />
                <div className="space-y-1.5">
                  <div className="h-4 w-40 rounded bg-slate-200" />
                  <div className="h-3 w-28 rounded bg-slate-100" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
