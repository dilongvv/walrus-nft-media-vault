import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Walrus NFT Media Vault',
  description: 'Decentralized rich-media NFT storage and display dApp on Walrus and Sui.',
  icons: {
    icon: '/favicon.svg'
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AppProviders>{children}</AppProviders>
        <Toaster richColors theme="dark" position="top-right" />
      </body>
    </html>
  );
}
