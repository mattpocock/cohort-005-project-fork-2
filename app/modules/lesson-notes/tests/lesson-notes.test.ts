import { describe, it, expect } from "vitest";
import { describeNoteDraft } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

describe("describeNoteDraft", () => {
  it("cannot save an empty box when there is no note yet", () => {
    expect(describeNoteDraft("", null)).toEqual({
      length: 0,
      limit: MAX_NOTE_LENGTH,
      tooLong: false,
      empty: true,
      unsaved: false,
      canSave: false,
    });
  });

  it("can save new text", () => {
    const draft = describeNoteDraft("Result types beat throws", null);

    expect(draft.length).toBe(24);
    expect(draft.unsaved).toBe(true);
    expect(draft.canSave).toBe(true);
  });

  it("has nothing to save when the text matches the saved note", () => {
    const draft = describeNoteDraft("same", "same");

    expect(draft.unsaved).toBe(false);
    expect(draft.canSave).toBe(false);
  });

  it("can save an edit to the saved note", () => {
    const draft = describeNoteDraft("same, but more", "same");

    expect(draft.unsaved).toBe(true);
    expect(draft.canSave).toBe(true);
  });

  it("treats whitespace-only text as empty", () => {
    const draft = describeNoteDraft("   \n ", "old note");

    expect(draft.empty).toBe(true);
    expect(draft.unsaved).toBe(true);
    expect(draft.canSave).toBe(false);
  });

  it("has nothing to save when only surrounding whitespace differs", () => {
    const draft = describeNoteDraft("idea\n", "idea");

    expect(draft.unsaved).toBe(false);
    expect(draft.canSave).toBe(false);
  });

  it("does not count surrounding whitespace toward the limit", () => {
    const draft = describeNoteDraft(` ${"a".repeat(MAX_NOTE_LENGTH)} `, null);

    expect(draft.length).toBe(MAX_NOTE_LENGTH);
    expect(draft.tooLong).toBe(false);
    expect(draft.canSave).toBe(true);
  });

  it("allows a note exactly at the limit", () => {
    const draft = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH), null);

    expect(draft.tooLong).toBe(false);
    expect(draft.canSave).toBe(true);
  });

  it("refuses a note one character over the limit", () => {
    const draft = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH + 1), null);

    expect(draft.tooLong).toBe(true);
    expect(draft.canSave).toBe(false);
  });
});
