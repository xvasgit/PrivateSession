"use client";
import { useState } from "react";
import { createDemoRequest } from "@/app/upload/practicum/actions";
import { meetingTypes } from "@/lib/practicum/schema";
import { useDemoAction } from "./use-demo-action";
import { Button } from "../ui/button";
import { FormField } from "../ui/form-field";

export function DemoRequestForm() {
  const [state, action, pending] = useDemoAction(createDemoRequest);
  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState("");
  const [context, setContext] = useState("");
  const [confirmation, setConfirmation] = useState(false);
  const errors = state.fieldErrors;
  return (
    <form
      action={action}
      onReset={(event) => event.preventDefault()}
      className="mt-6 max-w-2xl space-y-5"
    >
      <fieldset disabled={pending} className="space-y-5">
        <legend className="sr-only">Synthetic review request</legend>
        <FormField
          id="demo-title"
          name="title"
          label="Meeting title"
          required
          minLength={3}
          maxLength={80}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={errors?.title?.[0]}
        />
        <div>
          <label htmlFor="demo-type" className="mb-2 block font-semibold">
            Meeting type
          </label>
          <select
            id="demo-type"
            name="meetingType"
            required
            value={meetingType}
            onChange={(e) => setMeetingType(e.target.value)}
            aria-invalid={Boolean(errors?.meetingType)}
            aria-describedby={
              errors?.meetingType ? "demo-type-error" : undefined
            }
            className="w-full rounded-xl border border-slate-300 bg-white p-3"
          >
            <option value="">Choose a meeting type</option>
            {meetingTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
          {errors?.meetingType && (
            <p id="demo-type-error" className="mt-2 text-sm text-red-800">
              {errors.meetingType[0]}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="demo-context" className="mb-2 block font-semibold">
            Review context
          </label>
          <textarea
            id="demo-context"
            name="context"
            required
            minLength={10}
            maxLength={500}
            rows={4}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            aria-invalid={Boolean(errors?.context)}
            aria-describedby={
              errors?.context ? "demo-context-error" : undefined
            }
            className="w-full rounded-xl border border-slate-300 bg-white p-3"
          />
          {errors?.context && (
            <p id="demo-context-error" className="mt-2 text-sm text-red-800">
              {errors.context[0]}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="demo-confirmation"
            className="flex items-start gap-3 text-sm leading-6"
          >
            <input
              id="demo-confirmation"
              name="confirmation"
              type="checkbox"
              required
              checked={confirmation}
              onChange={(e) => setConfirmation(e.target.checked)}
              aria-invalid={Boolean(errors?.confirmation)}
              aria-describedby="demo-confirmation-help demo-confirmation-error"
              className="mt-1 size-4 shrink-0"
            />
            I confirm this is synthetic information and may be stored
            temporarily on this demo server.
          </label>
          <p
            id="demo-confirmation-help"
            className="mt-2 text-sm text-slate-600"
          >
            This is not proof of participant consent. No recording is needed or
            processed.
          </p>
          <p id="demo-confirmation-error" className="mt-2 text-sm text-red-800">
            {errors?.confirmation?.[0]}
          </p>
        </div>
      </fieldset>
      <Button disabled={pending} type="submit">
        {pending ? "Creating demo request…" : "Create demo request"}
      </Button>
      <p role="status" aria-live="polite">
        {pending ? "Creating a temporary metadata record…" : state.message}
      </p>
    </form>
  );
}
