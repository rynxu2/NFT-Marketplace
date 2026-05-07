import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ToastProvider from '@/components/ui/ToastProvider';

export const metadata: Metadata = {
  title: 'NEXUS — NFT Marketplace on Solana',
  description: 'The futuristic NFT marketplace built on Solana. Trade, create, and collect digital assets at the speed of light.',
  keywords: ['NFT', 'marketplace', 'Solana', 'crypto', 'digital art', 'blockchain'],
  openGraph: {
    title: 'NEXUS — NFT Marketplace on Solana',
    description: 'Trade, create, and collect digital assets at the speed of light.',
    type: 'website',
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
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
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
