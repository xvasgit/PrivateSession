"use client";
import { useState, type FormEvent } from "react";
import { FormField } from "../ui/form-field";
import { Button } from "../ui/button";
import {
  signInSchema,
  changePasswordSchema,
  type AccountFormState,
} from "@/lib/auth/schemas";
import { z } from "zod";

export function CredentialForm({ change = false }: { change?: boolean }) {
  const [state, setState] = useState<AccountFormState>({});
  const [pending, setPending] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const parsed = (change ? changePasswordSchema : signInSchema).safeParse(
      Object.fromEntries(new FormData(form)),
    );
    if (!parsed.success) {
      setState({
        fieldErrors: z.flattenError(parsed.error as z.ZodError).fieldErrors,
        message: "Check the fields.",
      });
      return;
    }
    setPending(true);
    setState({});
    try {
      const response = await fetch(
        `/api/auth/${change ? "change-password" : "sign-in/email"}/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        setState({
          fieldErrors: result.fieldErrors,
          message:
            response.status === 429
              ? "Too many attempts. Wait a moment and retry."
              : result.message || "Authentication failed. Please retry.",
        });
        return;
      }
      form.reset();
      window.location.assign(
        change ? "/sign-in/?password=changed" : "/meetings/",
      );
    } catch {
      setState({ message: "Could not reach the server. Please retry." });
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="mt-6 max-w-md space-y-5">
      <fieldset disabled={pending} className="space-y-5">
        <legend className="sr-only">
          {change ? "Change password" : "Sign in"}
        </legend>
        {(change
          ? ["currentPassword", "newPassword", "confirmation"]
          : ["email", "password"]
        ).map((name) => (
          <FormField
            key={name}
            id={`auth-${name}`}
            name={name}
            label={
              (
                {
                  email: "Email",
                  password: "Password",
                  currentPassword: "Current password",
                  newPassword: "New password",
                  confirmation: "Confirm new password",
                } as Record<string, string>
              )[name]
            }
            type={name === "email" ? "email" : "password"}
            autoComplete={
              name === "email"
                ? "username"
                : ["password", "currentPassword"].includes(name)
                  ? "current-password"
                  : "new-password"
            }
            required
            minLength={name === "email" ? undefined : 12}
            maxLength={name === "email" ? 254 : 128}
            error={state.fieldErrors?.[name]?.[0]}
          />
        ))}
      </fieldset>
      <Button disabled={pending} type="submit">
        {pending ? "Please wait…" : change ? "Change password" : "Sign in"}
      </Button>
      <p role="status" aria-live="polite">
        {pending ? "Checking credentials…" : state.message}
      </p>
    </form>
  );
}

export function SignOutButton() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <div>
      <Button
        disabled={pending}
        type="button"
        onClick={async () => {
          setPending(true);
          try {
            const response = await fetch("/api/auth/sign-out/", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: "{}",
            });
            if (!response.ok) throw new Error();
            // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- Discard private client state at the authentication boundary.
            window.location.assign("/");
          } catch {
            setMessage("Could not sign out. Please retry.");
            setPending(false);
          }
        }}
      >
        {pending ? "Signing out…" : "Sign out"}
      </Button>
      {message && <span role="status">{message}</span>}
    </div>
  );
}
