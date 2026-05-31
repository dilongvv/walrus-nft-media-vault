# Walrus NFT Media Vault

Walrus NFT Media Vault is a production-ready Sui + Walrus dApp for decentralized rich-media NFT storage. It uploads images, video, audio, GLB, and GLTF files to Walrus with the official Upload Relay flow, then mints Sui owned-object NFTs whose metadata references the certified Walrus Blob ID.

## Stack

- Next.js App Router, TypeScript strict mode, Tailwind CSS, shadcn-style UI primitives
- `@mysten/dapp-kit`, `@mysten/sui`, `@mysten/walrus`, TanStack Query
- Sui Core API data layer: GraphQL primary, gRPC fallback for reads and transaction execution
- Walrus Upload Relay with `writeFilesFlow`
- Sui Move owned-object NFT package with `Display<NFT>` metadata for wallet rendering
- Static export for Walrus Sites and Vercel

## Project Structure

```text
app/
  nft/[id]/
  globals.css
  layout.tsx
  page.tsx
components/
constants/
hooks/
  useMintNFT.ts
  useOwnedNFTs.ts
  useSuiTransactionExecutor.ts
  useWalletNetwork.ts
  useWalrusUpload.ts
lib/
  nft.ts
  sui-client.ts
  transactions.ts
  utils.ts
  walrus.ts
move/
  Move.toml
  sources/display.move
  sources/nft.move
providers/
public/ws-resources.json
scripts/
types/
walrus.json
vercel.json
```

## Environment

Copy the sample file and fill in values:

```bash
cp .env.example .env.local
```

Required variables:

```bash
NEXT_PUBLIC_SUI_NETWORK=mainnet
NEXT_PUBLIC_SUI_GRAPHQL_URL=https://graphql.mainnet.sui.io/graphql
NEXT_PUBLIC_SUI_FALLBACK_GRAPHQL_URL=https://graphql.mainnet.sui.io/graphql
NEXT_PUBLIC_SUI_GRPC_URL=https://fullnode.mainnet.sui.io:443
NEXT_PUBLIC_SUI_WALLET_RPC_URL=https://fullnode.mainnet.sui.io:443
NEXT_PUBLIC_SUI_FALLBACK_WALLET_RPC_URL=https://sui-rpc.publicnode.com
NEXT_PUBLIC_MAINNET_SUI_GRAPHQL_URL=https://graphql.mainnet.sui.io/graphql
NEXT_PUBLIC_MAINNET_SUI_FALLBACK_GRAPHQL_URL=https://graphql.mainnet.sui.io/graphql
NEXT_PUBLIC_MAINNET_SUI_GRPC_URL=https://fullnode.mainnet.sui.io:443
NEXT_PUBLIC_MAINNET_SUI_WALLET_RPC_URL=https://fullnode.mainnet.sui.io:443
NEXT_PUBLIC_MAINNET_SUI_FALLBACK_WALLET_RPC_URL=https://sui-rpc.publicnode.com
NEXT_PUBLIC_TESTNET_SUI_GRAPHQL_URL=https://graphql.testnet.sui.io/graphql
NEXT_PUBLIC_TESTNET_SUI_FALLBACK_GRAPHQL_URL=https://graphql.testnet.sui.io/graphql
NEXT_PUBLIC_TESTNET_SUI_GRPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_TESTNET_SUI_WALLET_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_TESTNET_SUI_FALLBACK_WALLET_RPC_URL=https://sui-testnet-rpc.publicnode.com
NEXT_PUBLIC_MAINNET_WALRUS_PUBLISHER_URL=https://upload-relay.mainnet.walrus.space
NEXT_PUBLIC_TESTNET_WALRUS_PUBLISHER_URL=https://upload-relay.testnet.walrus.space
NEXT_PUBLIC_MAINNET_PACKAGE_ID=
NEXT_PUBLIC_TESTNET_PACKAGE_ID=
```

The app defaults to `mainnet`, and the top-right network switcher selects the matching package id, GraphQL endpoint, gRPC endpoint, wallet compatibility RPC endpoint, and Walrus relay at runtime. Wallet RPC variables are kept only for `@mysten/dapp-kit` wallet provider compatibility; app reads and transaction execution use GraphQL/gRPC.

## Install And Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Move Build And Publish

Install the Sui CLI and configure a funded testnet address:

```bash
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
sui client switch --env testnet
sui client faucet
npm run move:build
./scripts/publish-move.sh
```

The publish command prints JSON. Copy the created package id into `.env.local`:

```bash
NEXT_PUBLIC_TESTNET_PACKAGE_ID=0x...
NEXT_PUBLIC_MAINNET_PACKAGE_ID=0x...
```

