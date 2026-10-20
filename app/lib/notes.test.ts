import { describe, it, expect } from "vitest";
import { describeNoteDraft, MAX_NOTE_LENGTH } from "./notes";

describe("describeNoteDraft", () => {
  it("cannot save an empty draft when there is no Note yet", () => {
    expect(describeNoteDraft("", "")).toEqual({
      length: 0,
      tooLong: false,
      unsaved: false,
      canSave: false,
    });
  });

  it("cannot save a draft of only whitespace", () => {
    const draft = describeNoteDraft("   \n ", "");
    expect(draft.length).toBe(0);
    expect(draft.canSave).toBe(false);
  });

  it("can save a new draft", () => {
    expect(describeNoteDraft("Generics are like arguments", "")).toEqual({
      length: 27,
      tooLong: false,
      unsaved: true,
      canSave: true,
    });
  });

  it("has nothing to save when the draft matches the saved Note", () => {
    const draft = describeNoteDraft("Same body", "Same body");
    expect(draft.unsaved).toBe(false);
    expect(draft.canSave).toBe(false);
  });

  it("ignores surrounding whitespace, as the server trims before saving", () => {
    const draft = describeNoteDraft("  Same body\n", "Same body");
    expect(draft.length).toBe(9);
    expect(draft.unsaved).toBe(false);
  });

  it("can save an edit to the saved Note", () => {
    const draft = describeNoteDraft("Same body, edited", "Same body");
    expect(draft.unsaved).toBe(true);
    expect(draft.canSave).toBe(true);
  });

  it("allows a draft of exactly the limit", () => {
    const draft = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH), "");
    expect(draft.tooLong).toBe(false);
    expect(draft.canSave).toBe(true);
  });

  it("refuses a draft one character over the limit", () => {
    const draft = describeNoteDraft("a".repeat(MAX_NOTE_LENGTH + 1), "");
    expect(draft.length).toBe(MAX_NOTE_LENGTH + 1);
    expect(draft.tooLong).toBe(true);
    expect(draft.unsaved).toBe(true);
    expect(draft.canSave).toBe(false);
  });
});

describe("describeNoteDraft, clearing a saved Note", () => {
  it("cannot save an empty draft over a saved Note", () => {
    const draft = describeNoteDraft("", "Saved body");
    expect(draft.unsaved).toBe(true);
    expect(draft.canSave).toBe(false);
  });
});
