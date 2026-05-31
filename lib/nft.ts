import { NFT_MODULE, NFT_STRUCT, type SuiNetwork } from '@/constants/config';
import { getMediaKind, getWalrusBlobUrl, getWalrusFileUrl } from '@/lib/utils';
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
  const quiltPatchId = readString(fields.quilt_patch_id);
  const fileName = readString(fields.file_name);
  const thumbnailBlobId = readString(fields.thumbnail_blob_id) || imageBlobId;
  const thumbnailQuiltPatchId = readString(fields.thumbnail_quilt_patch_id) || quiltPatchId;
  const thumbnailFileName = readString(fields.thumbnail_file_name) || fileName;
  const walrusUrl = getWalrusFileUrl({
    blobId: imageBlobId,
    quiltPatchId: quiltPatchId || undefined,
    fileName: fileName || undefined,
    network
  });
  const thumbnailWalrusUrl = getWalrusFileUrl({
    blobId: thumbnailBlobId,
    quiltPatchId: thumbnailQuiltPatchId || undefined,
    fileName: thumbnailFileName || undefined,
    network
  });

  return {
    objectId,
    type,
    name: readString(fields.name),
    description: readString(fields.description),
    imageBlobId,
    quiltPatchId: quiltPatchId || undefined,
    fileName: fileName || undefined,
    thumbnailBlobId,
    thumbnailQuiltPatchId: thumbnailQuiltPatchId || undefined,
    thumbnailFileName: thumbnailFileName || undefined,
    mediaType,
    createdAt: readNumber(fields.created_at),
    fileHash: readString(fields.file_hash),
    mediaKind: getMediaKind(mediaType),
    walrusUrl,
    thumbnailWalrusUrl,
    owner,
    digest
  };
}

export function mergeHistoryWithChain(chainNfts: VaultNFT[], history: LocalMintRecord[]): VaultNFT[] {
  const historyByObjectId = new Map(history.map((record) => [record.objectId, record]));
  const enrichedChainNfts = chainNfts.map((nft) => {
    const localRecord = historyByObjectId.get(nft.objectId);
    if (!localRecord) return nft;

    return {
      ...nft,
      digest: nft.digest || localRecord.digest,
      thumbnailBlobId: nft.thumbnailBlobId || localRecord.thumbnailBlobId || nft.imageBlobId,
      thumbnailQuiltPatchId: nft.thumbnailQuiltPatchId || localRecord.thumbnailQuiltPatchId || nft.quiltPatchId,
      thumbnailFileName: nft.thumbnailFileName || localRecord.thumbnailFileName || nft.fileName,
      thumbnailWalrusUrl: nft.thumbnailWalrusUrl || getWalrusFileUrl({
        blobId: localRecord.thumbnailBlobId || localRecord.blobId,
        quiltPatchId: localRecord.thumbnailQuiltPatchId || localRecord.quiltPatchId,
        fileName: localRecord.thumbnailFileName || localRecord.fileName,
        network: localRecord.network
      })
    };
  });

  const byId = new Map(enrichedChainNfts.map((nft) => [nft.objectId, nft]));
  const historicalNfts: VaultNFT[] = history
    .filter((record) => !byId.has(record.objectId))
    .map((record) => {
      const thumbnailBlobId = record.thumbnailBlobId || record.blobId;
      const thumbnailQuiltPatchId = record.thumbnailQuiltPatchId || record.quiltPatchId;
      const thumbnailFileName = record.thumbnailFileName || record.fileName;

      return {
        objectId: record.objectId,
        type: 'local-history',
        name: `Minted media ${record.objectId.slice(0, 8)}`,
        description: 'Pending chain index refresh',
        imageBlobId: record.blobId,
        quiltPatchId: record.quiltPatchId,
        fileName: record.fileName,
        thumbnailBlobId,
        thumbnailQuiltPatchId,
        thumbnailFileName,
        mediaType: record.mediaType,
        createdAt: record.createdAt,
        fileHash: record.fileHash,
        mediaKind: getMediaKind(record.mediaType),
        walrusUrl: getWalrusFileUrl({
          blobId: record.blobId,
          quiltPatchId: record.quiltPatchId,
          fileName: record.fileName,
          network: record.network
        }),
        thumbnailWalrusUrl: getWalrusFileUrl({
          blobId: thumbnailBlobId,
          quiltPatchId: thumbnailQuiltPatchId,
          fileName: thumbnailFileName,
          network: record.network
        }),
        digest: record.digest
      };
    });

  return [...historicalNfts, ...enrichedChainNfts].sort((a, b) => b.createdAt - a.createdAt);
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
