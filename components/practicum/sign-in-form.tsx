"use client";
import { useState } from "react";
import { demoSignIn } from "@/app/demo-sign-in/actions";
import { useDemoAction } from "./use-demo-action";
import { FormField } from "../ui/form-field";
import { Button } from "../ui/button";

export function DemoSignInForm() {
  const [state, action, pending] = useDemoAction(demoSignIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      action={action}
      onReset={(event) => event.preventDefault()}
      className="mt-6 max-w-md space-y-5"
    >
      <fieldset disabled={pending} className="space-y-5">
        <legend className="sr-only">Synthetic lab credentials</legend>
        <FormField
          id="demo-email"
          name="email"
          label="Demo email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={state.fieldErrors?.email?.[0]}
        />
        <FormField
          id="demo-password"
          name="password"
          label="Demo password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={state.fieldErrors?.password?.[0]}
        />
      </fieldset>
      <Button disabled={pending} type="submit">
        {pending ? "Signing in…" : "Sign in to demo"}
      </Button>
      <p role="status" aria-live="polite">
        {pending ? "Starting the demo session…" : state.message}
      </p>
    </form>
  );
}
