import { describe, it, expect, beforeEach } from "vitest";
import { QuestionType } from "~/db/schema";
import { addQuiz, addTrueFalseQuiz, setUpCourse } from "./fixtures";

let course: ReturnType<typeof setUpCourse>;

beforeEach(() => {
  course = setUpCourse();
});

function answer(
  questions: Array<{ id: number; right: number; wrong: number }>,
  rightCount: number
) {
  return Object.fromEntries(
    questions.map((q, i) => [q.id, i < rightCount ? q.right : q.wrong])
  );
}

describe("quiz scoring", () => {
  it("scores the answers, grades them and records the attempt", () => {
    const { db, base, viewer, lessonIds } = course;
    const { quiz, questions } = addTrueFalseQuiz(db, lessonIds[0], 4);

    const result = viewer.computeResult(
      base.user.id,
      quiz.id,
      answer(questions, 3)
    );

    expect(result).toMatchObject({
      score: 0.75,
      passed: true,
      grade: "C",
      totalCorrect: 3,
      totalQuestions: 4,
    });
    expect(result?.questionResults[3]).toEqual({
      questionId: questions[3].id,
      correct: false,
      selectedOptionId: questions[3].wrong,
      correctOptionId: questions[3].right,
    });
    expect(viewer.getBestAttempt(base.user.id, quiz.id)?.score).toBe(0.75);
  });

  it.each([
    [10, 10, "A", true],
    [10, 9, "A", true],
    [10, 8, "B", true],
    [10, 7, "C", false],
    [10, 6, "D", false],
    [10, 5, "F", false],
  ])(
    "grades %i questions with %i right as %s",
    (...[count, right, grade, passed]) => {
      const { db, base, viewer, lessonIds } = course;
      const { quiz, questions } = addTrueFalseQuiz(db, lessonIds[0], count);
      const result = viewer.computeResult(
        base.user.id,
        quiz.id,
        answer(questions, right)
      );
      expect(result?.grade).toBe(grade);
      expect(result?.passed).toBe(passed);
    }
  );

  it("scores multiple-choice questions against their correct option", () => {
    const { db, base, viewer, lessonIds } = course;
    const { quiz, questions } = addQuiz(db, lessonIds[0], [
      QuestionType.MultipleChoice,
      QuestionType.MultipleChoice,
    ]);
    const result = viewer.computeResult(
      base.user.id,
      quiz.id,
      answer(questions, 1)
    );
    expect(result?.totalCorrect).toBe(1);
    expect(result?.questionResults[0].correctOptionId).toBe(questions[0].right);
  });

  it("counts an unanswered question as wrong", () => {
    const { db, base, viewer, lessonIds } = course;
    const { quiz, questions } = addTrueFalseQuiz(db, lessonIds[0], 2);
    const result = viewer.computeResult(base.user.id, quiz.id, {
      [questions[0].id]: questions[0].right,
    });
    expect(result?.score).toBe(0.5);
    expect(result?.passed).toBe(false);
    expect(result?.questionResults[1]).toEqual({
      questionId: questions[1].id,
      correct: false,
      selectedOptionId: null,
      correctOptionId: null,
    });
  });

  it("scores a quiz with no questions as zero", () => {
    const { db, base, viewer, lessonIds } = course;
    const { quiz } = addTrueFalseQuiz(db, lessonIds[0], 0);
    const result = viewer.computeResult(base.user.id, quiz.id, {});
    expect(result?.score).toBe(0);
    expect(result?.grade).toBe("F");
  });

  it("returns null for an unknown quiz", () => {
    const { base, viewer } = course;
    expect(viewer.computeResult(base.user.id, 9999, {})).toBeNull();
  });

  it("keeps the best attempt", () => {
    const { db, base, viewer, lessonIds } = course;
    const { quiz, questions } = addTrueFalseQuiz(db, lessonIds[0], 2);
    viewer.computeResult(base.user.id, quiz.id, answer(questions, 2));
    viewer.computeResult(base.user.id, quiz.id, answer(questions, 1));
    expect(viewer.getBestAttempt(base.user.id, quiz.id)).toMatchObject({
      score: 1,
      passed: true,
    });
  });

  it("finds the quiz on a lesson, with its questions and options", () => {
    const { db, viewer, lessonIds } = course;
    const { quiz } = addTrueFalseQuiz(db, lessonIds[1], 1);
    expect(viewer.getQuizByLessonId(lessonIds[1])?.id).toBe(quiz.id);
    expect(viewer.getQuizByLessonId(lessonIds[0])).toBeUndefined();
    expect(viewer.getQuizById(quiz.id)?.lessonId).toBe(lessonIds[1]);
    const withQuestions = viewer.getQuizWithQuestions(quiz.id);
    expect(withQuestions?.questions).toHaveLength(1);
    expect(withQuestions?.questions[0].options).toHaveLength(2);
    expect(viewer.getQuizWithQuestions(9999)).toBeNull();
  });
});
