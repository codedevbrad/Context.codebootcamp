import Link from "next/link"
import { ArrowLeft, Compass, FolderKanban, Home, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

const suggestedRoutes = [
  {
    href: "/my",
    label: "Workspace",
    description: "Return to your project and context dashboard.",
    icon: Home,
  },
  {
    href: "/my/inspiration",
    label: "Inspiration",
    description: "Capture ideas before they disappear from context.",
    icon: Sparkles,
  },
  {
    href: "/my/about",
    label: "About Contextio",
    description: "See how contexts, projects, and ERM views connect.",
    icon: FolderKanban,
  },
]

export default function NotFound() {
  return (
    <main className="relative flex h-full min-h-[72vh] items-center justify-center overflow-hidden bg-[#050b16] py-8 text-slate-100">

      <section className="relative w-full max-w-4xl overflow-hidden p-7 sm:p-10">
        <p className="pointer-events-none absolute right-6 top-2 text-7xl font-black tracking-tighter text-blue-400/10 sm:text-9xl">
          404
        </p>

        <div className="relative z-10 mb-5 inline-flex items-center gap-2 rounded-full bg-[#0d172a] px-3 py-1 text-xs font-medium text-blue-200/80 shadow-sm">
          <Compass className="size-3.5 animate-bounce" />
          Navigation context lost
        </div>

        <div className="relative z-10 max-w-2xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-blue-200/70">Error 404</p>
          <h1 className="text-balance text-4xl font-black leading-tight tracking-tight text-blue-300 sm:text-6xl">
            Oops, nothing to be found here.
          </h1>
          <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
            This route is not mapped to a project, context, or ERM view in your workspace.
            Head back to your active flow and keep building.
          </p>
        </div>

        <div className="relative z-10 mt-7 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="bg-blue-600 text-white shadow-lg shadow-blue-900/40 transition-transform hover:scale-[1.02] hover:bg-blue-500">
            <Link href="/my" className="gap-2">
              <ArrowLeft className="size-4" />
              Back to workspace
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="bg-[#0d172a] text-blue-200 transition-all hover:scale-[1.02] hover:bg-[#12203a]">
            <Link href="/" className="gap-2">
              <Home className="size-4" />
              Go home
            </Link>
          </Button>
        </div>

        <div className="relative z-10 mt-8 grid gap-3 sm:grid-cols-3">
          {suggestedRoutes.map((route) => {
            const Icon = route.icon

            return (
              <Link
                key={route.href}
                href={route.href}
                className="group rounded-2xl bg-[#0d172a] p-4 shadow-lg shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#12203a] hover:shadow-xl hover:shadow-blue-900/30"
              >
                <div className="mb-3 inline-flex rounded-lg bg-blue-500/20 p-2 text-blue-300 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <Icon className="size-4" />
                </div>
                <p className="text-sm font-semibold text-slate-100">{route.label}</p>
                <p className="mt-1 text-xs text-slate-300">{route.description}</p>
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}
