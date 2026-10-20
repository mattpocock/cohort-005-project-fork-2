import { useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, ChevronDown, Circle, PlayCircle } from "lucide-react";
import { LessonProgressStatus } from "~/db/schema";
import { cn } from "~/lib/utils";

export function LessonBreadcrumb({
  course,
  mod,
  lessonTitle,
}: {
  course: { title: string; slug: string };
  mod: { id: number; title: string };
  lessonTitle: string;
}) {
  return (
    <nav className="mb-6 text-sm text-muted-foreground">
      <Link to="/courses" className="hover:text-foreground">
        Courses
      </Link>
      <span className="mx-2">/</span>
      <Link to={`/courses/${course.slug}`} className="hover:text-foreground">
        {course.title}
      </Link>
      <span className="mx-2">/</span>
      <Link
        to={`/courses/${course.slug}/${mod.id}`}
        className="hover:text-foreground"
      >
        {mod.title}
      </Link>
      <span className="mx-2">/</span>
      <span className="text-foreground">{lessonTitle}</span>
    </nav>
  );
}

export function CurriculumSidebar({
  course,
  curriculum,
  currentLessonId,
  lessonProgressMap,
  enrolled,
}: {
  course: { id: number; title: string; slug: string };
  curriculum: Array<{
    id: number;
    title: string;
    lessons: Array<{ id: number; title: string }>;
  }>;
  currentLessonId: number;
  lessonProgressMap: Record<number, string>;
  enrolled: boolean;
}) {
  // Find which module the current lesson belongs to
  const currentModuleId = curriculum.find((m) =>
    m.lessons.some((l) => l.id === currentLessonId)
  )?.id;

  const [expandedModules, setExpandedModules] = useState<Set<number>>(() => {
    // Start with current module expanded
    const initial = new Set<number>();
    if (currentModuleId) initial.add(currentModuleId);
    return initial;
  });

  function toggleModule(moduleId: number) {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }

  return (
    <aside className="hidden w-72 shrink-0 border-r border-border lg:block">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto">
        <div className="border-b border-border p-4">
          <Link
            to={`/courses/${course.slug}`}
            className="text-sm font-semibold hover:text-primary"
          >
            {course.title}
          </Link>
        </div>

        <nav className="flex-1 p-2">
          {curriculum.map((mod) => {
            const isExpanded = expandedModules.has(mod.id);

            return (
              <div key={mod.id} className="mb-1">
                <button
                  onClick={() => toggleModule(mod.id)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                >
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 transition-transform",
                      !isExpanded && "-rotate-90"
                    )}
                  />
                  <span className="flex-1 text-left">{mod.title}</span>
                </button>

                {isExpanded && (
                  <ul className="ml-4 space-y-0.5 py-1">
                    {mod.lessons.map((l) => {
                      const isCurrent = l.id === currentLessonId;
                      const status = lessonProgressMap[l.id];
                      const isCompleted =
                        status === LessonProgressStatus.Completed;
                      const isInProgress =
                        status === LessonProgressStatus.InProgress;

                      return (
                        <li key={l.id}>
                          <Link
                            to={`/courses/${course.slug}/lessons/${l.id}`}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                              isCurrent
                                ? "bg-primary/10 font-medium text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {enrolled ? (
                              isCompleted ? (
                                <CheckCircle2 className="size-3.5 shrink-0 text-green-500" />
                              ) : isInProgress ? (
                                <PlayCircle className="size-3.5 shrink-0 text-blue-500" />
                              ) : (
                                <Circle className="size-3.5 shrink-0" />
                              )
                            ) : (
                              <Circle className="size-3.5 shrink-0" />
                            )}
                            <span className="truncate">{l.title}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
