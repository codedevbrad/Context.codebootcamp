import Link from "next/link";

export default function Home() {
  return (
    <div className="relative h-full overflow-auto rounded-2xl border border-white/10 bg-slate-950 px-6 py-10 text-white shadow-2xl shadow-cyan-500/10 sm:px-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col justify-between gap-10">
        <section className="grid items-center gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-xs font-semibold tracking-wide text-cyan-200 uppercase">
              New Context Workspace
            </p>
            <h1 className="text-4xl leading-tight font-black tracking-tight sm:text-5xl">
              Build smarter projects with all your context in one place.
            </h1>
            <p className="max-w-xl text-base text-slate-300 sm:text-lg">
              Contextio keeps docs, ideas, and implementation details connected
              so you can move from planning to shipping without losing momentum.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/my"
                className="rounded-xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Open My Contexts
              </Link>
              <button
                type="button"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:border-white/40 hover:bg-white/10"
              >
                Watch Demo
              </button>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs font-semibold tracking-wide text-cyan-200 uppercase">
                Active Project
              </p>
              <h3 className="mt-2 text-xl font-bold">Q2 Product Launch</h3>
              <p className="mt-2 text-sm text-slate-300">
                12 docs synced • 4 blockers identified • next milestone in 3
                days
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-3xl font-black text-cyan-300">98%</p>
                <p className="mt-1 text-xs text-slate-300">
                  context relevance score
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-3xl font-black text-fuchsia-300">4x</p>
                <p className="mt-1 text-xs text-slate-300">
                  faster onboarding speed
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-2 md:grid-cols-3">
          {[
            {
              title: "Connected Notes",
              desc: "Link insights to code paths, decisions, and next actions in seconds.",
            },
            {
              title: "AI Context Recall",
              desc: "Surface the exact details your team needs at the perfect moment.",
            },
            {
              title: "Project Memory",
              desc: "Keep everything discoverable long after sprint docs go stale.",
            },
          ].map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
            >
              <h4 className="text-lg font-semibold">{feature.title}</h4>
              <p className="mt-2 text-sm text-slate-300">{feature.desc}</p>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
