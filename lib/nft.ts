import { NFT_MODULE, NFT_STRUCT, type SuiNetwork } from '@/constants/config';
import { getMediaKind, getWalrusBlobUrl } from '@/lib/utils';
import type { LocalMintRecord, VaultNFT } from '@/types/nft';

interface MoveObjectContent {
  dataType: 'moveObject';
  type: string;
  fields: Record<string, unknown>;
}

export function getNftType(packageId: string): string {
  return `${packageId}::${NFT_MODULE}::${NFT_STRUCT}`;
}

export function isMoveObjectContent(content: unknown): content is MoveObjectContent {
  if (typeof content !== 'object' || content === null) return false;
  const maybe = content as { dataType?: unknown; type?: unknown; fields?: unknown };
  return maybe.dataType === 'moveObject' && typeof maybe.type === 'string' && typeof maybe.fields === 'object' && maybe.fields !== null;
}

export function parseNftObject(objectId: string, type: string, fields: Record<string, unknown>, network: SuiNetwork, owner?: string, digest?: string): VaultNFT {
  const mediaType = readString(fields.media_type);
  const imageBlobId = readString(fields.image_blob_id);
  return {
    objectId,
    type,
    name: readString(fields.name),
    description: readString(fields.description),
    imageBlobId,
    mediaType,
    createdAt: readNumber(fields.created_at),
    fileHash: readString(fields.file_hash),
    mediaKind: getMediaKind(mediaType),
    walrusUrl: getWalrusBlobUrl(imageBlobId, network),
    owner,
    digest
  };
}

export function mergeHistoryWithChain(chainNfts: VaultNFT[], history: LocalMintRecord[]): VaultNFT[] {
  const byId = new Map(chainNfts.map((nft) => [nft.objectId, nft]));
  const historicalNfts: VaultNFT[] = history
    .filter((record) => !byId.has(record.objectId))
    .map((record) => ({
      objectId: record.objectId,
      type: 'local-history',
      name: `Minted media ${record.objectId.slice(0, 8)}`,
      description: 'Pending chain index refresh',
      imageBlobId: record.blobId,
      mediaType: record.mediaType,
      createdAt: record.createdAt,
      fileHash: record.fileHash,
      mediaKind: getMediaKind(record.mediaType),
      walrusUrl: getWalrusBlobUrl(record.blobId, record.network),
      digest: record.digest
    }));

  return [...historicalNfts, ...chainNfts].sort((a, b) => b.createdAt - a.createdAt);
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
