'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { buildMintTransaction } from '@/lib/transactions';
import { getPackageIdForNetwork, logDebug, normalizeError } from '@/lib/utils';
import type { LocalMintRecord, MintInput, MintResult } from '@/types/nft';
import { useWalletNetwork } from '@/hooks/useWalletNetwork';
import { useSuiTransactionExecutor } from '@/hooks/useSuiTransactionExecutor';

const HISTORY_KEY = 'walrus-nft-media-vault-history';

export function useMintNFT() {
  const account = useCurrentAccount();
  const queryClient = useQueryClient();
  const { network } = useWalletNetwork();
  const packageId = getPackageIdForNetwork(network);
  const { signAndExecute } = useSuiTransactionExecutor(network);

  const mutation = useMutation({
    mutationFn: async (input: MintInput): Promise<MintResult> => {
      if (!account?.address) {
        throw new Error('Connect a wallet before minting.');
      }

      const tx = buildMintTransaction(packageId, input);
      logDebug('mint', 'built mint transaction', input);
      const result = await signAndExecute(tx);

      const createdObject = result.createdObjects.find((change) => change.objectType === `${packageId}::nft::NFT`);
      const objectId = createdObject?.objectId;
      if (!objectId) {
        throw new Error('Mint succeeded but NFT object id was not returned.');
      }

      const mintResult: MintResult = {
        digest: result.digest,
        objectId
      };

      saveMintHistory({
        objectId,
        digest: result.digest,
        blobId: input.imageBlobId,
        fileHash: input.fileHash,
        mediaType: input.mediaType,
        network,
        createdAt: Date.now(),
        quiltPatchId: input.quiltPatchId,
        fileName: input.fileName,
        thumbnailBlobId: input.thumbnailBlobId,
        thumbnailQuiltPatchId: input.thumbnailQuiltPatchId,
        thumbnailFileName: input.thumbnailFileName
      });
      await queryClient.invalidateQueries({ queryKey: ['owned-nfts', account.address, network, packageId] });
      toast.success('NFT minted', { description: objectId });
      return mintResult;
    },
    onError: (error) => {
      const normalized = normalizeError(error);
      toast.error('Mint failed', { description: normalized.message });
    }
  });

  return {
    ...mutation,
    mint: mutation.mutateAsync,
    packageId,
    network
  };
}

export function getMintHistory(): LocalMintRecord[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocalMintRecord);
  } catch {
    return [];
  }
}

export function saveMintHistory(record: LocalMintRecord): void {
  if (typeof window === 'undefined') return;
  const next = [record, ...getMintHistory().filter((item) => item.objectId !== record.objectId)].slice(0, 50);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
}

function isLocalMintRecord(value: unknown): value is LocalMintRecord {
  if (typeof value !== 'object' || value === null) return false;
  const maybe = value as Partial<LocalMintRecord>;
  return typeof maybe.objectId === 'string' && typeof maybe.digest === 'string' && typeof maybe.blobId === 'string' && typeof maybe.fileHash === 'string' && typeof maybe.mediaType === 'string' && typeof maybe.createdAt === 'number';
}
