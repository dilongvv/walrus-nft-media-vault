'use client';

import { type ReactNode } from 'react';
import { QueryProvider } from '@/providers/query-provider';
import { WalletProviders } from '@/providers/wallet-provider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <WalletProviders>{children}</WalletProviders>
    </QueryProvider>
  );
}
