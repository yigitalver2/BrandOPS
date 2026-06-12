// Sayfa başlığı bloğu — eyebrow + serif başlık + açıklama.
export function PageHeader({
  eyebrow, title, description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-10">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 text-4xl font-bold md:text-5xl">{title}</h1>
      {description && (
        <p className="mt-4 max-w-2xl text-cream-200/70">{description}</p>
      )}
      <div className="mt-6 h-px w-16 bg-copper" />
    </div>
  );
}
