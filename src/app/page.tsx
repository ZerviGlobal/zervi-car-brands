import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-16 text-center">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
          Zervi Car Brands
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          A reverse-engineered clone of{" "}
          <a
            href="https://www.carlogos.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-4 hover:opacity-80"
          >
            carlogos.org
          </a>{" "}
          — the car logo &amp; brand encyclopedia. Hosted on ZBOX as a support
          resource for all Zervi Group projects.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 text-left shadow-sm">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Status
        </h2>
        <p className="text-sm text-foreground">
          Scaffold ready. The live carlogos.org content has not been cloned yet.
          Run the{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            /clone-website https://www.carlogos.org/
          </code>{" "}
          skill from a Chrome-MCP-equipped agent session to populate this site.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
        <Link
          href="https://github.com/ZerviGlobal/zervi-car-brands"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-4 py-2 transition-colors hover:bg-muted"
        >
          GitHub repo
        </Link>
        <a
          href="https://www.carlogos.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-4 py-2 transition-colors hover:bg-muted"
        >
          Source site
        </a>
      </div>
    </main>
  );
}
