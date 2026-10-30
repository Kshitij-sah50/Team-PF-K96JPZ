import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { ThemeLandscape } from "./theme-landscape";
import { NavigationLink } from "./navigation-hint";
import "~/app/spirit-lens.css";
import "~/app/bonuses.css";
export function BonusShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="watchtower lens-page">
      <div className="lens-shell">
        <header className="watch-topbar">
          <Link className="event-brand" href="/">
            TSUKUYOMI WATCH
          </Link>
          <ThemeToggle />
        </header>
        <nav className="event-breadcrumb" aria-label="Feature navigation">
          <NavigationLink section="watchtower" href="/">
            Watchtower
          </NavigationLink>
          <NavigationLink section="scroll" href="/#celestial-scroll">
            Celestial Scroll
          </NavigationLink>
          <NavigationLink section="lens" href="/spirit-lens">
            Spirit Lens
          </NavigationLink>
          <NavigationLink section="signals" href="/analysis">
            Signal Observatory
          </NavigationLink>
          <NavigationLink section="honor" href="/dojo">
            Honor journal
          </NavigationLink>
        </nav>
        <main className="bonus-main">
          <ThemeLandscape />
          <p className="watch-eyebrow">THE BONUS SCROLL</p>
          <h1>{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
