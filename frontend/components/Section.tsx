// Page header block — eyebrow + serif title + description + optional action (export, etc.).
export function PageHeader({
  eyebrow, title, description, action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-2 text-4xl font-bold md:text-5xl">{title}</h1>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {description && (
        <p className="mt-4 max-w-2xl text-cream-200/70">{description}</p>
      )}
      <div className="mt-6 h-px w-16 bg-copper" />
    </div>
  );
}
