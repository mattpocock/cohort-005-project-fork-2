import { MAX_NOTE_LENGTH } from "~/lib/notes";

export type NoteDraft = {
  length: number;
  limit: number;
  tooLong: boolean;
  empty: boolean;
  unsaved: boolean;
  canSave: boolean;
};

export function describeDraft(
  draft: string,
  savedBody: string | null
): NoteDraft {
  // The server trims before it stores and measures, so judge the text it will keep.
  const kept = draft.trim();
  const tooLong = kept.length > MAX_NOTE_LENGTH;
  const empty = kept.length === 0;
  const unsaved = kept !== (savedBody ?? "");

  return {
    length: kept.length,
    limit: MAX_NOTE_LENGTH,
    tooLong,
    empty,
    unsaved,
    canSave: unsaved && !empty && !tooLong,
  };
}
