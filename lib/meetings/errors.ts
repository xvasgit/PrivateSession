import type { MeetingFormState } from "./schema";

export function meetingError(
  error: unknown,
  operation: string,
): MeetingFormState {
  const code =
    error && typeof error === "object" && "code" in error
      ? error.code
      : undefined;
  if (code === "P2002") {
    const field = operation.includes("Meeting") ? "sessionCode" : "sequence";
    return {
      message: "This value is already in use.",
      fieldErrors: {
        [field]: [
          field === "sessionCode"
            ? "Session code already exists in your library (case-sensitive)."
            : "Sequence already exists in this session.",
        ],
      },
    };
  }
  if (code === "P2003")
    return {
      message:
        "The relationship prevents this change. Delete segments first, or explicitly confirm deletion of the session and all segments.",
    };
  if (code === "P2025" || code === "ACCESS_DENIED")
    return {
      message:
        "This record is no longer available. Return to the meeting list and refresh.",
    };
  return {
    message:
      "The meeting could not be changed. Check local database/key configuration and retry.",
  };
}
