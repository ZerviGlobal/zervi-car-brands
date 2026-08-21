import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 font-bold text-foreground">
              <span className="text-accent">●</span>
              Zervi Car Brands
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              A reverse-engineered clone of carlogos.org — the car logo &amp; brand
              encyclopedia. Hosted as a support resource for Zervi Group projects.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Explore</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li><Link className="hover:text-foreground" href="/car-brands/">Car Brands</Link></li>
              <li><Link className="hover:text-foreground" href="/tire-brands/">Tire Brands</Link></li>
              <li><Link className="hover:text-foreground" href="/motorcycle-brands/">Motorcycle</Link></li>
              <li><Link className="hover:text-foreground" href="/reviews/">Reviews</Link></li>
              <li><Link className="hover:text-foreground" href="/quizzes/">Quizzes</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Source</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li>
                <a className="hover:text-foreground" href="https://www.carlogos.org/" target="_blank" rel="noopener noreferrer">
                  Original site ↗
                </a>
              </li>
              <li>
                <a className="hover:text-foreground" href="https://github.com/ZerviGlobal/zervi-car-brands" target="_blank" rel="noopener noreferrer">
                  GitHub repo ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>
            Built on the AI Website Cloner Template. Cloned content from carlogos.org
            is for internal Zervi support use. {new Date().getFullYear()}.
          </p>
        </div>
      </div>
    </footer>
  );
}
