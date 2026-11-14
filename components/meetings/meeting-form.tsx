"use client";
import { useActionState, useId, useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { saveMeetingCommand } from "@/app/meetings/actions";
import type { MeetingFormState } from "@/lib/meetings/schema";
import { Button } from "../ui/button";

type Field = {
  name: string;
  label: string;
  value?: string;
  type?: "text" | "number" | "textarea" | "checkbox" | "select";
  min?: number;
  max?: number;
  optional?: boolean;
  options?: { label: string; value: string }[];
};

function TextareaField({
  field,
  shared,
}: {
  field: Field;
  shared: {
    id: string;
    name: string;
    required: boolean;
    defaultValue?: string;
    "aria-invalid": boolean;
    "aria-describedby"?: string;
    className: string;
  };
}) {
  const [text, setText] = useState(field.value ?? "");
  const remaining = field.max !== undefined ? field.max - text.length : null;
  return (
    <>
      <textarea
        {...shared}
        defaultValue={undefined}
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        maxLength={field.max}
      />
      {remaining !== null && (
        <p className="mt-1 text-sm text-slate-600">
          {remaining} characters remaining
        </p>
      )}
    </>
  );
}

export function MeetingActionForm({
  operation,
  hidden = {},
  fields = [],
  submit,
}: {
  operation: string;
  hidden?: Record<string, number>;
  fields?: Field[];
  submit: string;
}) {
  const prefix = useId();
  const [state, action, pending] = useActionState(
    async (
      previous: MeetingFormState,
      data: FormData,
    ): Promise<MeetingFormState> => {
      try {
        return await saveMeetingCommand(previous, data);
      } catch (error) {
        unstable_rethrow(error);
        if (error && typeof error === "object" && "digest" in error) {
          throw error;
        }
        return {
          message:
            "The request could not be completed. Your entries are still here; please retry.",
        };
      }
    },
    {},
  );
  return (
    <form
      aria-label={submit}
      action={action}
      onReset={(event) => event.preventDefault()}
      className="my-5 max-w-2xl space-y-4"
    >
      <input type="hidden" name="operation" value={operation} />
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <fieldset disabled={pending} className="space-y-4">
        <legend className="sr-only">{submit}</legend>
        {fields.map((field) => {
          const id = `${prefix}-${field.name}`;
          const error = state.fieldErrors?.[field.name]?.[0];
          const shared = {
            id,
            name: field.name,
            required: !field.optional,
            defaultValue: field.value,
            "aria-invalid": Boolean(error),
            "aria-describedby": error ? `${id}-error` : undefined,
            className: "w-full rounded-xl border border-slate-300 bg-white p-3",
          };
          return (
            <div key={field.name}>
              <label htmlFor={id} className="mb-2 block font-semibold">
                {field.label}
              </label>
              {field.type === "textarea" ? (
                <TextareaField field={field} shared={shared} />
              ) : field.type === "select" ? (
                <select {...shared}>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === "checkbox" ? (
                <input
                  {...shared}
                  type="checkbox"
                  defaultValue="on"
                  className="size-5"
                />
              ) : (
                <input
                  {...shared}
                  type={field.type ?? "text"}
                  min={field.type === "number" ? field.min : undefined}
                  max={field.type === "number" ? field.max : undefined}
                  step={field.type === "number" ? 1 : undefined}
                  minLength={field.type !== "number" ? field.min : undefined}
                  maxLength={field.type !== "number" ? field.max : undefined}
                />
              )}
              {error && (
                <p id={`${id}-error`} className="mt-2 text-red-800">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </fieldset>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submit}
      </Button>
      <p role="status" aria-live="polite">
        {pending ? "Saving your changes…" : state.message}
      </p>
    </form>
  );
}

export function MeetingForm({
  record,
}: {
  record?: { id: number; sessionCode: string; title: string };
}) {
  return (
    <MeetingActionForm
      operation={record ? "updateMeeting" : "createMeeting"}
      hidden={record ? { id: record.id } : {}}
      submit={record ? "Save meeting" : "Create meeting"}
      fields={[
        {
          name: "sessionCode",
          label: "Session code",
          value: record?.sessionCode,
          min: 1,
          max: 64,
        },
        {
          name: "title",
          label: "Meeting title",
          value: record?.title,
          min: 3,
          max: 80,
        },
        ...(record
          ? [
              {
                name: "returnToDetail",
                label: "After saving",
                type: "select" as const,
                value: "true",
                options: [
                  { label: "Return to meeting detail", value: "true" },
                  { label: "Stay on edit page", value: "false" },
                ],
              },
            ]
          : []),
      ]}
    />
  );
}
