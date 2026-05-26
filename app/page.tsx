'use client';

import { motion } from 'framer-motion';
import { DatabaseZap, ShieldCheck, Waves } from 'lucide-react';
import { useState } from 'react';
import { MintPanel } from '@/components/mint-panel';
import { NFTList } from '@/components/nft-list';
import { UploadZone } from '@/components/upload-zone';
import { WalletBar } from '@/components/wallet-bar';
import { useWalrusUpload } from '@/hooks/useWalrusUpload';
import type { UploadedMedia } from '@/types/nft';

export default function HomePage() {
  const [uploaded, setUploaded] = useState<UploadedMedia>();
  const upload = useWalrusUpload();

  async function handleUpload(file: File) {
    const result = await upload.upload(file);
    setUploaded(result);
    return result;
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="cyber-grid pointer-events-none absolute inset-0 h-[34rem]" />
      <div className="container relative z-10 space-y-10 py-6 md:py-8">
        <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-primary">Walrus + Sui</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-white md:text-5xl">Walrus NFT Media Vault</h1>
          </div>
          <WalletBar />
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex min-h-[24rem] flex-col justify-between rounded-lg border border-white/10 bg-black/25 p-6 shadow-glow backdrop-blur md:p-8">
            <div>
              <h2 className="max-w-3xl text-3xl font-black leading-tight md:text-6xl">Store high-fidelity NFT media where the front end can live too.</h2>
              <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
                Upload rich media to Walrus through the official relay flow, mint an owned Sui NFT with the certified Blob ID, then render the media directly from decentralized storage.
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <HeroStat icon={<Waves className="h-5 w-5" />} label="Walrus relay upload" />
              <HeroStat icon={<ShieldCheck className="h-5 w-5" />} label="Owned object NFT" />
              <HeroStat icon={<DatabaseZap className="h-5 w-5" />} label="Static Walrus Site" />
            </div>
          </motion.div>
          <MintPanel uploaded={uploaded} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
          <UploadZone uploaded={uploaded} progress={upload.progress} isUploading={upload.isPending} onUpload={handleUpload} />
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-bold">Media pipeline state</h2>
            <div className="mt-5 space-y-3 text-sm">
              {['Validate MIME and size', 'SHA-256 hash', 'Register Walrus blob', 'Relay upload', 'Certify availability', 'Mint Sui NFT'].map((step, index) => (
                <div key={step} className="flex items-center justify-between rounded-md bg-black/20 px-3 py-2">
                  <span>{step}</span>
                  <span className="font-mono text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-secondary">Vault</p>
              <h2 className="mt-1 text-2xl font-bold">My NFTs</h2>
            </div>
          </div>
          <NFTList />
        </section>
      </div>
    </main>
  );
}

function HeroStat({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-16 items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-4">
      <span className="text-primary">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
