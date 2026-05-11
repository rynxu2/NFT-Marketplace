import type { Metadata } from 'next';
import './globals.css';
import dynamic from 'next/dynamic';
import Providers from './providers';
import Header from '@/components/layout/Header';

const Footer = dynamic(() => import('@/components/layout/Footer'));
const ToastProvider = dynamic(() => import('@/components/ui/ToastProvider'));

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nexus-nft.pages.dev';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'NEXUS — NFT Marketplace on Solana',
    template: '%s | NEXUS',
  },
  description: 'The futuristic NFT marketplace built on Solana. Trade, create, and collect digital assets at the speed of light.',
  keywords: ['NFT', 'marketplace', 'Solana', 'crypto', 'digital art', 'blockchain', 'web3', 'devnet', 'collectibles'],
  authors: [{ name: 'NEXUS Team' }],
  creator: 'NEXUS',
  openGraph: {
    title: 'NEXUS — NFT Marketplace on Solana',
    description: 'Trade, create, and collect digital assets at the speed of light.',
    type: 'website',
    siteName: 'NEXUS NFT Marketplace',
    locale: 'en_US',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NEXUS — NFT Marketplace on Solana',
    description: 'Trade, create, and collect digital assets at the speed of light.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-[family-name:var(--font-body)] antialiased">
        <Providers>
          {/* Cyber Grid Background */}
          <div className="cyber-grid-bg" />
          {/* Scan Line Effect */}
          <div className="scan-line" />

          <Header />
          <main className="relative z-10 pt-16 min-h-screen">
            {children}
          </main>
          <Footer />
          <ToastProvider />
        </Providers>
      </body>
    </html>
  );
}
