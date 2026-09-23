/* oxlint-disable next/no-html-link-for-pages */
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Ochre — colour, taken from the ground',
  description:
    'Photograph a place and read the colour it is made of. Every reading stays on your own device.',
  appleWebApp: { capable: true, title: 'Ochre', statusBarStyle: 'default' },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  openGraph: {
    title: 'Ochre',
    description: 'Colour, taken from the ground.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Ochre — colour, taken from the ground' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ochre',
    description: 'Colour, taken from the ground.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#f7f3e9',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Self-hosted: no request leaves this origin to render text. */}
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous"
          href="/fonts/newsreader-latin.woff2" />
        <link rel="preload" as="font" type="font/woff2" crossOrigin="anonymous"
          href="/fonts/ibm-plex-sans-latin.woff2" />
      </head>
      <body>
        {children}
        <footer className="site-legal-footer">
          <span>© 2026 Ochre</span>
          <nav aria-label="Legal information">
            <a href="/legal">Legal</a>
            <a href="/imprint">Imprint</a>
            <a href="/privacy">Privacy</a>
            <a href="/storage">Storage</a>
            <a href="/terms">Terms</a>
            <a href="/accessibility">Accessibility</a>
          </nav>
        </footer>
      </body>
    </html>
  );
}
