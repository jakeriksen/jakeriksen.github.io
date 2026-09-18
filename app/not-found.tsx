import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-16">
      <p className="font-mono text-[0.7rem] tracking-[0.14em] text-accent uppercase">
        404
      </p>
      <h1 className="font-display mt-5 text-4xl tracking-tight">
        Nothing here.
      </h1>
      <p className="mt-5 text-ink-dim">
        The page moved, or never existed.{" "}
        <Link href="/" className="text-ink underline underline-offset-4">
          Back to the start
        </Link>
        .
      </p>
    </section>
  );
}
