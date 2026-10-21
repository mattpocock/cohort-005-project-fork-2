import { Compass, ListChecks, TrendingUp } from "lucide-react";

const STEPS = [
  {
    icon: Compass,
    title: "Pick a course",
    body: "Browse the catalogue by category and start with whatever you need next.",
  },
  {
    icon: ListChecks,
    title: "Learn by doing",
    body: "Short video lessons with quizzes, so you know it stuck before you move on.",
  },
  {
    icon: TrendingUp,
    title: "Track your progress",
    body: "Your dashboard remembers where you left off, across every course.",
  },
];

/** The landing page's three-step walk through using Cadence. */
export function HowItWorks() {
  return (
    <section className="border-y border-border bg-muted/50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
        <p className="mt-2 text-muted-foreground">
          From your first lesson to your last quiz, in three steps.
        </p>
        <ol className="mt-10 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10">
                <step.icon className="size-6 text-primary" />
              </div>
              <p className="mt-5 text-sm font-medium text-muted-foreground">
                Step {index + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
