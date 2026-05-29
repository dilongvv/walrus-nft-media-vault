import type { SuiClientTypes } from '@mysten/sui/client';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { SuiGraphQLClient } from '@mysten/sui/graphql';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';
import {
  DEFAULT_FALLBACK_GRAPHQL_BY_NETWORK,
  DEFAULT_FALLBACK_RPC_BY_NETWORK,
  DEFAULT_GRAPHQL_BY_NETWORK,
  DEFAULT_GRPC_BY_NETWORK,
  DEFAULT_NETWORK,
  DEFAULT_RPC_BY_NETWORK,
  type SuiNetwork
} from '@/constants/config';

export type SuiDataClient = SuiGraphQLClient | SuiGrpcClient;
type ExecutedCoreTransactionResult = SuiClientTypes.TransactionResult<{
  effects: true;
  objectTypes: true;
}>;
type ExecutedCoreTransaction = SuiClientTypes.Transaction<{
  effects: true;
  objectTypes: true;
}>;

const SUI_TRANSACTION_TIMEOUT_MS = 120_000;
const SUI_TRANSACTION_RECOVERY_WAIT_MS = 45_000;

export interface ExecutedObjectChange {
  objectId: string;
  objectType?: string;
  idOperation: 'Unknown' | 'None' | 'Created' | 'Deleted';
}

export interface ExecutedTransactionSummary {
  digest: string;
  createdObjects: ExecutedObjectChange[];
  changedObjects: ExecutedObjectChange[];
}

export function getGraphQLUrl(network: SuiNetwork): string {
  const networkSpecific = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_MAINNET_SUI_GRAPHQL_URL
    : process.env.NEXT_PUBLIC_TESTNET_SUI_GRAPHQL_URL;

  if (networkSpecific && networkSpecific.trim().length > 0) {
    return networkSpecific;
  }

  return process.env.NEXT_PUBLIC_SUI_GRAPHQL_URL || DEFAULT_GRAPHQL_BY_NETWORK[network];
}

export function getFallbackGraphQLUrl(network: SuiNetwork): string {
  const networkSpecific = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_MAINNET_SUI_FALLBACK_GRAPHQL_URL
    : process.env.NEXT_PUBLIC_TESTNET_SUI_FALLBACK_GRAPHQL_URL;

  if (networkSpecific && networkSpecific.trim().length > 0) {
    return networkSpecific;
  }

  return process.env.NEXT_PUBLIC_SUI_FALLBACK_GRAPHQL_URL || DEFAULT_FALLBACK_GRAPHQL_BY_NETWORK[network];
}

export function getGrpcUrl(network: SuiNetwork): string {
  const networkSpecific = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_MAINNET_SUI_GRPC_URL
    : process.env.NEXT_PUBLIC_TESTNET_SUI_GRPC_URL;

  if (networkSpecific && networkSpecific.trim().length > 0) {
    return networkSpecific;
  }

  return process.env.NEXT_PUBLIC_SUI_GRPC_URL || DEFAULT_GRPC_BY_NETWORK[network];
}

export function getWalletRpcUrl(network: SuiNetwork): string {
  const networkSpecific = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_MAINNET_SUI_WALLET_RPC_URL ?? process.env.NEXT_PUBLIC_MAINNET_SUI_RPC_URL
    : process.env.NEXT_PUBLIC_TESTNET_SUI_WALLET_RPC_URL ?? process.env.NEXT_PUBLIC_TESTNET_SUI_RPC_URL;

  if (networkSpecific && networkSpecific.trim().length > 0) {
    return networkSpecific;
  }

  if (network === getConfiguredNetwork()) {
    return process.env.NEXT_PUBLIC_SUI_WALLET_RPC_URL || process.env.NEXT_PUBLIC_SUI_RPC_URL || DEFAULT_RPC_BY_NETWORK[network];
  }

  return DEFAULT_RPC_BY_NETWORK[network];
}

export function getFallbackWalletRpcUrl(network: SuiNetwork): string {
  const networkSpecific = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_MAINNET_SUI_FALLBACK_WALLET_RPC_URL ?? process.env.NEXT_PUBLIC_MAINNET_SUI_FALLBACK_RPC_URL
    : process.env.NEXT_PUBLIC_TESTNET_SUI_FALLBACK_WALLET_RPC_URL ?? process.env.NEXT_PUBLIC_TESTNET_SUI_FALLBACK_RPC_URL;

  if (networkSpecific && networkSpecific.trim().length > 0) {
    return networkSpecific;
  }

  if (network === getConfiguredNetwork()) {
    return process.env.NEXT_PUBLIC_SUI_FALLBACK_WALLET_RPC_URL || process.env.NEXT_PUBLIC_SUI_FALLBACK_RPC_URL || DEFAULT_FALLBACK_RPC_BY_NETWORK[network];
  }

  return DEFAULT_FALLBACK_RPC_BY_NETWORK[network];
}

export function createSuiGraphQLClient(network: SuiNetwork = DEFAULT_NETWORK, fallback = false): SuiGraphQLClient {
  return new SuiGraphQLClient({
    network,
    url: fallback ? getFallbackGraphQLUrl(network) : getGraphQLUrl(network)
  });
}

export function createSuiGrpcClient(network: SuiNetwork = DEFAULT_NETWORK): SuiGrpcClient {
  return new SuiGrpcClient({
    network,
    baseUrl: getGrpcUrl(network)
  });
}

