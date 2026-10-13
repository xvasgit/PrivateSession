import type { ReactNode } from "react";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

export function SampleOutput({
  title,
  description,
  empty,
  children,
}: {
  title: string;
  description: string;
  empty: string;
  children?: ReactNode;
}) {
  return (
    <Card>
      <Badge tone="neutral">Synthetic preview</Badge>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      {children || (
        <p className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm leading-6 text-slate-600">
          {empty}
        </p>
      )}
    </Card>
  );
}
