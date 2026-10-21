import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, seedBaseData, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { CourseStatus, UserRole } from "~/db/schema";
import { markdown } from "~/lib/text";
import { createLanding } from "../index.server";

let db: TestDb;
let instructorId: number;
let categoryId: number;
let baseCourseId: number;

beforeEach(() => {
  db = createTestDb();
  const base = seedBaseData(db);
  instructorId = base.instructor.id;
  categoryId = base.category.id;
  baseCourseId = base.course.id;
});

// ─── Fixtures ───
// No module writes courses, modules or lessons yet, so rows go in directly.
// Kept in one place so a schema change touches only this block.

let slugCounter = 0;

function addInstructor(name: string) {
  return db
    .insert(schema.users)
    .values({
      name,
      email: `${name.toLowerCase().replaceAll(" ", ".")}@example.com`,
      role: UserRole.Instructor,
    })
    .returning()
    .get();
}

function addCategory(name: string) {
  return db
    .insert(schema.categories)
    .values({ name, slug: name.toLowerCase() })
    .returning()
    .get();
}

function addCourse(
  title: string,
  {
    status = CourseStatus.Published,
    createdAt = "2026-01-01T00:00:00.000Z",
    owner = instructorId,
    category = categoryId,
  }: {
    status?: CourseStatus;
    createdAt?: string;
    owner?: number;
    category?: number;
  } = {}
) {
  slugCounter += 1;
  return db
    .insert(schema.courses)
    .values({
      title,
      slug: `course-${slugCounter}`,
      description: `${title} description`,
      salesCopy: markdown(title),
      instructorId: owner,
      categoryId: category,
      status,
      createdAt,
    })
    .returning()
    .get();
}

function addLessons(courseId: number, lessonCount: number) {
  const module = db
    .insert(schema.modules)
    .values({ courseId, title: "Module", position: 1 })
    .returning()
    .get();
  for (let position = 1; position <= lessonCount; position++) {
    db.insert(schema.lessons)
      .values({ moduleId: module.id, title: `Lesson ${position}`, position })
      .run();
  }
}

function get() {
  return createLanding(db).get();
}

describe("featured courses", () => {
  it("features the three newest published courses, newest first", () => {
    db.delete(schema.courses).run();
    addCourse("Oldest", { createdAt: "2025-01-01T00:00:00.000Z" });
    addCourse("Newest", { createdAt: "2026-06-01T00:00:00.000Z" });
    addCourse("Middle", { createdAt: "2026-03-01T00:00:00.000Z" });
    addCourse("Newer", { createdAt: "2026-05-01T00:00:00.000Z" });

    expect(get().featuredCourses.map((c) => c.title)).toEqual([
      "Newest",
      "Newer",
      "Middle",
    ]);
  });

  it("leaves out draft and archived courses", () => {
    addCourse("Draft", {
      status: CourseStatus.Draft,
      createdAt: "2026-09-01T00:00:00.000Z",
    });
    addCourse("Archived", {
      status: CourseStatus.Archived,
      createdAt: "2026-09-01T00:00:00.000Z",
    });

    expect(get().featuredCourses.map((c) => c.title)).toEqual(["Test Course"]);
  });

  it("carries what a course card shows", () => {
    db.delete(schema.courses).run();
    const author = addInstructor("Ada Author");
    const course = addCourse("Shown", { owner: author.id });

    expect(get().featuredCourses).toEqual([
      {
        id: course.id,
        title: "Shown",
        slug: course.slug,
        description: "Shown description",
        coverImageUrl: null,
        instructorName: "Ada Author",
        categoryName: "Programming",
        lessonCount: 0,
      },
    ]);
  });

  it("counts each course's lessons across all of its modules", () => {
    const course = addCourse("Busy", { createdAt: "2026-06-01T00:00:00.000Z" });
    addLessons(course.id, 3);
    addLessons(course.id, 2);
    addLessons(baseCourseId, 1);

    const counts = Object.fromEntries(
      get().featuredCourses.map((c) => [c.title, c.lessonCount])
    );
    expect(counts).toEqual({ Busy: 5, "Test Course": 1 });
  });

  it("features nothing when nothing is published", () => {
    db.delete(schema.courses).run();

    expect(get().featuredCourses).toEqual([]);
  });
});

describe("stats", () => {
  it("counts every published course, not just the featured ones", () => {
    for (let i = 0; i < 4; i++) addCourse(`Course ${i}`);
    addCourse("Draft", { status: CourseStatus.Draft });

    expect(get().stats.courses).toBe(5);
  });

  it("counts lessons in published courses only", () => {
    addLessons(baseCourseId, 4);
    const draft = addCourse("Draft", { status: CourseStatus.Draft });
    addLessons(draft.id, 7);

    expect(get().stats.lessons).toBe(4);
  });

  it("counts each instructor with a published course once", () => {
    const second = addInstructor("Second Instructor");
    const unpublished = addInstructor("Unpublished Instructor");
    addCourse("Another by the first");
    addCourse("By the second", { owner: second.id });
    addCourse("Draft", { status: CourseStatus.Draft, owner: unpublished.id });

    expect(get().stats.instructors).toBe(2);
  });

  it("counts each category with a published course once", () => {
    const design = addCategory("Design");
    const data = addCategory("Data");
    addCategory("Empty");
    addCourse("Layout", { category: design.id });
    addCourse("More layout", { category: design.id });
    addCourse("Draft data", { status: CourseStatus.Draft, category: data.id });

    expect(get().stats.categories).toBe(2);
  });

  it("is all zeros on an empty catalogue", () => {
    db.delete(schema.courses).run();
    db.delete(schema.categories).run();

    expect(get().stats).toEqual({
      courses: 0,
      lessons: 0,
      instructors: 0,
      categories: 0,
    });
  });
});
