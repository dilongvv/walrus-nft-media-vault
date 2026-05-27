import { Transaction } from '@mysten/sui/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@/constants/config';
import type { MintInput } from '@/types/nft';

export function buildMintTransaction(packageId: string, input: MintInput): Transaction {
  if (!packageId) {
    throw new Error('Package ID is not configured.');
  }

  const tx = new Transaction();
  tx.moveCall({
    target: `${packageId}::nft::mint`,
    arguments: [
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(input.name))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(input.description))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(input.imageBlobId))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(input.quiltPatchId || ''))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(input.fileName))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(input.mediaType))),
      tx.pure.vector('u8', Array.from(new TextEncoder().encode(input.fileHash))),
      tx.object(SUI_CLOCK_OBJECT_ID)
    ]
  });
  return tx;
}
