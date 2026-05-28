import { SuiGrpcClient } from '@mysten/sui/grpc';
import { DEFAULT_NETWORK, WALRUS_EPOCHS, type SuiNetwork } from '@/constants/config';
import { getGrpcUrl } from '@/lib/sui-client';
import { getWalrusPublisherUrlForNetwork } from '@/lib/utils';

export async function createWalrusClient(network: SuiNetwork = DEFAULT_NETWORK) {
  const { walrus } = await import('@mysten/walrus');
  return new SuiGrpcClient({
    network,
    baseUrl: getGrpcUrl(network)
  }).$extend(
    walrus({
      uploadRelay: {
        host: getWalrusPublisherUrlForNetwork(network),
        sendTip: {
          max: 100_000_000
        }
      }
    })
  );
}

export async function createWalrusFile(file: File, fileHash: string) {
  const { WalrusFile } = await import('@mysten/walrus');
  return WalrusFile.from({
    contents: file,
    identifier: file.name,
    tags: {
      'content-type': file.type,
      'file-name': file.name,
      'sha256': fileHash
    }
  });
}

export { WALRUS_EPOCHS };
