# Walrus NFT Media Vault

Walrus NFT Media Vault is a production-ready Sui + Walrus dApp for decentralized rich-media NFT storage. It uploads images, video, audio, GLB, and GLTF files to Walrus with the official Upload Relay flow, then mints Sui owned-object NFTs whose metadata references the certified Walrus Blob ID.

## Stack

- Next.js App Router, TypeScript strict mode, Tailwind CSS, shadcn-style UI primitives
- `@mysten/dapp-kit`, `@mysten/sui`, `@mysten/walrus`, TanStack Query
- Walrus Upload Relay with `writeFilesFlow`
- Sui Move owned-object NFT package
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
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.mainnet.sui.io:443
NEXT_PUBLIC_SUI_FALLBACK_RPC_URL=https://sui-rpc.publicnode.com
NEXT_PUBLIC_MAINNET_WALRUS_PUBLISHER_URL=https://upload-relay.mainnet.walrus.space
NEXT_PUBLIC_TESTNET_WALRUS_PUBLISHER_URL=https://upload-relay.testnet.walrus.space
NEXT_PUBLIC_MAINNET_PACKAGE_ID=
NEXT_PUBLIC_TESTNET_PACKAGE_ID=
```

The app defaults to `mainnet`, and the top-right network switcher selects the matching package id and Walrus relay at runtime.

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
3. wallet-signed `flow.register(...)`
4. `flow.upload({ digest })`
5. wallet-signed `flow.certify()`
6. `flow.listFiles()` to obtain the Blob ID

No application backend is used.

## NFT Mint Flow

After upload, the dApp builds a PTB with `Transaction` and calls:

```text
<PACKAGE_ID>::nft::mint(name, description, image_blob_id, media_type, file_hash, clock)
```

The hook executes through `useSignAndExecuteTransaction`, requests object changes, and extracts the created NFT object id.

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

`public/ws-resources.json` routes `/nft/*` to the static detail shell so object detail pages remain shareable on a decentralized static host.

## Vercel Deployment

Set the same environment variables in Vercel, then deploy. `vercel.json` uses:

- `npm install`
- `npm run build`
- output directory `out`
- rewrite for `/nft/:path*`

## Common Issues

- Package ID not configured: publish the Move package and set the package id for the selected network.
- Wallet rejects signing: retry the upload or mint action; no partial app state is trusted.
- RPC unavailable: the query layer retries and falls back to `NEXT_PUBLIC_SUI_FALLBACK_RPC_URL`.
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
