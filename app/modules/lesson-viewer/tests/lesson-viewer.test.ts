import { describe, it, expect, beforeEach } from "vitest";
import * as schema from "~/db/schema";
import { LessonProgressStatus, UserRole } from "~/db/schema";
import { createComment, deleteComment } from "~/lib/comments.server";
import { fakeNotifications } from "~/lib/notifications.fake.server";
import { markdown } from "~/lib/text";
import { flattenCourseLessons } from "../index.server";
import { addWatchEvent, setUpCourse } from "./fixtures";

const NOW = new Date("2026-10-06T12:00:00.000Z");

let course: ReturnType<typeof setUpCourse>;

beforeEach(() => {
  course = setUpCourse();
});

describe("course outline", () => {
  it("lists modules and lessons in position order", () => {
    const { base, viewer } = course;
    const details = viewer.getCourseWithDetails(base.course.id);
    if (!details) throw new Error("course not found");
    expect(details.instructorName).toBe(base.instructor.name);
    expect(details.modules.map((m) => m.title)).toEqual(["First", "Second"]);
    expect(details.modules.map((m) => m.lessons.length)).toEqual([2, 1]);
    expect(flattenCourseLessons(details).map((l) => l.title)).toEqual([
      "One",
      "Two",
      "Three",
    ]);
  });

  it("returns null for an unknown course", () => {
    expect(course.viewer.getCourseWithDetails(9999)).toBeNull();
  });

  it("finds a lesson, its module, its course and a user", () => {
    const { base, viewer, lessonIds } = course;
    const lesson = viewer.getLessonById(lessonIds[2]);
    expect(lesson?.title).toBe("Three");
    expect(viewer.getModuleById(lesson?.moduleId ?? 0)?.title).toBe("Second");
    expect(viewer.getUserById(base.instructor.id)?.name).toBe(
      base.instructor.name
    );
  });
});

describe("lesson progress", () => {
  it("marks a viewed lesson in progress", () => {
    const { base, viewer, lessonIds } = course;
    viewer.markLessonInProgress(base.user.id, lessonIds[0]);
    expect(viewer.getLessonProgress(base.user.id, lessonIds[0])?.status).toBe(
      LessonProgressStatus.InProgress
    );
  });

  it("stamps completion with the time it is given", () => {
    const { base, viewer, lessonIds } = course;
    viewer.markLessonInProgress(base.user.id, lessonIds[0]);
    viewer.markLessonComplete(base.user.id, lessonIds[0], NOW);
    const progress = viewer.getLessonProgress(base.user.id, lessonIds[0]);
    expect(progress?.status).toBe(LessonProgressStatus.Completed);
    expect(progress?.completedAt).toBe(NOW.toISOString());
  });

  it("does not move a completed lesson back to in progress", () => {
    const { base, viewer, lessonIds } = course;
    viewer.markLessonComplete(base.user.id, lessonIds[1], NOW);
    viewer.markLessonInProgress(base.user.id, lessonIds[1]);
    viewer.markLessonInProgress(base.user.id, lessonIds[2]);
    viewer.markLessonInProgress(base.user.id, lessonIds[2]);
    expect(viewer.getLessonProgress(base.user.id, lessonIds[1])?.status).toBe(
      LessonProgressStatus.Completed
    );
    expect(
      viewer.getLessonProgressForCourse(base.user.id, base.course.id)
    ).toHaveLength(2);
  });

  it("lists progress for every lesson in the course, and only that learner's", () => {
    const { base, viewer, lessonIds } = course;
    viewer.markLessonInProgress(base.user.id, lessonIds[0]);
    viewer.markLessonComplete(base.user.id, lessonIds[2], NOW);
    viewer.markLessonInProgress(base.instructor.id, lessonIds[1]);
    const records = viewer.getLessonProgressForCourse(
      base.user.id,
      base.course.id
    );
    expect(records.map((r) => r.lessonId).sort()).toEqual(
      [lessonIds[0], lessonIds[2]].sort()
    );
  });

  it("has no progress for a course with no lessons", () => {
    const { db, base, viewer } = course;
    const empty = db
      .insert(schema.courses)
      .values({
        title: "Empty",
        slug: "empty",
        description: "",
        salesCopy: markdown(""),
        status: schema.CourseStatus.Draft,
        instructorId: base.instructor.id,
        categoryId: base.category.id,
      })
      .returning()
      .get();
    expect(viewer.getLessonProgressForCourse(base.user.id, empty.id)).toEqual(
      []
    );
  });
});

