"use client";

import { useId, useState } from "react";
import { FormField } from "./ui/form-field";

export function ReviewNote({ label }: { label: string }) {
  const id = useId();
  const [note, setNote] = useState("");

  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm">
      <FormField
        id={id}
        label={label}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        maxLength={500}
        autoComplete="off"
      />
    </div>
  );
}
