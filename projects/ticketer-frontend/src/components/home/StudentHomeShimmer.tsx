import React from 'react'

/** Full-page skeleton that mirrors StudentHome layout; used while events API is loading. */
export function StudentHomeShimmer() {
  return (
    <div className="flex flex-col gap-12 w-full md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto pb-[80px] md:pb-12 lg:pb-16">
      {/* Category nav */}
      <div className="flex gap-2 px-4 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-9 w-20 rounded-lg bg-tc-surface border border-tc-border animate-pulse overflow-hidden relative"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
        ))}
      </div>

      {/* Spotlight hero */}
      <div id="spotlight" className="w-full px-4">
        <div className="rounded-2xl border border-tc-border bg-tc-surface h-[220px] md:h-[400px] animate-pulse overflow-hidden relative">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Happening now */}
      <section className="w-full">
        <div className="flex items-center gap-3 w-full px-4 mb-3">
          <div className="h-[1px] bg-tc-border flex-1 max-w-[32px]" />
          <div className="h-3 w-24 rounded bg-tc-dim animate-pulse" />
          <div className="h-[1px] bg-tc-border flex-1" />
        </div>
        <div className="flex gap-4 px-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[200px] h-[240px] rounded-2xl bg-tc-surface border border-tc-border animate-pulse overflow-hidden relative"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
          ))}
        </div>
      </section>

      {/* Categories grid */}
      <section className="w-full">
        <div className="flex items-center gap-3 w-full px-4 mb-3">
          <div className="h-[1px] bg-tc-border flex-1 max-w-[32px]" />
          <div className="h-3 w-28 rounded bg-tc-dim animate-pulse" />
          <div className="h-[1px] bg-tc-border flex-1" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-xl bg-tc-surface border border-tc-border animate-pulse overflow-hidden relative"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
          ))}
        </div>
      </section>

      {/* Featured carousel */}
      <section className="w-full">
        <div className="flex items-center gap-3 w-full px-4 mb-3">
          <div className="h-[1px] bg-tc-border flex-1 max-w-[32px]" />
          <div className="h-3 w-32 rounded bg-tc-dim animate-pulse" />
          <div className="h-[1px] bg-tc-border flex-1" />
        </div>
        <div className="flex gap-4 px-4">
          <div className="shrink-0 w-[calc(100%-32px)] max-w-[480px] h-[300px] md:h-[360px] rounded-2xl bg-tc-surface border border-tc-border animate-pulse overflow-hidden relative">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-tc-dim" />
          ))}
        </div>
      </section>

      {/* Organisers row */}
      <section className="w-full">
        <div className="flex items-center gap-3 w-full px-4 mb-3">
          <div className="h-[1px] bg-tc-border flex-1 max-w-[32px]" />
          <div className="h-3 w-20 rounded bg-tc-dim animate-pulse" />
          <div className="h-[1px] bg-tc-border flex-1" />
        </div>
        <div className="flex gap-4 px-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="shrink-0 w-24 h-24 rounded-xl bg-tc-surface border border-tc-border animate-pulse overflow-hidden relative"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
          ))}
        </div>
      </section>

      {/* For you + promo blocks */}
      <div className="flex flex-col gap-6 px-4">
        <div className="h-40 rounded-2xl bg-tc-surface border border-tc-border animate-pulse overflow-hidden relative">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>
        <div className="h-24 rounded-2xl bg-tc-surface border border-tc-border animate-pulse overflow-hidden relative">
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Free + week */}
      <section className="w-full px-4">
        <div className="h-3 w-24 rounded bg-tc-dim animate-pulse mb-3" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="shrink-0 w-[160px] h-[200px] rounded-2xl bg-tc-surface border border-tc-border animate-pulse overflow-hidden relative"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
