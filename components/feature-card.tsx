import Link from "next/link";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";

export function FeatureCard({
  title,
  status,
  description,
  steps,
  href,
}: {
  title: string;
  status: "In progress" | "Upcoming";
  description: string;
  steps: string[];
  href?: string;
}) {
  return (
    <Card className="flex h-full flex-col">
      <Badge tone={status === "Upcoming" ? "neutral" : "teal"}>{status}</Badge>
      <h2 className="mt-5 text-xl font-semibold text-slate-950">{title}</h2>
      <p className="mt-3 leading-7 text-slate-600">{description}</p>
      <h3 className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-600">
        How it works
      </h3>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-slate-700">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {href && (
        <Link
          href={href}
          className="mt-6 self-start font-semibold text-teal-800 underline underline-offset-4"
        >
          Explore {title.toLowerCase()} →
        </Link>
      )}
    </Card>
  );
}
