import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { ThemeLandscape } from "./theme-landscape";
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
        <nav className="event-breadcrumb">
          <Link href="/">Watchtower</Link>
          <Link href="/spirit-lens">Spirit Lens</Link>
          <Link href="/analysis">Signal Observatory</Link>
          <Link href="/dojo">Honor journal</Link>
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
