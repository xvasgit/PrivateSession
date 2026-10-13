"use client";

import { useRef } from "react";
import { Button } from "./ui/button";

export function SignInDialog() {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
        onClick={() => dialog.current?.showModal()}
      >
        Sign In
      </button>
      <dialog
        ref={dialog}
        aria-labelledby="sign-in-title"
        aria-describedby="sign-in-description"
        onClose={() => trigger.current?.focus()}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl backdrop:bg-slate-950/40"
      >
        <h2 id="sign-in-title" className="text-xl font-semibold">
          Accounts are upcoming
        </h2>
        <p id="sign-in-description" className="my-4 leading-7 text-slate-600">
          Sign in and saved work are not available yet. This preview does not
          create an account or save your setup, files, or sample results.
        </p>
        <Button type="button" onClick={() => dialog.current?.close()}>
          Close
        </Button>
      </dialog>
    </>
  );
}
