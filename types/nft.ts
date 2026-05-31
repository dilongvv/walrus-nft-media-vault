import type { SuiNetwork } from '@/constants/config';

export type MediaKind = 'image' | 'video' | 'audio' | 'model' | 'unknown';

export interface UploadedMedia {
  blobId: string;
  quiltPatchId?: string;
  walrusUrl: string;
  blobWalrusUrl: string;
  thumbnailBlobId: string;
  thumbnailQuiltPatchId?: string;
  thumbnailWalrusUrl: string;
  thumbnailFileName: string;
  size: number;
  mimeType: string;
  fileHash: string;
  fileName: string;
  mediaKind: MediaKind;
}

export interface MintInput {
  name: string;
  description: string;
  imageBlobId: string;
  mediaType: string;
  fileHash: string;
  quiltPatchId?: string;
  fileName: string;
  thumbnailBlobId: string;
  thumbnailQuiltPatchId?: string;
  thumbnailFileName: string;
}

export interface VaultNFT {
  objectId: string;
  type: string;
  name: string;
  description: string;
  imageBlobId: string;
  quiltPatchId?: string;
  fileName?: string;
  thumbnailBlobId: string;
  thumbnailQuiltPatchId?: string;
  thumbnailFileName?: string;
  mediaType: string;
  createdAt: number;
  fileHash: string;
  mediaKind: MediaKind;
  walrusUrl: string;
  thumbnailWalrusUrl: string;
  owner?: string;
  digest?: string;
}

export interface MintResult {
  digest: string;
  objectId: string;
}

export interface LocalMintRecord {
  objectId: string;
  digest: string;
  blobId: string;
  fileHash: string;
  mediaType: string;
  network: SuiNetwork;
  createdAt: number;
  quiltPatchId?: string;
  fileName?: string;
  thumbnailBlobId?: string;
  thumbnailQuiltPatchId?: string;
  thumbnailFileName?: string;
}

export interface UploadProgress {
  phase: 'idle' | 'validating' | 'poster' | 'hashing' | 'encoding' | 'registering' | 'uploading' | 'certifying' | 'complete' | 'error';
  percent: number;
  message: string;
}
