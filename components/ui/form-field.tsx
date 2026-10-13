import type { InputHTMLAttributes } from "react";

export function FormField({
  label,
  error,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
}) {
  return (
    <div>
      <label
        className="mb-2 block text-sm font-semibold text-slate-800"
        htmlFor={id}
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-950"
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-800">
          {error}
        </p>
      )}
    </div>
  );
}
