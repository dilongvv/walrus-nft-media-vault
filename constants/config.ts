export const SUPPORTED_NETWORKS = ['testnet', 'mainnet'] as const;

export type SuiNetwork = (typeof SUPPORTED_NETWORKS)[number];

export const DEFAULT_NETWORK: SuiNetwork = 'mainnet';

export const SUI_CLOCK_OBJECT_ID = '0x6';
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const WALRUS_EPOCHS = 3;
export const NFT_MODULE = 'nft';
export const NFT_STRUCT = 'NFT';

export const ACCEPTED_MIME_TYPES = [
  'image/',
  'video/',
  'audio/',
  'model/gltf-binary',
  'model/gltf+json'
] as const;

export const WALRUS_AGGREGATOR_BY_NETWORK: Record<SuiNetwork, string> = {
  testnet: 'https://aggregator.walrus-testnet.walrus.space',
  mainnet: 'https://aggregator.walrus-mainnet.walrus.space'
};

export const WALRUS_UPLOAD_RELAY_BY_NETWORK: Record<SuiNetwork, string> = {
  testnet: 'https://upload-relay.testnet.walrus.space',
  mainnet: 'https://upload-relay.mainnet.walrus.space'
};

export const DEFAULT_RPC_BY_NETWORK: Record<SuiNetwork, string> = {
  testnet: 'https://fullnode.testnet.sui.io:443',
  mainnet: 'https://fullnode.mainnet.sui.io:443'
};

export const DEFAULT_FALLBACK_RPC_BY_NETWORK: Record<SuiNetwork, string> = {
  testnet: 'https://sui-testnet-rpc.publicnode.com',
  mainnet: 'https://sui-rpc.publicnode.com'
};
