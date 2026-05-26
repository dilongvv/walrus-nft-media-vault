'use client';

import { useSuiClientContext } from '@mysten/dapp-kit';
import { DEFAULT_NETWORK, SUPPORTED_NETWORKS, type SuiNetwork } from '@/constants/config';

export function useWalletNetwork() {
  const context = useSuiClientContext();
  const network = SUPPORTED_NETWORKS.includes(context.network as SuiNetwork) ? (context.network as SuiNetwork) : DEFAULT_NETWORK;

  function switchNetwork(nextNetwork: SuiNetwork): void {
    context.selectNetwork(nextNetwork);
  }

  return {
    network,
    switchNetwork,
    supportedNetworks: SUPPORTED_NETWORKS
  };
}
