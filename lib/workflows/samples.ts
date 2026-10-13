export interface TranscriptEntry {
  id: string;
  timestamp: string;
  kind: "Speech" | "Screen context";
  speaker?: string;
  text: string;
}
export const sampleTranscript: TranscriptEntry[] = [
  {
    id: "sample-1",
    timestamp: "00:04",
    kind: "Speech",
    speaker: "Alex",
    text: "Let's review the prototype before deciding what needs another pass.",
  },
  {
    id: "sample-2",
    timestamp: "00:08",
    kind: "Screen context",
    text: "Synthetic slide: review navigation, input errors, and small-screen layouts.",
  },
  {
    id: "sample-3",
    timestamp: "00:12",
    kind: "Speech",
    speaker: "Sam",
    text: "The navigation is ready, but we still need to check the upload error messages.",
  },
  {
    id: "sample-4",
    timestamp: "00:16",
    kind: "Speech",
    speaker: "Alex",
    text: "Let's schedule another review. We haven't assigned an owner or a date yet.",
  },
];
export const sampleAnalysis = [
  {
    title: "Summary",
    items: [
      "A synthetic design review covered navigation, upload validation, and responsive layouts.",
    ],
  },
  {
    title: "Insights",
    items: [
      "Navigation is ready for review; upload errors still need attention.",
    ],
  },
  {
    title: "Follow-ups",
    items: [
      "Review upload error messages.",
      "Assign an owner and date for the next review.",
    ],
  },
  {
    title: "Potential missed details",
    items: [
      "Missing owner: nobody was assigned the validation review.",
      "Unclear deadline: no date was agreed for the next review.",
      "Unresolved decision: approval of the small-screen layout is still open.",
    ],
  },
] as const;
