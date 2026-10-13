"use client";
import { useState, type FormEvent } from "react";
import {
  defaultSources,
  sourceLabels,
  validateLiveSetup,
  type CaptureMode,
  type CaptureSources,
  type LiveErrors,
  type LiveSetup,
} from "@/lib/workflows/live";
import { CaptureSourceSelector } from "./capture-source-selector";
import { EncryptionPreview } from "./encryption-preview";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { FormField } from "./ui/form-field";

const initial: LiveSetup = {
  mode: "online",
  title: "",
  context: "",
  consent: false,
  ...defaultSources("online"),
};

export function LiveSetupForm() {
  const [input, setInput] = useState(initial);
  const [errors, setErrors] = useState<LiveErrors>({});
  const [prepared, setPrepared] = useState<LiveSetup | null>(null);
  const [preparation, setPreparation] = useState(0);
  function update(changes: Partial<LiveSetup>) {
    setInput((current) => ({ ...current, ...changes }));
    setPrepared(null);
    setErrors({});
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateLiveSetup(input);
    setPreparation((current) => current + 1);
    setErrors(validation);
    setPrepared(
      Object.keys(validation).length
        ? null
        : { ...input, title: input.title.trim() },
    );
  }
  return (
    <Card>
      <h2 className="text-xl font-semibold">Prepare your capture setup</h2>
      <p className="mb-6 mt-2 text-sm leading-6 text-slate-600">
        Choose what you would capture. Nothing is recorded or saved in this UI
        preview.
      </p>
      <form onSubmit={submit} noValidate className="space-y-6">
        <fieldset>
          <legend className="mb-3 text-sm font-semibold text-slate-800">
            Meeting mode
          </legend>
          <div className="flex flex-wrap gap-4">
            {(["online", "recording"] as CaptureMode[]).map((mode) => (
              <label key={mode} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  value={mode}
                  checked={input.mode === mode}
                  onChange={() => update({ mode, ...defaultSources(mode) })}
                />
                {mode === "online" ? "Online Meeting" : "Live Recording"}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-600">
            Switching modes restores that mode’s default sources.
          </p>
        </fieldset>
        <FormField
          id="meeting-title"
          label="Meeting title"
          value={input.title}
          maxLength={80}
          required
          error={errors.title}
          onChange={(event) => update({ title: event.target.value })}
        />
        <div>
          <label
            htmlFor="meeting-context"
            className="mb-2 block text-sm font-semibold"
          >
            Context (optional)
          </label>
          <textarea
            id="meeting-context"
            value={input.context}
            maxLength={500}
            onChange={(event) => update({ context: event.target.value })}
            className="min-h-28 w-full rounded-xl border border-slate-300 p-3"
            aria-invalid={Boolean(errors.context)}
            aria-describedby={
              errors.context ? "context-help context-error" : "context-help"
            }
          />
          <p id="context-help" className="mt-2 text-xs text-slate-600">
            Up to 500 characters. Use synthetic details for this preview.
          </p>
          {errors.context && (
            <p id="context-error" className="mt-2 text-sm text-red-800">
              {errors.context}
            </p>
          )}
        </div>
        <CaptureSourceSelector
          mode={input.mode}
          sources={input}
          error={errors.capture}
          onChange={(source: keyof CaptureSources, enabled) =>
            update({ [source]: enabled })
          }
        />
        <div>
          <label className="flex items-start gap-3 text-sm leading-6 text-slate-800">
            <input
              type="checkbox"
              className="mt-1 shrink-0"
              checked={input.consent}
              onChange={(event) => update({ consent: event.target.checked })}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? "consent-error" : undefined}
            />
            I confirm participant consent and understand this preview does not
            record.
          </label>
          {errors.consent && (
            <p id="consent-error" className="mt-2 text-sm text-red-800">
              {errors.consent}
            </p>
          )}
        </div>
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-sm text-red-800">
            Please correct the highlighted fields.
          </p>
        )}
        <Button type="submit">Prepare setup</Button>
        {prepared && (
          <div
            role="status"
            className="rounded-xl bg-teal-50 p-5 text-sm leading-6 text-teal-950"
          >
            <h3 className="font-semibold">
              Setup prepared — capture is not available yet
            </h3>
            <p className="mt-2 break-words">
              {prepared.title} ·{" "}
              {prepared.mode === "online" ? "Online Meeting" : "Live Recording"}
            </p>
            <p>
              Sources:{" "}
              {(Object.keys(sourceLabels) as (keyof CaptureSources)[])
                .filter((source) => prepared[source])
                .map((source) => sourceLabels[source])
                .join(", ")}
            </p>
            {prepared.context && (
              <p className="mt-2 whitespace-pre-wrap break-words">
                Context: {prepared.context}
              </p>
            )}
            <p className="mt-2">
              These preferences remain only in this page’s memory. They are not
              saved and do not start a recording.
            </p>
          </div>
        )}
      </form>
      {prepared && (
        <EncryptionPreview
          key={preparation}
          artifact={{ kind: "live-draft", data: prepared }}
        />
      )}
    </Card>
  );
}
