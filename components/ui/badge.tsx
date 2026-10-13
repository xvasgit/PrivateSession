import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "teal",
}: {
  children: ReactNode;
  tone?: "teal" | "neutral";
}) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${tone === "teal" ? "bg-teal-50 text-teal-900" : "bg-slate-100 text-slate-700"}`}
    >
      {children}
    </span>
  );
}
