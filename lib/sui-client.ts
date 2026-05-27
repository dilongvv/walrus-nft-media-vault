import { SuiJsonRpcClient } from '@mysten/sui/jsonRpc';
import { DEFAULT_FALLBACK_RPC_BY_NETWORK, DEFAULT_NETWORK, DEFAULT_RPC_BY_NETWORK, type SuiNetwork } from '@/constants/config';

export function getPrimaryRpcUrl(network: SuiNetwork): string {
  const networkSpecific = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_MAINNET_SUI_RPC_URL
    : process.env.NEXT_PUBLIC_TESTNET_SUI_RPC_URL;

  if (networkSpecific && networkSpecific.trim().length > 0) {
    return networkSpecific;
  }

  if (network === getConfiguredNetwork()) {
    return process.env.NEXT_PUBLIC_SUI_RPC_URL || DEFAULT_RPC_BY_NETWORK[network];
  }

  return DEFAULT_RPC_BY_NETWORK[network];
}

export function getFallbackRpcUrl(network: SuiNetwork): string {
  const networkSpecific = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_MAINNET_SUI_FALLBACK_RPC_URL
    : process.env.NEXT_PUBLIC_TESTNET_SUI_FALLBACK_RPC_URL;

  if (networkSpecific && networkSpecific.trim().length > 0) {
    return networkSpecific;
  }

  if (network === getConfiguredNetwork()) {
    return process.env.NEXT_PUBLIC_SUI_FALLBACK_RPC_URL || DEFAULT_FALLBACK_RPC_BY_NETWORK[network];
  }

  return DEFAULT_FALLBACK_RPC_BY_NETWORK[network];
}

export function createSuiJsonRpcClient(network: SuiNetwork = DEFAULT_NETWORK, fallback = false): SuiJsonRpcClient {
  return new SuiJsonRpcClient({
    network,
    url: fallback ? getFallbackRpcUrl(network) : getPrimaryRpcUrl(network)
  });
}

export async function withRpcFallback<T>(request: (client: SuiJsonRpcClient) => Promise<T>, network: SuiNetwork): Promise<T> {
  const primary = createSuiJsonRpcClient(network, false);
  try {
    return await withTimeout(request(primary), 15_000, 'Primary RPC timed out.');
  } catch (primaryError) {
    const fallback = createSuiJsonRpcClient(network, true);
    try {
      return await withTimeout(request(fallback), 15_000, 'Fallback RPC timed out.');
    } catch (fallbackError) {
      throw new Error(`RPC unavailable. Primary: ${primaryError instanceof Error ? primaryError.message : 'failed'}; fallback: ${fallbackError instanceof Error ? fallbackError.message : 'failed'}`);
    }
  }
}

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function getConfiguredNetwork(): SuiNetwork {
  return process.env.NEXT_PUBLIC_SUI_NETWORK === 'testnet' ? 'testnet' : DEFAULT_NETWORK;
}
