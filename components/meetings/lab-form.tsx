"use client";
import { useActionState, useId } from "react";
import { unstable_rethrow } from "next/navigation";
import { saveMeetingCommand } from "@/app/meetings/actions";
import type { MeetingFormState } from "@/lib/meetings/schema";
import { Button } from "../ui/button";

type Field = {
  name: string;
  label: string;
  value?: string;
  type?: "text" | "number" | "textarea" | "checkbox";
  min?: number;
  max?: number;
};
export function LabForm({
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
            required: true,
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
                <textarea {...shared} rows={4} maxLength={field.max} />
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
        {pending ? "Saving the lab change…" : state.message}
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
    <LabForm
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
      ]}
    />
  );
}
