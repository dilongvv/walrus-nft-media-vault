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

export const DEFAULT_GRAPHQL_BY_NETWORK: Record<SuiNetwork, string> = {
  testnet: 'https://graphql.testnet.sui.io/graphql',
  mainnet: 'https://graphql.mainnet.sui.io/graphql'
};

export const DEFAULT_FALLBACK_GRAPHQL_BY_NETWORK: Record<SuiNetwork, string> = {
  testnet: 'https://graphql.testnet.sui.io/graphql',
  mainnet: 'https://graphql.mainnet.sui.io/graphql'
};

export const DEFAULT_GRPC_BY_NETWORK: Record<SuiNetwork, string> = {
  testnet: 'https://fullnode.testnet.sui.io:443',
  mainnet: 'https://fullnode.mainnet.sui.io:443'
};

export const LEGACY_PACKAGE_IDS_BY_NETWORK: Record<SuiNetwork, string[]> = {
  testnet: ['0xe1a9d6bad3a9ca056336477f425f6a39a724789d26f2a82a8e8d767091ce9b51'],
  mainnet: ['0x160d4503e2377bfdca735aa757fe5df0d62817de010d1b34b901fa0f3ea7d6ec']
};
