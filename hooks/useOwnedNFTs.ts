'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useQuery } from '@tanstack/react-query';
import { getMintHistory } from '@/hooks/useMintNFT';
import { getNftType, isMoveObjectContent, mergeHistoryWithChain, parseNftObject } from '@/lib/nft';
import { withRpcFallback } from '@/lib/sui-client';
import { getPackageIdForNetwork, getPackageIdsForNetwork } from '@/lib/utils';
import type { VaultNFT } from '@/types/nft';
import { useWalletNetwork } from '@/hooks/useWalletNetwork';

export function useOwnedNFTs() {
  const account = useCurrentAccount();
  const { network } = useWalletNetwork();
  const packageId = getPackageIdForNetwork(network);
  const packageIds = getPackageIdsForNetwork(network);

  return useQuery({
    queryKey: ['owned-nfts', account?.address, network, packageIds],
    enabled: Boolean(account?.address && packageId),
    queryFn: async (): Promise<VaultNFT[]> => {
      if (!account?.address) return [];
      const responses = await Promise.all(
        packageIds.map((id) =>
          withRpcFallback(
            (client) =>
              client.getOwnedObjects({
                owner: account.address,
                filter: {
                  StructType: getNftType(id)
                },
                options: {
                  showContent: true,
                  showOwner: true,
                  showPreviousTransaction: true,
                  showType: true
                }
              }),
            network
          )
        )
      );

      const seen = new Set<string>();
      const chainNfts = responses.flatMap((response) => response.data).flatMap((item) => {
        const data = item.data;
        if (!data?.content || !data.type || !isMoveObjectContent(data.content)) return [];
        if (seen.has(data.objectId)) return [];
        seen.add(data.objectId);
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
  const packageIds = getPackageIdsForNetwork(network);
  const nftTypes = new Set(packageIds.map((id) => getNftType(id)));

  return useQuery({
    queryKey: ['nft', objectId, network, packageIds],
    enabled: Boolean(objectId && packageId),
    queryFn: async (): Promise<VaultNFT> => {
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
      if (!data?.content || !data.type || !nftTypes.has(data.type) || !isMoveObjectContent(data.content)) {
        throw new Error('NFT object was not found for this package.');
      }
      const parsed = parseNftObject(data.objectId, data.type, data.content.fields, network, undefined, data.previousTransaction ?? undefined);
      return mergeHistoryWithChain([parsed], getMintHistory().filter((record) => record.network === network))[0] ?? parsed;
    }
  });
}
