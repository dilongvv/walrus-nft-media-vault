'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { getMintHistory } from '@/hooks/useMintNFT';
import { getNftType, isMoveObjectContent, mergeHistoryWithChain, parseNftObject } from '@/lib/nft';
import { withRpcFallback } from '@/lib/sui-client';
import { getPackageIdForNetwork } from '@/lib/utils';
import type { VaultNFT } from '@/types/nft';
import { useWalletNetwork } from '@/hooks/useWalletNetwork';

export function useOwnedNFTs() {
  const account = useCurrentAccount();
  const { network } = useWalletNetwork();
  const packageId = getPackageIdForNetwork(network);

  return useQuery({
    queryKey: ['owned-nfts', account?.address, network, packageId],
    enabled: Boolean(account?.address && packageId),
    queryFn: async (): Promise<VaultNFT[]> => {
      if (!account?.address) return [];
      const nftType = getNftType(packageId);
      const response = await withRpcFallback(
        (client) =>
          client.getOwnedObjects({
            owner: account.address,
            filter: {
              StructType: nftType
            },
            options: {
              showContent: true,
              showOwner: true,
              showPreviousTransaction: true,
              showType: true
            }
          }),
        network
      );

      const chainNfts = response.data.flatMap((item) => {
        const data = item.data;
        if (!data?.content || !data.type || !isMoveObjectContent(data.content)) return [];
        return [
          parseNftObject(
            data.objectId,
            data.type,
            data.content.fields,
            network,
            account.address,
            data.previousTransaction ?? undefined
          )
        ];
      });

      return mergeHistoryWithChain(chainNfts, getMintHistory().filter((record) => record.network === network));
    }
  });
}

export function useNFT(objectId: string) {
  const { network } = useWalletNetwork();
  const packageId = getPackageIdForNetwork(network);

  return useQuery({
    queryKey: ['nft', objectId, network, packageId],
    enabled: Boolean(objectId && packageId),
    queryFn: async (): Promise<VaultNFT> => {
      const nftType = getNftType(packageId);
      const response = await withRpcFallback(
        (client) =>
          client.getObject({
            id: objectId,
            options: {
              showContent: true,
              showOwner: true,
              showPreviousTransaction: true,
              showType: true
            }
          }),
        network
      );
      const data = response.data;
      if (!data?.content || !data.type || data.type !== nftType || !isMoveObjectContent(data.content)) {
        throw new Error('NFT object was not found for this package.');
      }
      return parseNftObject(data.objectId, data.type, data.content.fields, network, undefined, data.previousTransaction ?? undefined);
    }
  });
}
