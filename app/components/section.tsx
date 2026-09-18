export default function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-20">
      <div className="mb-5 flex items-baseline justify-between gap-6 border-b border-line pb-2">
        <h2 className="font-mono text-[0.7rem] tracking-[0.14em] text-ink-dim uppercase">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
