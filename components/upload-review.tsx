"use client";
import Link from "next/link";
import {
  startTransition,
  useActionState,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { validateRecordingMetadata } from "@/app/upload/actions";
import {
  describeMediaFile,
  formatFileSize,
  mediaExtensions,
  validateMediaFile,
  type MediaSelection,
  type MediaValidationState,
} from "@/lib/workflows/media";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

export function UploadReview() {
  const picker = useRef<HTMLInputElement>(null);
  const [selection, setSelection] = useState<MediaSelection | null>(null);
  const [error, setError] = useState<string>();
  const [revision, setRevision] = useState(0);
  const busy = useRef(false);
  const [validation, dispatch, pending] = useActionState(
    async (
      _previous: { revision: number; result: MediaValidationState },
      request: { revision: number; selection: MediaSelection },
    ) => {
      try {
        // Never construct FormData from the form/file input. Only these two strings leave the browser.
        const data = new FormData();
        data.set("name", request.selection.name);
        data.set("size", String(request.selection.size));
        return {
          revision: request.revision,
          result: await validateRecordingMetadata(data),
        };
      } catch {
        return {
          revision: request.revision,
          result: {
            status: "error",
            message: "Could not validate this selection. Please try again.",
          } as MediaValidationState,
        };
      } finally {
        busy.current = false;
      }
    },
    { revision: -1, result: { status: "idle" } },
  );
  const result =
    validation.revision === revision && !pending ? validation.result : null;
  const serverErrors =
    result?.status === "error" ? result.fieldErrors : undefined;
  const fieldError =
    error || serverErrors?.name?.[0] || serverErrors?.size?.[0];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selection || busy.current) return;
    const failure = validateMediaFile(selection);
    if (failure) {
      setError(failure);
      return;
    }
    busy.current = true;
    startTransition(() => dispatch({ revision, selection }));
  }
  function choose(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setRevision((current) => current + 1);
    const failure = validateMediaFile(file);
    setError(failure);
    setSelection(failure ? null : describeMediaFile(file));
    if (failure) event.target.value = "";
  }
  function remove() {
    setRevision((current) => current + 1);
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
          Choose one audio or video file. Selecting it checks its name and size
          on your device. Validate selection sends only the filename and byte
          count to this app’s server; file contents are never read or sent.
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
            aria-invalid={Boolean(fieldError)}
            aria-describedby={fieldError ? "file-help file-error" : "file-help"}
            className="w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-teal-800 file:px-3 file:py-2 file:text-white"
          />
          <p id="file-help" className="mt-3 text-sm leading-6 text-slate-600">
            MP3, WAV, MP4, M4V, or MOV · Selection only, not an upload or a
            codec compatibility check.
          </p>
          {fieldError && (
            <p
              id="file-error"
              role="alert"
              className="mt-3 text-sm text-red-800"
            >
              {fieldError}
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
        <form onSubmit={submit} noValidate className="mt-5">
          <Button type="submit" disabled={!selection || pending}>
            {pending ? "Validating…" : "Validate selection"}
          </Button>
          {pending && (
            <p role="status" className="mt-3 text-sm text-slate-600">
              Validating submitted metadata. Changing or removing the selection
              discards its result.
            </p>
          )}
          {result?.status === "success" && (
            <p role="status" className="mt-3 text-sm leading-6 text-teal-800">
              Selection validated — processing is still in development. Your
              recording has not been uploaded or analyzed.
            </p>
          )}
          {result?.status === "error" && (
            <p role="alert" className="mt-3 text-sm text-red-800">
              {result.message}
            </p>
          )}
          <p className="mt-3 text-xs leading-5 text-slate-600">
            Metadata validation cannot verify file authenticity, actual
            contents, or codec compatibility. Nothing is saved.
          </p>
        </form>
      </Card>
      <Card>
        <h2 className="text-xl font-semibold">Already have a transcript?</h2>
        <p className="my-4 leading-7 text-slate-600">
          Create a meeting, paste your transcript, and save your own summary,
          insights, and follow-ups. This workflow is independent of the selected
          recording.
        </p>
        <Link
          href="/meetings/new/"
          className="inline-block rounded-xl bg-teal-800 px-4 py-3 font-semibold text-white"
        >
          Enter a transcript manually
        </Link>
        <p className="mt-4 text-sm text-slate-600">
          Local sign-in is required. File selection does not create a meeting or
          attach a recording.
        </p>
      </Card>
    </div>
  );
}
