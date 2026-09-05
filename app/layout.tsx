import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Field Palette — Keep the colours of a place',
  description:
    'Turn nature photographs into living colour palettes and keep them in a private field journal.',
  openGraph: {
    title: 'Field Palette',
    description: 'Notice a place. Keep its colours.',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'Field Palette nature colour journal' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Field Palette',
    description: 'Notice a place. Keep its colours.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
