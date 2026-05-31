'use client';

import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { WALRUS_EPOCHS, createWalrusClient, createWalrusFile } from '@/lib/walrus';
import { getWalrusBlobUrl, getWalrusFileUrl, logDebug, normalizeError, sha256Hex, validateMediaFile, getMediaKind } from '@/lib/utils';
import type { UploadedMedia, UploadProgress } from '@/types/nft';
import { useWalletNetwork } from '@/hooks/useWalletNetwork';
import { useSuiTransactionExecutor } from '@/hooks/useSuiTransactionExecutor';

const initialProgress: UploadProgress = {
  phase: 'idle',
  percent: 0,
  message: 'Ready'
};

interface StoredWalrusFileReference {
  id: string;
  blobId: string;
}

interface ResolvedStoredFileReferences {
  media: StoredWalrusFileReference;
  thumbnail: StoredWalrusFileReference;
}

export function useWalrusUpload() {
  const account = useCurrentAccount();
  const { network } = useWalletNetwork();
  const { signAndExecute } = useSuiTransactionExecutor(network);
  const [progress, setProgress] = useState<UploadProgress>(initialProgress);

  const reset = useCallback(() => setProgress(initialProgress), []);

  const mutation = useMutation({
    mutationFn: async (file: File): Promise<UploadedMedia> => {
      if (!account?.address) {
        throw new Error('Connect a wallet before uploading.');
      }

      setProgress({ phase: 'validating', percent: 8, message: 'Validating media' });
      validateMediaFile(file);

      setProgress({ phase: 'poster', percent: 14, message: 'Preparing wallet preview' });
      const posterFile = file.type.startsWith('video/') ? await createVideoPosterFile(file) : undefined;

      setProgress({ phase: 'hashing', percent: 18, message: 'Calculating SHA-256 hash' });
      const fileHash = await sha256Hex(file);
      const posterHash = posterFile ? await sha256Hex(posterFile) : undefined;
      logDebug('walrus', 'file hash calculated', { fileHash, fileName: file.name });

      const walrusClient = await createWalrusClient(network);
      const walrusFile = await createWalrusFile(file, fileHash);
      const posterWalrusFile = posterFile && posterHash ? await createWalrusFile(posterFile, posterHash) : undefined;
      const flow = walrusClient.walrus.writeFilesFlow({ files: posterWalrusFile ? [walrusFile, posterWalrusFile] : [walrusFile] });

      setProgress({ phase: 'encoding', percent: 30, message: 'Encoding Walrus quilt' });
      const encoded = await flow.encode();
      logDebug('walrus', 'encoded blob', encoded);

      setProgress({ phase: 'registering', percent: 45, message: 'Registering blob on Sui' });
      const registerTx = flow.register({
        epochs: WALRUS_EPOCHS,
        owner: account.address,
        deletable: true
      });
      const registerResult = await signAndExecute(registerTx);
      logDebug('walrus', 'register transaction signed', registerResult);

      setProgress({ phase: 'uploading', percent: 68, message: 'Uploading through Walrus relay' });
      await flow.upload({ digest: registerResult.digest });

      setProgress({ phase: 'certifying', percent: 84, message: 'Certifying blob availability' });
      const certifyTx = flow.certify();
      const certifyResult = await signAndExecute(certifyTx);
      logDebug('walrus', 'certify transaction signed', certifyResult);

      const fileReferences = await flow.listFiles();
      const { media: storedFile, thumbnail: thumbnailFile } = await resolveStoredFileReferences({
        references: fileReferences,
        originalFile: file,
        posterFile,
        network
      });

      const uploaded: UploadedMedia = {
        blobId: storedFile.blobId,
        quiltPatchId: storedFile.id,
        walrusUrl: getWalrusFileUrl({
          blobId: storedFile.blobId,
          quiltPatchId: storedFile.id,
          network
        }),
        blobWalrusUrl: getWalrusBlobUrl(storedFile.blobId, network),
        thumbnailBlobId: thumbnailFile.blobId,
        thumbnailQuiltPatchId: thumbnailFile.id,
        thumbnailWalrusUrl: getWalrusFileUrl({
          blobId: thumbnailFile.blobId,
          quiltPatchId: thumbnailFile.id,
          network
        }),
        thumbnailFileName: posterFile?.name || file.name,
        size: file.size,
        mimeType: file.type,
        fileHash,
        fileName: file.name,
        mediaKind: getMediaKind(file.type)
      };

      setProgress({ phase: 'complete', percent: 100, message: 'Upload complete' });
      toast.success('Walrus upload complete', {
        description: uploaded.walrusUrl
      });
      return uploaded;
    },
    onError: (error) => {
      const normalized = normalizeError(error);
      setProgress({ phase: 'error', percent: 0, message: normalized.message });
      toast.error('Upload failed', { description: normalized.message });
    }
  });

  return {
    ...mutation,
    upload: mutation.mutateAsync,
    progress,
    reset
  };
}

