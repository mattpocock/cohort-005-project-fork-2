import { createTestDb, seedBaseData, type TestDb } from "~/test/setup";
import * as schema from "~/db/schema";
import { QuestionType } from "~/db/schema";
import { createLessonViewer } from "../index.server";

// Course content, quizzes and watch events are written by code with no service
// yet (the instructor pages, the video tracking API), so these rows go in
// directly. Kept in one place so a schema change touches only this file.

export function setUpCourse() {
  const db = createTestDb();
  const base = seedBaseData(db);
  const viewer = createLessonViewer(db);
  const second = addModule(db, base.course.id, {
    title: "Second",
    position: 2,
  });
  const first = addModule(db, base.course.id, { title: "First", position: 1 });
  const lessonIds = [
    addLesson(db, first.id, { title: "One", position: 1 }).id,
    addLesson(db, first.id, { title: "Two", position: 2 }).id,
    addLesson(db, second.id, { title: "Three", position: 1 }).id,
  ];
  return { db, base, viewer, lessonIds };
}

function addModule(
  db: TestDb,
  courseId: number,
  { title, position }: { title: string; position: number }
) {
  return db
    .insert(schema.modules)
    .values({ courseId, title, position })
    .returning()
    .get();
}

function addLesson(
  db: TestDb,
  moduleId: number,
  { title, position }: { title: string; position: number }
) {
  return db
    .insert(schema.lessons)
    .values({ moduleId, title, position })
    .returning()
    .get();
}

export function addWatchEvent(
  db: TestDb,
  event: {
    userId: number;
    lessonId: number;
    positionSeconds: number;
    at: string;
  }
) {
  db.insert(schema.videoWatchEvents)
    .values({
      userId: event.userId,
      lessonId: event.lessonId,
      eventType: "progress",
      positionSeconds: event.positionSeconds,
      createdAt: event.at,
    })
    .run();
}

export function addQuiz(
  db: TestDb,
  lessonId: number,
  questionTypes: QuestionType[]
) {
  const quiz = db
    .insert(schema.quizzes)
    .values({ lessonId, title: "Check", passingScore: 0.7 })
    .returning()
    .get();
  const questions = questionTypes.map((questionType, i) => {
    const question = db
      .insert(schema.quizQuestions)
      .values({
        quizId: quiz.id,
        questionText: `Question ${i + 1}`,
        questionType,
        position: i + 1,
      })
      .returning()
      .get();
    const [wrong, right] = [false, true].map((isCorrect) =>
      db
        .insert(schema.quizOptions)
        .values({
          questionId: question.id,
          optionText: String(isCorrect),
          isCorrect,
        })
        .returning()
        .get()
    );
    return { id: question.id, right: right.id, wrong: wrong.id };
  });
  return { quiz, questions };
}

export function addTrueFalseQuiz(db: TestDb, lessonId: number, count: number) {
  return addQuiz(db, lessonId, Array(count).fill(QuestionType.TrueFalse));
}
