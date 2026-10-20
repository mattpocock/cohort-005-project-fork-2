import { db } from "~/db";
import type { Db } from "./lib/db";
import {
  flattenCourseLessons,
  getCourseWithDetails,
  getLessonById,
  getModuleById,
  getUserById,
} from "./lib/course";
import {
  calculateWatchProgress,
  getLastWatchPosition,
  getLessonProgress,
  getLessonProgressForCourse,
  markLessonComplete,
  markLessonInProgress,
} from "./lib/progress";
import { getCommentById, getLessonThread } from "./lib/thread";
import {
  computeResult,
  getBestAttempt,
  getQuizById,
  getQuizByLessonId,
  getQuizWithQuestions,
} from "./lib/quiz";

export type { ThreadComment } from "./lib/thread";
export { flattenCourseLessons };

/**
 * What the Lesson page reads and writes, bound to a database. The app uses
 * `lessonViewer`, which reads the app database; tests build their own against
 * a test database.
 */
export function createLessonViewer(database: Db) {
  return {
    getCourseWithDetails: (courseId: number) =>
      getCourseWithDetails(database, courseId),
    getLessonById: (lessonId: number) => getLessonById(database, lessonId),
    getModuleById: (moduleId: number) => getModuleById(database, moduleId),
    getUserById: (userId: number) => getUserById(database, userId),

    getLessonProgress: (userId: number, lessonId: number) =>
      getLessonProgress(database, userId, lessonId),
    getLessonProgressForCourse: (userId: number, courseId: number) =>
      getLessonProgressForCourse(database, userId, courseId),
    markLessonComplete: (userId: number, lessonId: number, now: Date) =>
      markLessonComplete(database, { userId, lessonId }, now),
    markLessonInProgress: (userId: number, lessonId: number) =>
      markLessonInProgress(database, userId, lessonId),
    getLastWatchPosition: (userId: number, lessonId: number) =>
      getLastWatchPosition(database, userId, lessonId),
    calculateWatchProgress: (
      userId: number,
      lessonId: number,
      videoDurationSeconds: number
    ) =>
      calculateWatchProgress(
        database,
        { userId, lessonId },
        videoDurationSeconds
      ),

    getCommentById: (commentId: number) => getCommentById(database, commentId),
    getLessonThread: (lessonId: number) => getLessonThread(database, lessonId),

    getQuizById: (quizId: number) => getQuizById(database, quizId),
    getQuizByLessonId: (lessonId: number) =>
      getQuizByLessonId(database, lessonId),
    getQuizWithQuestions: (quizId: number) =>
      getQuizWithQuestions(database, quizId),
    getBestAttempt: (userId: number, quizId: number) =>
      getBestAttempt(database, userId, quizId),
    computeResult: (
      userId: number,
      quizId: number,
      selectedAnswers: Record<number, number>
    ) => computeResult(database, { userId, quizId, selectedAnswers }),
  };
}

// Pure so a route importing this only for its loader doesn't pull the
// database into the client bundle (see `~/db`).
export const lessonViewer = /* @__PURE__ */ createLessonViewer(db);
