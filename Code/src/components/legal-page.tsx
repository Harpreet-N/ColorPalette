/* oxlint-disable next/no-html-link-for-pages */
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

const pages = [
  ['/legal', 'Legal overview'],
  ['/imprint', 'Imprint'],
  ['/privacy', 'Privacy'],
  ['/storage', 'Storage & cookies'],
  ['/terms', 'Terms of use'],
  ['/accessibility', 'Accessibility'],
] as const;

export function LegalShell({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) {
  return (
    <main className="legal-shell">
      <header className="legal-topbar">
        <a className="wordmark" href="/"><span className="wordmark-name">ochre</span></a>
        <a className="legal-back" href="/"><ArrowLeft />Back to the app</a>
      </header>
      <div className="legal-layout">
        <aside className="legal-nav" aria-label="Legal pages">
          <p>Information</p>
          {pages.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
        </aside>
        <article className="legal-article">
          <header className="legal-heading"><p>{eyebrow}</p><h1>{title}</h1><div>{intro}</div><small>Draft last updated: 5 September 2026</small></header>
          <div className="legal-content">{children}</div>
        </article>
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h2>{title}</h2>{children}</section>;
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <span className="legal-placeholder">{children}</span>;
}
