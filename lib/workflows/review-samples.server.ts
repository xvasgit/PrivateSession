import "server-only";
import { sampleAnalysis } from "./samples";

export interface ReviewSample {
  id: number;
  title: string;
  sections: readonly { title: string; items: readonly string[] }[];
}

export const reviewSamples: readonly ReviewSample[] = [
  { id: 1, title: "Prototype design review", sections: sampleAnalysis },
  {
    id: 2,
    title: "Study planning review",
    sections: [
      {
        title: "Summary",
        items: [
          "A synthetic study group discussed preparing a practice presentation and reviewing its examples.",
        ],
      },
      {
        title: "Insights",
        items: [
          "The group needs a shorter explanation before rehearsing together.",
        ],
      },
      {
        title: "Follow-ups",
        items: [
          "Prepare a concise outline.",
          "Choose examples for the next rehearsal.",
        ],
      },
      {
        title: "Potential missed details",
        items: [
          "No owner was assigned to the outline.",
          "The next rehearsal time was not agreed.",
        ],
      },
    ],
  },
];

export function findReviewSample(id: number): ReviewSample | undefined {
  return reviewSamples.find((sample) => sample.id === id);
}
