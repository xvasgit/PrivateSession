export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="mb-8 max-w-2xl">
      <p className="mb-3 text-xs font-bold uppercase tracking-widest text-teal-800">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-4 leading-7 text-slate-600">{description}</p>
    </header>
  );
}
