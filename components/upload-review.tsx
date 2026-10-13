"use client";
import { useRef, useState, type ChangeEvent } from "react";
import {
  describeMediaFile,
  formatFileSize,
  mediaExtensions,
  validateMediaFile,
  type MediaSelection,
} from "@/lib/workflows/media";
import { sampleAnalysis } from "@/lib/workflows/samples";
import { SampleOutput } from "./sample-output";
import { EncryptionPreview } from "./encryption-preview";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function UploadReview() {
  const picker = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<MediaSelection | null>(null);
  const [error, setError] = useState<string>();
  const [sampleVisible, setSampleVisible] = useState(false);
  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const failure = validateMediaFile(file);
    setError(failure);
    setSelection(failure ? null : describeMediaFile(file));
    if (failure) event.target.value = "";
  }
  function remove() {
    setSelection(null);
    setError(undefined);
    if (picker.current) {
      picker.current.value = "";
      picker.current.focus();
    }
  }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="text-xl font-semibold">Select a past recording</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Choose one audio or video file. This preview only checks its name and
          size; file contents are not read or sent anywhere.
        </p>
        <div className="mt-6">
          <label
            htmlFor="recording-file"
            className="mb-3 block text-sm font-semibold"
          >
            Audio or video recording
          </label>
          <input
            ref={picker}
            id="recording-file"
            type="file"
            accept={mediaExtensions.join(",")}
            onChange={choose}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "file-help file-error" : "file-help"}
            className="w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-800 file:px-3 file:py-2 file:text-white"
          />
          <p id="file-help" className="mt-3 text-sm leading-6 text-slate-600">
            MP3, WAV, MP4, M4V, or MOV · Selection only, not an upload or a
            codec compatibility check.
          </p>
          {error && (
            <p
              id="file-error"
              role="alert"
              className="mt-3 text-sm text-red-800"
            >
              {error}
            </p>
          )}
        </div>
        {selection ? (
          <div className="mt-6 rounded-xl bg-teal-50 p-5 text-sm leading-6 text-teal-950">
            <p className="break-all font-semibold">{selection.name}</p>
            <p>
              {selection.category} · {formatFileSize(selection.size)}
            </p>
            <p role="status" className="mt-3">
              Selection ready — processing is in development. This file has not
              been uploaded or analyzed.
            </p>
            <Button type="button" className="mt-4" onClick={remove}>
              Remove file
            </Button>
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600">
            No recording selected.
          </p>
        )}
      </Card>
      <div className="space-y-4">
        <SampleOutput
          title="Analysis preview"
          description="This fixed synthetic design review is not based on your selected file. Potential gaps are review prompts, not verified facts."
          empty="No analysis yet. Try the sample to explore summaries, insights, and follow-ups."
        >
          {sampleVisible && (
            <div className="mt-5 space-y-5">
              <p role="status" className="text-sm font-semibold text-teal-800">
                Demo analysis · Synthetic content, unrelated to your file
              </p>
              {sampleAnalysis.map((section) => (
                <section key={section.title}>
                  <h3 className="font-semibold">{section.title}</h3>
                  <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </SampleOutput>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => setSampleVisible(true)}
            disabled={sampleVisible}
          >
            Try sample analysis
          </Button>
          {sampleVisible && (
            <Button type="button" onClick={() => setSampleVisible(false)}>
              Reset sample analysis
            </Button>
          )}
        </div>
        {sampleVisible && (
          <EncryptionPreview artifact={{ kind: "sample-review" }} />
        )}
      </div>
    </div>
  );
}
