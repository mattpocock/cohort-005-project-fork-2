import { and, desc, eq } from "drizzle-orm";
import {
  quizAnswers,
  quizAttempts,
  quizOptions,
  quizQuestions,
  quizzes,
} from "~/db/schema";
import type { Db } from "./db";

export function getQuizByLessonId(db: Db, lessonId: number) {
  return db.select().from(quizzes).where(eq(quizzes.lessonId, lessonId)).get();
}

export function getQuizById(db: Db, quizId: number) {
  return db.select().from(quizzes).where(eq(quizzes.id, quizId)).get();
}

export function getQuizWithQuestions(db: Db, quizId: number) {
  const quiz = db.select().from(quizzes).where(eq(quizzes.id, quizId)).get();
  if (!quiz) return null;

  const questions = db
    .select()
    .from(quizQuestions)
    .where(eq(quizQuestions.quizId, quizId))
    .orderBy(quizQuestions.position)
    .all();

  const questionsWithOptions = questions.map((question) => {
    const options = db
      .select()
      .from(quizOptions)
      .where(eq(quizOptions.questionId, question.id))
      .all();
    return { ...question, options };
  });

  return { ...quiz, questions: questionsWithOptions };
}

export function getBestAttempt(db: Db, userId: number, quizId: number) {
  return db
    .select()
    .from(quizAttempts)
    .where(
      and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId))
    )
    .orderBy(desc(quizAttempts.score))
    .limit(1)
    .get();
}

function calculateGrade(score: number): string {
  if (score >= 0.9) return "A";
  if (score >= 0.8) return "B";
  if (score >= 0.7) return "C";
  if (score >= 0.6) return "D";
  return "F";
}

type QuestionResult = {
  questionId: number;
  correct: boolean;
  selectedOptionId: number | null;
  correctOptionId: number | null;
};

export type QuizSubmission = {
  userId: number;
  quizId: number;
  selectedAnswers: Record<number, number>;
};

type Question = typeof quizQuestions.$inferSelect;

function findCorrectOptionId(db: Db, q: Question): number | null {
  if (q.questionType === "multiple_choice") {
    const opts = db
      .select()
      .from(quizOptions)
      .where(eq(quizOptions.questionId, q.id))
      .all();
    const correctOpt = opts.find((o) => o.isCorrect === true);
    return correctOpt ? correctOpt.id : null;
  }
  if (q.questionType === "true_false") {
    const correctOpt = db
      .select()
      .from(quizOptions)
      .where(
        and(eq(quizOptions.questionId, q.id), eq(quizOptions.isCorrect, true))
      )
      .get();
    return correctOpt ? correctOpt.id : null;
  }
  return null;
}

function scoreQuestion(
  db: Db,
  q: Question,
  selectedAnswers: Record<number, number>
): QuestionResult {
  const selected = selectedAnswers[q.id];
  if (!selected) {
    return {
      questionId: q.id,
      correct: false,
      selectedOptionId: null,
      correctOptionId: null,
    };
  }
  const correctOptionId = findCorrectOptionId(db, q);
  return {
    questionId: q.id,
    correct: selected === correctOptionId,
    selectedOptionId: selected,
    correctOptionId,
  };
}

function recordAttempt(
  db: Db,
  submission: QuizSubmission,
  outcome: { score: number; passed: boolean; results: QuestionResult[] }
) {
  const attempt = db
    .insert(quizAttempts)
    .values({
      userId: submission.userId,
      quizId: submission.quizId,
      score: outcome.score,
      passed: outcome.passed,
    })
    .returning()
    .get();

  for (const result of outcome.results) {
    if (result.selectedOptionId !== null) {
      db.insert(quizAnswers)
        .values({
          attemptId: attempt.id,
          questionId: result.questionId,
          selectedOptionId: result.selectedOptionId,
        })
        .run();
    }
  }

  return attempt;
}

export function computeResult(db: Db, submission: QuizSubmission) {
  const { quizId, selectedAnswers } = submission;
  try {
    const quiz = db.select().from(quizzes).where(eq(quizzes.id, quizId)).get();
    if (!quiz) {
      console.error("quiz not found");
      return null;
    }

    const questions = db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.position)
      .all();

    const questionResults = questions.map((q) =>
      scoreQuestion(db, q, selectedAnswers)
    );
    const correct = questionResults.filter((r) => r.correct).length;
    const total = questions.length;

    const scoreValue = total > 0 ? correct / total : 0;
    const passed = scoreValue > 0.7;
    const grade = calculateGrade(scoreValue);

    const attempt = recordAttempt(db, submission, {
      score: scoreValue,
      passed,
      results: questionResults,
    });

    return {
      attemptId: attempt.id,
      score: scoreValue,
      passed,
      grade,
      totalCorrect: correct,
      totalQuestions: total,
      questionResults,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}