describe("video watch state", () => {
  it("resumes from the latest position, and reports the furthest reached", () => {
    const { db, base, viewer, lessonIds } = course;
    const viewing = { userId: base.user.id, lessonId: lessonIds[0] };
    addWatchEvent(db, {
      ...viewing,
      positionSeconds: 90,
      at: "2026-10-06T10:00:00Z",
    });
    addWatchEvent(db, {
      ...viewing,
      positionSeconds: 30,
      at: "2026-10-06T11:00:00Z",
    });

    expect(viewer.getLastWatchPosition(base.user.id, lessonIds[0])).toBe(30);
    expect(viewer.calculateWatchProgress(base.user.id, lessonIds[0], 120)).toBe(
      75
    );
  });

  it("caps progress at 100 and starts unwatched videos at zero", () => {
    const { db, base, viewer, lessonIds } = course;
    addWatchEvent(db, {
      userId: base.user.id,
      lessonId: lessonIds[0],
      positionSeconds: 200,
      at: "2026-10-06T10:00:00Z",
    });
    expect(viewer.calculateWatchProgress(base.user.id, lessonIds[0], 120)).toBe(
      100
    );
    expect(viewer.calculateWatchProgress(base.user.id, lessonIds[0], 0)).toBe(
      0
    );
    expect(viewer.getLastWatchPosition(base.user.id, lessonIds[1])).toBe(0);
    expect(viewer.calculateWatchProgress(base.user.id, lessonIds[1], 120)).toBe(
      0
    );
  });
});

describe("lesson thread", () => {
  async function post(authorId: number, body: string, parentId: number | null) {
    const created = await createComment(
      course.db,
      authorId,
      course.lessonIds[0],
      parentId,
      body,
      NOW,
      fakeNotifications()
    );
    if (!created.ok) throw new Error(created.error);
    return created.comment;
  }

  function remove(commentId: number, userId: number) {
    return deleteComment(
      course.db,
      commentId,
      userId,
      false,
      NOW,
      fakeNotifications()
    );
  }

  it("nests replies and marks the instructor and platform admins", async () => {
    const { db, base, viewer, lessonIds } = course;
    const admin = db
      .insert(schema.users)
      .values({
        name: "Pat Admin",
        email: "pat@example.com",
        role: UserRole.Admin,
      })
      .returning()
      .get();
    const question = await post(base.user.id, "How do generics work?", null);
    await post(base.instructor.id, "Like arguments, for types.", question.id);
    await post(admin.id, "See the handbook too.", question.id);

    const thread = viewer.getLessonThread(lessonIds[0]);

    expect(thread).toHaveLength(1);
    expect(thread[0].author).toMatchObject({
      isInstructor: false,
      isPlatformAdmin: false,
    });
    expect(thread[0].replies.map((r) => r.author)).toMatchObject([
      { isInstructor: true, isPlatformAdmin: false },
      { isInstructor: false, isPlatformAdmin: true },
    ]);
    expect(viewer.getCommentById(question.id)?.lessonId).toBe(lessonIds[0]);
  });

  it("blanks a deleted question that still has replies, and drops deleted replies", async () => {
    const { base, viewer, lessonIds } = course;
    const question = await post(base.user.id, "A question", null);
    await post(base.instructor.id, "An answer", question.id);
    const gone = await post(base.user.id, "Never mind", question.id);
    await remove(gone.id, base.user.id);
    await remove(question.id, base.user.id);

    const thread = viewer.getLessonThread(lessonIds[0]);

    expect(thread).toHaveLength(1);
    expect(thread[0]).toMatchObject({
      deleted: true,
      body: "",
      editedAt: null,
    });
    expect(thread[0].replies.map((r) => r.body)).toEqual(["An answer"]);
  });

  it("drops a deleted question with no replies", async () => {
    const { base, viewer, lessonIds } = course;
    const question = await post(base.user.id, "A question", null);
    await post(base.user.id, "Another question", null);
    await remove(question.id, base.user.id);

    expect(viewer.getLessonThread(lessonIds[0]).map((c) => c.body)).toEqual([
      "Another question",
    ]);
  });
});
