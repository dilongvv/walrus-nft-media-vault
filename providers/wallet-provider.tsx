'use client';

import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { type ReactNode } from 'react';
import { DEFAULT_NETWORK, SUPPORTED_NETWORKS } from '@/constants/config';
import { getFallbackRpcUrl, getPrimaryRpcUrl } from '@/lib/sui-client';

const { networkConfig } = createNetworkConfig({
  testnet: {
    network: 'testnet',
    url: getPrimaryRpcUrl('testnet'),
    variables: {
      fallbackUrl: getFallbackRpcUrl('testnet')
    }
  },
  mainnet: {
    network: 'mainnet',
    url: getPrimaryRpcUrl('mainnet'),
    variables: {
      fallbackUrl: getFallbackRpcUrl('mainnet')
    }
  }
});

export function WalletProviders({ children }: { children: ReactNode }) {
  return (
    <SuiClientProvider networks={networkConfig} defaultNetwork={process.env.NEXT_PUBLIC_SUI_NETWORK === 'mainnet' ? 'mainnet' : DEFAULT_NETWORK}>
      <WalletProvider autoConnect preferredWallets={['Sui Wallet', 'Suiet', 'Ethos Wallet', 'Backpack']}>
        {children}
      </WalletProvider>
    </SuiClientProvider>
  );
}

export { SUPPORTED_NETWORKS };
