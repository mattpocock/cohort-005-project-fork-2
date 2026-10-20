import type { Route } from "../routes/+types/courses.$slug.lessons.$lessonId";

export type LessonLoaderData = Route.ComponentProps["loaderData"];
export type FullLessonData = Extract<LessonLoaderData, { view: "full" }>;
export type LockedLessonData = Extract<LessonLoaderData, { view: "locked" }>;
