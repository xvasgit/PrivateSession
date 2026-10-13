"use client";
import { useEffect, useState } from "react";
import { sampleTranscript } from "@/lib/workflows/samples";
import { SampleOutput } from "./sample-output";
import { Button } from "./ui/button";

type DemoState = "idle" | "playing" | "paused" | "stopped";
export function TranscriptPreview() {
  const [state, setState] = useState<DemoState>("idle");
  const [visible, setVisible] = useState(0);
  useEffect(() => {
    if (state !== "playing") return;
    const interval = window.setInterval(
      () => setVisible((count) => Math.min(count + 1, sampleTranscript.length)),
      1500,
    );
    return () => window.clearInterval(interval);
  }, [state]);
  return (
    <div className="space-y-4">
      <SampleOutput
        title="Transcript preview"
        description="A fixed synthetic conversation with timestamped speech and screen context. It is independent of your setup and is not captured from your device."
        empty="No transcript yet. Try the sample to explore how the planned output could look."
      >
        {state !== "idle" && (
          <div className="mt-5">
            <p role="status" className="text-sm font-semibold text-teal-800">
              Demo {state === "playing" ? "playing" : state} · No recording
            </p>
            <ol aria-label="Synthetic transcript" className="mt-4 space-y-3">
              {sampleTranscript.slice(0, visible).map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <p className="text-xs font-semibold text-slate-600">
                    {entry.timestamp} · {entry.kind}
                    {entry.speaker ? ` · ${entry.speaker}` : ""}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-800">
                    {entry.text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </SampleOutput>
      <div className="flex flex-wrap gap-3">
        {state === "idle" && (
          <Button
            type="button"
            onClick={() => {
              setVisible(1);
              setState("playing");
            }}
          >
            Try sample transcript
          </Button>
        )}
        {state === "playing" && (
          <Button type="button" onClick={() => setState("paused")}>
            Pause demo
          </Button>
        )}
        {state === "paused" && (
          <Button type="button" onClick={() => setState("playing")}>
            Resume demo
          </Button>
        )}
        {(state === "playing" || state === "paused") && (
          <Button type="button" onClick={() => setState("stopped")}>
            Stop demo
          </Button>
        )}
        {state !== "idle" && (
          <Button
            type="button"
            onClick={() => {
              setState("idle");
              setVisible(0);
            }}
          >
            Reset demo
          </Button>
        )}
      </div>
    </div>
  );
}
