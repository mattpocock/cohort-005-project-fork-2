export const MAX_NOTE_LENGTH = 2000;

export type NoteDraft = {
  /** Characters that would be saved: the server trims before it counts. */
  length: number;
  tooLong: boolean;
  /** The draft differs from the saved Note (or there is no saved Note yet). */
  unsaved: boolean;
  canSave: boolean;
};

/** Where the Student's draft stands against the Note they last saved. */
export function describeNoteDraft(draft: string, savedBody: string): NoteDraft {
  const trimmed = draft.trim();
  const length = trimmed.length;
  const tooLong = length > MAX_NOTE_LENGTH;
  const unsaved = trimmed !== savedBody;
  return {
    length,
    tooLong,
    unsaved,
    canSave: unsaved && length > 0 && !tooLong,
  };
}
