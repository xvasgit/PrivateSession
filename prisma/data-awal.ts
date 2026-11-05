export const seedMeetings = [
  {
    sessionCode: "LAB-M06-LECTURE",
    title: "Synthetic database lecture",
    segments: [
      {
        sequence: 1,
        content: "Synthetic opening: discuss database relationships.",
      },
      {
        sequence: 2,
        content: "Synthetic follow-up: verify transaction rollback. Catatan 🔐",
      },
    ],
  },
  {
    sessionCode: "LAB-M06-REVIEW",
    title: "Synthetic prototype review",
    segments: [
      {
        sequence: 1,
        content: "Synthetic review: no real meeting was recorded.",
      },
    ],
  },
] as const;
