import { CheckCircle2, Circle, PlayCircle } from "lucide-react";

const PREVIEW_LESSONS = [
  { title: "Setting up the project", state: "done" },
  { title: "Types from the ground up", state: "done" },
  { title: "Narrowing and guards", state: "current" },
  { title: "Generics in practice", state: "todo" },
  { title: "Quiz: the type system", state: "todo" },
] as const;

const lessonIcon = {
  done: <CheckCircle2 className="size-4 shrink-0 text-primary" />,
  current: <PlayCircle className="size-4 shrink-0 text-foreground" />,
  todo: <Circle className="size-4 shrink-0 text-muted-foreground/50" />,
};

/** A static picture of a learner mid-course, for the landing page hero. */
export function LandingPreview() {
  return (
    <div aria-hidden className="relative">
      <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 via-muted to-transparent" />
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Module 2 · Lesson 3
            </p>
            <p className="mt-1 font-semibold">Introduction to TypeScript</p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            40% complete
          </span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/5 rounded-full bg-primary" />
        </div>
        <ul className="mt-6 space-y-1">
          {PREVIEW_LESSONS.map((lesson) => (
            <li
              key={lesson.title}
              className={
                lesson.state === "current"
                  ? "flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5 text-sm font-medium"
                  : "flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground"
              }
            >
              {lessonIcon[lesson.state]}
              {lesson.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