export async function withSuiDataFallback<T>(request: (client: SuiDataClient) => Promise<T>, network: SuiNetwork): Promise<T> {
  const primary = createSuiGraphQLClient(network, false);
  try {
    return await withTimeout(request(primary), 15_000, 'Primary Sui GraphQL timed out.');
  } catch (primaryError) {
    const fallbackGraphQL = createSuiGraphQLClient(network, true);
    try {
      return await withTimeout(request(fallbackGraphQL), 15_000, 'Fallback Sui GraphQL timed out.');
    } catch (fallbackGraphQLError) {
      const fallbackGrpc = createSuiGrpcClient(network);
      try {
        return await withTimeout(request(fallbackGrpc), 15_000, 'Fallback Sui gRPC timed out.');
      } catch (fallbackGrpcError) {
        throw new Error(
          `Sui data unavailable. GraphQL: ${formatUnknownError(primaryError)}; fallback GraphQL: ${formatUnknownError(fallbackGraphQLError)}; gRPC: ${formatUnknownError(fallbackGrpcError)}`
        );
      }
    }
  }
}

export async function prepareTransactionForWallet(transaction: Transaction, network: SuiNetwork, sender: string): Promise<string> {
  transaction.setSenderIfNotSet(sender);
  await transaction.build({
    client: createSuiGraphQLClient(network)
  });
  return transaction.toJSON({
    client: createSuiGraphQLClient(network)
  });
}

export async function executeSignedTransaction(network: SuiNetwork, bytes: string, signature: string): Promise<ExecutedTransactionSummary> {
  const transactionBytes = fromBase64(bytes);
  const expectedDigest = await Transaction.from(transactionBytes).getDigest({
    client: createSuiGraphQLClient(network)
  });
  const result = await withSuiTransactionFallback(
    (client) =>
      client.executeTransaction({
        transaction: transactionBytes,
        signatures: [signature],
        include: {
          effects: true,
          objectTypes: true
        }
      }),
    network,
    expectedDigest
  );

  return summarizeExecutedTransaction(result);
}

function summarizeExecutedTransaction(result: ExecutedCoreTransactionResult): ExecutedTransactionSummary {
  const transaction = getCoreTransaction(result);
  const status = transaction.status;
  if (!status.success) {
    throw new Error(`Transaction failed: ${formatExecutionError(status.error)}`);
  }

  const changedObjects = transaction.effects.changedObjects.map((change) => ({
    objectId: change.objectId,
    objectType: transaction.objectTypes[change.objectId],
    idOperation: change.idOperation
  }));

  return {
    digest: transaction.digest,
    changedObjects,
    createdObjects: changedObjects.filter((change) => change.idOperation === 'Created')
  };
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

async function withSuiTransactionFallback<T>(
  request: (client: SuiDataClient) => Promise<T>,
  network: SuiNetwork,
  expectedDigest?: string
): Promise<T> {
  const primary = createSuiGraphQLClient(network, false);
  try {
    return await withTimeout(request(primary), SUI_TRANSACTION_TIMEOUT_MS, 'Primary Sui GraphQL transaction timed out.');
  } catch (primaryError) {
    if (expectedDigest && isTimeoutError(primaryError)) {
      const recovered = await recoverTimedOutTransaction(primary, expectedDigest);
      if (recovered) return recovered as T;
    }

    const fallbackGraphQL = createSuiGraphQLClient(network, true);
    try {
      return await withTimeout(request(fallbackGraphQL), SUI_TRANSACTION_TIMEOUT_MS, 'Fallback Sui GraphQL transaction timed out.');
    } catch (fallbackGraphQLError) {
      if (expectedDigest && isTimeoutError(fallbackGraphQLError)) {
        const recovered = await recoverTimedOutTransaction(fallbackGraphQL, expectedDigest);
        if (recovered) return recovered as T;
      }

    const fallbackGrpc = createSuiGrpcClient(network);
    try {
        return await withTimeout(request(fallbackGrpc), SUI_TRANSACTION_TIMEOUT_MS, 'Fallback Sui gRPC transaction timed out.');
    } catch (fallbackGrpcError) {
        if (expectedDigest && isTimeoutError(fallbackGrpcError)) {
          const recovered = await recoverTimedOutTransaction(primary, expectedDigest);
          if (recovered) return recovered as T;
        }

        throw new Error(
          `Sui transaction unavailable. GraphQL: ${formatUnknownError(primaryError)}; fallback GraphQL: ${formatUnknownError(fallbackGraphQLError)}; gRPC: ${formatUnknownError(fallbackGrpcError)}`
        );
      }
    }
  }
}

async function recoverTimedOutTransaction(client: SuiDataClient, digest: string): Promise<ExecutedCoreTransactionResult | undefined> {
  try {
    return await client.waitForTransaction({
      digest,
      timeout: SUI_TRANSACTION_RECOVERY_WAIT_MS,
      include: {
        effects: true,
        objectTypes: true
      }
    });
  } catch {
    return undefined;
  }
}

function getCoreTransaction(result: ExecutedCoreTransactionResult): ExecutedCoreTransaction {
  return result.$kind === 'Transaction' ? result.Transaction : result.FailedTransaction;
}

function getConfiguredNetwork(): SuiNetwork {
  return process.env.NEXT_PUBLIC_SUI_NETWORK === 'testnet' ? 'testnet' : DEFAULT_NETWORK;
}

function formatUnknownError(error: unknown): string {
  return error instanceof Error ? error.message : 'failed';
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.message.toLowerCase().includes('timed out');
}

function formatExecutionError(error: SuiClientTypes.ExecutionError): string {
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'description' in error) {
    const maybe = error as { description?: unknown };
    if (typeof maybe.description === 'string') return maybe.description;
  }
  return JSON.stringify(error);
}
