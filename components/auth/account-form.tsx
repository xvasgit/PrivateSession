"use client";
import { useActionState, useState } from "react";
import { accountCommand } from "@/app/account/actions";
import { FormField } from "../ui/form-field";
import { Button } from "../ui/button";

export function AccountForm({
  operation,
  name,
  userId,
  status,
}: {
  operation: "profile" | "createMember" | "status";
  name?: string;
  userId?: string;
  status?: string;
}) {
  const [values, setValues] = useState({
    name: name ?? "",
    email: "",
    password: "",
  });
  const [state, action, pending] = useActionState(
    async (
      previous: import("@/lib/auth/schemas").AccountFormState,
      data: FormData,
    ) => {
      try {
        const result = await accountCommand(previous, data);
        if (result.success && operation === "createMember")
          setValues({ name: "", email: "", password: "" });
        return result;
      } catch {
        return { message: "Could not reach the server. Please retry." };
      }
    },
    {},
  );
  return (
    <form
      action={action}
      onReset={(event) => event.preventDefault()}
      className="my-5 max-w-md space-y-4"
      aria-label={operation}
    >
      <input type="hidden" name="operation" value={operation} />
      <fieldset disabled={pending} className="space-y-4">
        <legend className="sr-only">{operation}</legend>
        {operation === "status" ? (
          <>
            <input type="hidden" name="userId" value={userId} />
            <input
              type="hidden"
              name="status"
              value={status === "ACTIVE" ? "DISABLED" : "ACTIVE"}
            />
          </>
        ) : (
          <FormField
            id={`${operation}-name`}
            name="name"
            label="Display name"
            required
            minLength={2}
            maxLength={80}
            value={values.name}
            onChange={(event) =>
              setValues({ ...values, name: event.target.value })
            }
            error={state.fieldErrors?.name?.[0]}
          />
        )}
        {operation === "createMember" && (
          <>
            <FormField
              id="member-email"
              name="email"
              value={values.email}
              onChange={(event) =>
                setValues({ ...values, email: event.target.value })
              }
              label="Member email"
              type="email"
              required
              maxLength={254}
              autoComplete="off"
              error={state.fieldErrors?.email?.[0]}
            />
            <FormField
              id="member-password"
              name="password"
              value={values.password}
              onChange={(event) =>
                setValues({ ...values, password: event.target.value })
              }
              label="Initial password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              error={state.fieldErrors?.password?.[0]}
            />
          </>
        )}
      </fieldset>
      <Button disabled={pending} type="submit">
        {pending
          ? "Saving…"
          : operation === "profile"
            ? "Save profile"
            : operation === "createMember"
              ? "Create member"
              : status === "ACTIVE"
                ? "Deactivate member"
                : "Activate member"}
      </Button>
      <p role="status" aria-live="polite">
        {pending ? "Saving changes…" : state.message}
      </p>
    </form>
  );
}
