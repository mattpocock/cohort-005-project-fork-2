import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "~/components/ui/button";
import { LandingPreview } from "~/components/landing-preview";
import type { LandingStats } from "~/modules/landing/index.server";

/** The landing page's opening section: pitch, calls to action and catalogue figures. */
export function LandingHero({
  stats,
  signedIn,
}: {
  stats: LandingStats;
  signedIn: boolean;
}) {
  return (
    <section className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:py-28">
      <div>
        <p className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary" />
          Courses for developers, by developers
        </p>
        <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">
          Learn to code,
          <br />
          <span className="text-muted-foreground">at your own pace</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Structured courses built by experienced instructors. Track your
          progress, take quizzes, and build real-world skills.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Button asChild size="lg">
            <Link to="/courses">
              Browse Courses
              <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            {signedIn ? (
              <Link to="/dashboard">Go to your dashboard</Link>
            ) : (
              <Link to="/signup">Create a free account</Link>
            )}
          </Button>
        </div>
        <HeroStats stats={stats} />
      </div>
      <div className="hidden lg:block">
        <LandingPreview />
      </div>
    </section>
  );
}

function HeroStats({ stats }: { stats: LandingStats }) {
  return (
    <dl className="mt-12 flex flex-wrap gap-x-10 gap-y-6 border-t border-border pt-8">
      {[
        { label: "Courses", value: stats.courses },
        { label: "Lessons", value: stats.lessons },
        { label: "Instructors", value: stats.instructors },
        { label: "Categories", value: stats.categories },
      ].map((stat) => (
        <div key={stat.label} className="flex flex-col-reverse">
          <dt className="mt-1 text-sm text-muted-foreground">{stat.label}</dt>
          <dd className="text-3xl font-bold tracking-tight">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
