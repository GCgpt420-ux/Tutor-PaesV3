export default function ProtectedLoading() {
  return (
    <div className="w-full space-y-8 animate-pulse p-6">
      {/* Hero Section Skeleton */}
      <div className="h-48 w-full bg-zinc-900/50 border border-white/5 rounded-2xl p-8 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="h-4 w-32 bg-white/10 rounded" />
          <div className="h-8 w-3/4 bg-white/10 rounded" />
        </div>
        <div className="h-4 w-1/2 bg-white/10 rounded" />
      </div>

      {/* KPI Grid Skeletons */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-zinc-900/40 border border-white/5 rounded-xl p-5 flex flex-col justify-between">
            <div className="h-3 w-16 bg-white/5 rounded" />
            <div className="h-8 w-12 bg-white/10 rounded" />
            <div className="h-2 w-full bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* Charts & Detail Skeletons */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 h-64 bg-zinc-900/30 border border-white/5 rounded-xl p-6" />
        <div className="h-64 bg-zinc-900/30 border border-white/5 rounded-xl p-6" />
      </div>
    </div>
  );
}