async function resolveStoredFileReferences({
  references,
  originalFile,
  posterFile,
  network
}: {
  references: Array<{ id?: string; blobId?: string }>;
  originalFile: File;
  posterFile?: File;
  network: ReturnType<typeof useWalletNetwork>['network'];
}): Promise<ResolvedStoredFileReferences> {
  const validReferences = references.filter(isStoredWalrusFileReference);
  if (validReferences.length === 0) {
    throw new Error('Walrus upload completed without file references.');
  }

  if (!posterFile) {
    const [reference] = validReferences;
    return { media: reference, thumbnail: reference };
  }

  const inspected = await Promise.all(
    validReferences.map(async (reference) => ({
      reference,
      headers: await inspectWalrusPatch(reference, network)
    }))
  );

  const media = inspected.find(({ headers }) => headers.contentType.startsWith(originalFile.type))
    ?? inspected.find(({ headers }) => headers.identifier === originalFile.name)
    ?? inspected.find(({ headers }) => headers.contentType.startsWith('video/'));

  const thumbnail = inspected.find(({ headers }) => headers.contentType.startsWith('image/'))
    ?? inspected.find(({ headers }) => headers.identifier === posterFile.name);

  if (!media) {
    throw new Error('Walrus upload completed, but the original video patch could not be identified.');
  }

  if (!thumbnail) {
    throw new Error('Walrus upload completed, but the generated poster image patch could not be identified.');
  }

  if (media.reference.id === thumbnail.reference.id) {
    throw new Error('Walrus upload returned the same patch for video and poster.');
  }

  logDebug('walrus', 'resolved quilt patches', {
    media: media.headers,
    thumbnail: thumbnail.headers
  });

  return {
    media: media.reference,
    thumbnail: thumbnail.reference
  };
}

function isStoredWalrusFileReference(value: { id?: string; blobId?: string }): value is StoredWalrusFileReference {
  return typeof value.id === 'string' && value.id.length > 0 && typeof value.blobId === 'string' && value.blobId.length > 0;
}

async function inspectWalrusPatch(reference: StoredWalrusFileReference, network: ReturnType<typeof useWalletNetwork>['network']): Promise<{ contentType: string; identifier: string | null }> {
  const url = getWalrusFileUrl({
    blobId: reference.blobId,
    quiltPatchId: reference.id,
    network
  });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const response = await fetch(url, { method: 'HEAD', cache: 'no-store' });
      if (response.ok) {
        return {
          contentType: response.headers.get('content-type')?.toLowerCase() || '',
          identifier: response.headers.get('x-quilt-patch-identifier')
        };
      }
    } catch (error) {
      logDebug('walrus', 'patch inspection failed', { attempt, url, error: normalizeError(error).message });
    }
    await delay(500 * (attempt + 1));
  }

  throw new Error('Walrus upload completed, but patch metadata could not be verified.');
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function createVideoPosterFile(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = url;
    video.load();

    await waitForVideoMetadata(video);
    video.currentTime = Number.isFinite(video.duration) && video.duration > 0 ? Math.min(0.2, video.duration / 20) : 0;
    await waitForVideoSeek(video);

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) {
      throw new Error('Video metadata does not include dimensions.');
    }

    const canvas = document.createElement('canvas');
    const maxWidth = 1280;
    const scale = Math.min(1, maxWidth / width);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not create video poster canvas.');
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((nextBlob) => {
        if (nextBlob) {
          resolve(nextBlob);
        } else {
          reject(new Error('Could not encode video poster image.'));
        }
      }, 'image/jpeg', 0.88);
    });

    return new File([blob], getPosterFileName(file.name), { type: 'image/jpeg' });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function waitForVideoMetadata(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error('Could not load video metadata for poster generation.'));
  });
}

function waitForVideoSeek(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    video.onseeked = () => resolve();
    video.onerror = () => reject(new Error('Could not seek video for poster generation.'));
  });
}

function getPosterFileName(fileName: string): string {
  const index = fileName.lastIndexOf('.');
  const base = index > 0 ? fileName.slice(0, index) : fileName;
  return `${base}-poster.jpg`;
}
