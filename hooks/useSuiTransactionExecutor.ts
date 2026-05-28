'use client';

import { useCurrentAccount, useSignTransaction } from '@mysten/dapp-kit';
import type { Transaction } from '@mysten/sui/transactions';
import { executeSignedTransaction, prepareTransactionForWallet, type ExecutedTransactionSummary } from '@/lib/sui-client';
import type { SuiNetwork } from '@/constants/config';

export function useSuiTransactionExecutor(network: SuiNetwork) {
  const account = useCurrentAccount();
  const { mutateAsync: signTransaction } = useSignTransaction();

  async function signAndExecute(transaction: Transaction): Promise<ExecutedTransactionSummary> {
    if (!account?.address) {
      throw new Error('Connect a wallet first.');
    }

    const transactionJson = await prepareTransactionForWallet(transaction, network, account.address);
    const signed = await signTransaction({
      transaction: transactionJson,
      chain: `sui:${network}`
    });
    return executeSignedTransaction(network, signed.bytes, signed.signature);
  }

  return {
    signAndExecute
  };
}
