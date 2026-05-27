import type { SuiNetwork } from '@/constants/config';

export type MediaKind = 'image' | 'video' | 'audio' | 'model' | 'unknown';

export interface UploadedMedia {
  blobId: string;
  quiltId?: string;
  walrusUrl: string;
  blobWalrusUrl: string;
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
  quiltId?: string;
  fileName?: string;
}

export interface VaultNFT {
  objectId: string;
  type: string;
  name: string;
  description: string;
  imageBlobId: string;
  mediaType: string;
  createdAt: number;
  fileHash: string;
  mediaKind: MediaKind;
  walrusUrl: string;
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
  quiltId?: string;
  fileName?: string;
}

export interface UploadProgress {
  phase: 'idle' | 'validating' | 'hashing' | 'encoding' | 'registering' | 'uploading' | 'certifying' | 'complete' | 'error';
  percent: number;
  message: string;
}