Restart the dev server after changing `.env.local`.

## Walrus Upload Flow

The browser validates MIME type and size, calculates a SHA-256 hash, wraps the file with `WalrusFile.from`, and uploads through:

1. `writeFilesFlow({ files })`
2. `flow.encode()`
3. wallet-signed `flow.register(...)` prepared through GraphQL and executed through Sui Core API
4. `flow.upload({ digest })`
5. wallet-signed `flow.certify()` prepared through GraphQL and executed through Sui Core API
6. `flow.listFiles()` to obtain the Blob ID

No application backend is used. For video uploads, the browser also extracts a JPEG poster frame and uploads it in the same Walrus quilt. The NFT stores both the original media patch and the thumbnail patch so wallets can index a real image while the dApp still opens the video.

## NFT Mint Flow

After upload, the dApp builds a PTB with `Transaction` and calls:

```text
<PACKAGE_ID>::nft::mint(
  name,
  description,
  image_blob_id,
  quilt_patch_id,
  file_name,
  thumbnail_blob_id,
  thumbnail_quilt_patch_id,
  thumbnail_file_name,
  media_type,
  file_hash,
  clock
)
```

The hook builds the PTB with `Transaction`, resolves it against Sui GraphQL, asks the connected wallet to sign the resolved transaction JSON, executes the signed bytes through GraphQL with gRPC fallback, then extracts the created NFT object id from Core API effects.

The current mainnet package registers Sui `Display<NFT>` metadata during publish:

```text
image_url     = https://aggregator.walrus-mainnet.walrus.space/v1/blobs/by-quilt-patch-id/{thumbnail_quilt_patch_id}
animation_url = https://aggregator.walrus-mainnet.walrus.space/v1/blobs/by-quilt-patch-id/{quilt_patch_id}
media_url     = https://aggregator.walrus-mainnet.walrus.space/v1/blobs/by-quilt-patch-id/{quilt_patch_id}
link          = https://walrus-nft-media-vault.vercel.app/nft/{id}
```

For images, the thumbnail fields point to the original image. For videos, `image_url` points to the generated poster image, while `animation_url` and `media_url` point to the original Walrus video.

## Sui Data Access

- NFT list: `listOwnedObjects` through Sui GraphQL, with gRPC fallback.
- NFT detail: `getObject` through Sui GraphQL, with gRPC fallback.
- Mint execution: `executeTransaction` through Sui GraphQL, with gRPC fallback.
- Walrus register/certify execution: same Core API transaction executor.
- Wallet UI and network switching: `@mysten/dapp-kit` still receives wallet RPC URLs because the current stable wallet provider requires them for compatibility.

## Walrus Sites Deployment

Install and configure the Walrus Sites `site-builder`, then run:

```bash
npm run deploy:walrus
```

The deploy script:

```bash
npm run build
cp public/ws-resources.json out/ws-resources.json
site-builder deploy --epochs 3 out
```

`public/ws-resources.json` routes `/nft/*` to the static detail shell so object detail pages remain shareable on a decentralized static host. `walrus.json` defaults to mainnet; use `NEXT_PUBLIC_SUI_NETWORK=testnet` and the testnet package id when deploying a testnet build.

## Vercel Deployment

Recommended production workflow:

1. Push the project to GitHub.
2. In Vercel, click `Add New Project`.
3. Import the GitHub repository.
4. Set the same environment variables used in `.env.local`.
5. Deploy once from the Vercel dashboard.
6. Keep `main` as the production branch so future `git push origin main` updates redeploy automatically.

This project is configured for static export on Vercel. `vercel.json` uses:

- `npm install`
- `npm run build`
- output directory `out`
- rewrite for `/nft/:path*`

After the GitHub repository is connected, Vercel becomes the primary deployment path. Local CLI deployment is optional and mainly useful for one-off verification or debugging.

## Common Issues

- Package ID not configured: publish the Move package and set the package id for the selected network.
- Wallet rejects signing: retry the upload or mint action; no partial app state is trusted.
- Sui data unavailable: the query layer retries GraphQL, then falls back to gRPC.
- Wallet provider unavailable: check the wallet compatibility RPC variables and the selected wallet network.
- Gas insufficient: request testnet SUI from the faucet and retry.
- Unsupported file: only `image/*`, `video/*`, `audio/*`, `model/gltf-binary`, and `model/gltf+json` are accepted.
- File too large: the browser rejects files above 50MB.
- Walrus relay timeout: retry the upload; registration and certification steps are wallet-confirmed transactions.

## Verification

```bash
npm run typecheck
npm run build
npm run move:build
```
