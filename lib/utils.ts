import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ACCEPTED_MIME_TYPES, DEFAULT_NETWORK, MAX_FILE_SIZE_BYTES, WALRUS_AGGREGATOR_BY_NETWORK, WALRUS_UPLOAD_RELAY_BY_NETWORK, type SuiNetwork } from '@/constants/config';
import type { MediaKind } from '@/types/nft';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function assertClientEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

export function getConfiguredNetwork(): SuiNetwork {
  const value = process.env.NEXT_PUBLIC_SUI_NETWORK;
  return value === 'testnet' ? 'testnet' : DEFAULT_NETWORK;
}

export function getPackageIdForNetwork(network: SuiNetwork): string {
  const networkSpecific = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_MAINNET_PACKAGE_ID
    : process.env.NEXT_PUBLIC_TESTNET_PACKAGE_ID;

  if (networkSpecific && networkSpecific.trim().length > 0) {
    return networkSpecific;
  }

  const legacy = process.env.NEXT_PUBLIC_PACKAGE_ID;
  return legacy?.trim() || '';
}

export function getWalrusPublisherUrlForNetwork(network: SuiNetwork): string {
  const networkSpecific = network === 'mainnet'
    ? process.env.NEXT_PUBLIC_MAINNET_WALRUS_PUBLISHER_URL
    : process.env.NEXT_PUBLIC_TESTNET_WALRUS_PUBLISHER_URL;

  if (networkSpecific && networkSpecific.trim().length > 0) {
    return networkSpecific;
  }

  const legacy = process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL;
  if (legacy && legacy.trim().length > 0) {
    return legacy;
  }

  return WALRUS_UPLOAD_RELAY_BY_NETWORK[network];
}

export function getMediaKind(mimeType: string): MediaKind {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'model/gltf-binary' || mimeType === 'model/gltf+json') return 'model';
  return 'unknown';
}

export function validateMediaFile(file: File): void {
  const accepted = ACCEPTED_MIME_TYPES.some((type) => (type.endsWith('/') ? file.type.startsWith(type) : file.type === type));
  if (!accepted) {
    throw new Error('Unsupported file format. Upload image, video, audio, GLB, or GLTF media.');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File is larger than 50MB.');
  }
}

export async function sha256Hex(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function truncateAddress(value: string, size = 6): string {
  if (value.length <= size * 2 + 3) return value;
  return `${value.slice(0, size)}...${value.slice(-size)}`;
}

export function getWalrusBlobUrl(blobId: string, network: SuiNetwork = getConfiguredNetwork()): string {
  return `${WALRUS_AGGREGATOR_BY_NETWORK[network]}/v1/blobs/${blobId}`;
}

export function getWalAppLink(blobId: string): string {
  return `https://wal.app/blob/${blobId}`;
}

export function logDebug(scope: string, message: string, data?: unknown): void {
  if (process.env.NODE_ENV !== 'production') {
    if (data === undefined) {
      console.info(`[${scope}] ${message}`);
    } else {
      console.info(`[${scope}] ${message}`, data);
    }
  }
}

export function normalizeError(error: unknown): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string') return new Error(error);
  return new Error('Unexpected error');
}
