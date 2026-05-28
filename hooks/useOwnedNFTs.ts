'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import type { SuiClientTypes } from '@mysten/sui/client';
import { useQuery } from '@tanstack/react-query';
import { getMintHistory } from '@/hooks/useMintNFT';
import { getNftType, mergeHistoryWithChain, parseNftObject } from '@/lib/nft';
import { type SuiDataClient, withSuiDataFallback } from '@/lib/sui-client';
import { getPackageIdForNetwork, getPackageIdsForNetwork } from '@/lib/utils';
import type { VaultNFT } from '@/types/nft';
import { useWalletNetwork } from '@/hooks/useWalletNetwork';

type OwnedNftObject = Awaited<ReturnType<SuiDataClient['listOwnedObjects']>>['objects'][number];
type OwnedNftResponse = SuiClientTypes.ListOwnedObjectsResponse<{
  json: true;
  previousTransaction: true;
}>;

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
          withSuiDataFallback((client) => listAllOwnedNftObjects(client, account.address, getNftType(id)), network)
        )
      );

      const seen = new Set<string>();
      const chainNfts = responses.flat().flatMap((object) => {
        if (!object.json || !object.type) return [];
        if (seen.has(object.objectId)) return [];
        seen.add(object.objectId);
        return [
          parseNftObject(
            object.objectId,
            object.type,
            object.json,
            network,
            readAddressOwner(object.owner) ?? account.address,
            object.previousTransaction ?? undefined
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
      const response = await withSuiDataFallback(
        (client) =>
          client.getObject({
            objectId,
            include: {
              json: true,
              previousTransaction: true
            }
          }),
        network
      );
      const data = response.object;
      if (!data?.json || !data.type || !nftTypes.has(data.type)) {
        throw new Error('NFT object was not found for this package.');
      }
      const parsed = parseNftObject(data.objectId, data.type, data.json, network, readAddressOwner(data.owner), data.previousTransaction ?? undefined);
      return mergeHistoryWithChain([parsed], getMintHistory().filter((record) => record.network === network))[0] ?? parsed;
    }
  });
}

async function listAllOwnedNftObjects(client: SuiDataClient, owner: string, type: string): Promise<OwnedNftObject[]> {
  const objects: OwnedNftObject[] = [];
  let cursor: string | null = null;

  do {
    const response: OwnedNftResponse = await client.listOwnedObjects({
      owner,
      type,
      cursor,
      limit: 50,
      include: {
        json: true,
        previousTransaction: true
      }
    });
    objects.push(...response.objects);
    cursor = response.hasNextPage ? response.cursor : null;
  } while (cursor);

  return objects;
}

function readAddressOwner(owner: unknown): string | undefined {
  if (typeof owner !== 'object' || owner === null) return undefined;
  const maybe = owner as { $kind?: unknown; AddressOwner?: unknown };
  return maybe.$kind === 'AddressOwner' && typeof maybe.AddressOwner === 'string' ? maybe.AddressOwner : undefined;
}
