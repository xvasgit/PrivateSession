import {
  sourceLabels,
  type CaptureMode,
  type CaptureSources,
} from "@/lib/workflows/live";

export function CaptureSourceSelector({
  mode,
  sources,
  error,
  onChange,
}: {
  mode: CaptureMode;
  sources: CaptureSources;
  error?: string;
  onChange: (source: keyof CaptureSources, enabled: boolean) => void;
}) {
  return (
    <fieldset
      aria-describedby={error ? "capture-help capture-error" : "capture-help"}
    >
      <legend className="mb-3 text-sm font-semibold text-slate-800">
        Capture sources
      </legend>
      <div className="space-y-3">
        {(Object.keys(sourceLabels) as (keyof CaptureSources)[]).map(
          (source) => (
            <label
              key={source}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-800"
            >
              <input
                type="checkbox"
                checked={sources[source]}
                disabled={mode === "recording" && source !== "screen"}
                onChange={(event) => onChange(source, event.target.checked)}
              />
              <span>
                {sourceLabels[source]}
                {mode === "recording" && source === "microphone" && (
                  <span className="ml-2 text-xs text-slate-600">Required</span>
                )}
                {mode === "recording" && source === "systemAudio" && (
                  <span className="ml-2 text-xs text-slate-600">
                    Unavailable in this mode
                  </span>
                )}
              </span>
            </label>
          ),
        )}
      </div>
      <p id="capture-help" className="mt-3 text-sm leading-6 text-slate-600">
        {mode === "online"
          ? "Keep at least one audio source enabled. Screen snapshots add visual context."
          : "Recordings use microphone audio, with optional screen context."}{" "}
        These are preferences only; no device access is requested.
      </p>
      {error && (
        <p id="capture-error" className="mt-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </fieldset>
  );
}
