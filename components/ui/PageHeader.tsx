export default function PageHeader({
  kicker,
  title,
  intro,
}: {
  kicker?: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="mb-8 max-w-prose">
      {kicker && (
        <p className="text-xs font-medium uppercase tracking-wide text-forest">{kicker}</p>
      )}
      <h1 className="mt-2 text-3xl leading-tight">{title}</h1>
      {intro && <p className="mt-3 text-lg leading-relaxed text-muted">{intro}</p>}
    </header>
  );
}
