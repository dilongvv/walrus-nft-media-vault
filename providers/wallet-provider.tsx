'use client';

import { SuiClientProvider, WalletProvider, createNetworkConfig } from '@mysten/dapp-kit';
import { type ReactNode } from 'react';
import { DEFAULT_NETWORK, SUPPORTED_NETWORKS } from '@/constants/config';
import { getFallbackWalletRpcUrl, getWalletRpcUrl } from '@/lib/sui-client';

const { networkConfig } = createNetworkConfig({
  testnet: {
    network: 'testnet',
    url: getWalletRpcUrl('testnet'),
    variables: {
      fallbackUrl: getFallbackWalletRpcUrl('testnet')
    }
  },
  mainnet: {
    network: 'mainnet',
    url: getWalletRpcUrl('mainnet'),
    variables: {
      fallbackUrl: getFallbackWalletRpcUrl('mainnet')
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
