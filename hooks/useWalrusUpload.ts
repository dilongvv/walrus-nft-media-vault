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

      setProgress({ phase: 'hashing', percent: 18, message: 'Calculating SHA-256 hash' });
      const fileHash = await sha256Hex(file);
      logDebug('walrus', 'file hash calculated', { fileHash, fileName: file.name });

      const walrusClient = await createWalrusClient(network);
      const walrusFile = await createWalrusFile(file, fileHash);
      const flow = walrusClient.walrus.writeFilesFlow({ files: [walrusFile] });

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

      const [storedFile] = await flow.listFiles() as Array<{ blobId?: string; id?: string }>;
      if (!storedFile) {
        throw new Error('Walrus upload completed without a file reference.');
      }

      const blobId = storedFile.blobId;
      if (!blobId) {
        throw new Error('Walrus upload completed without a blob ID.');
      }

      const uploaded: UploadedMedia = {
        blobId,
        quiltPatchId: storedFile.id,
        walrusUrl: getWalrusFileUrl({
          blobId,
          quiltPatchId: storedFile.id,
          network
        }),
        blobWalrusUrl: getWalrusBlobUrl(blobId, network),
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
