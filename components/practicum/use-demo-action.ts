"use client";
import { useActionState } from "react";
import { unstable_rethrow } from "next/navigation";
import type { DemoFormState } from "@/lib/practicum/schema";

export function useDemoAction(
  action: (previous: DemoFormState, data: FormData) => Promise<DemoFormState>,
) {
  return useActionState(
    async (previous: DemoFormState, data: FormData): Promise<DemoFormState> => {
      try {
        return await action(previous, data);
      } catch (error) {
        // Preserve Next's redirect control flow, but allow retry after a failed request.
        unstable_rethrow(error);
        return {
          message:
            "The request could not be completed. Your entries are still here; please retry.",
        };
      }
    },
    {},
  );
}
