'use client';

import Confetti from 'confetti-react';
import { Coins, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useMintNFT } from '@/hooks/useMintNFT';
import { useWalletNetwork } from '@/hooks/useWalletNetwork';
import type { MintResult, UploadedMedia } from '@/types/nft';

export function MintPanel({ uploaded }: { uploaded?: UploadedMedia }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [lastMint, setLastMint] = useState<MintResult>();
  const { network } = useWalletNetwork();
  const { mint, isPending, packageId } = useMintNFT();

  async function handleMint() {
    if (!uploaded) return;
    const result = await mint({
      name,
      description,
      imageBlobId: uploaded.blobId,
      mediaType: uploaded.mimeType,
      fileHash: uploaded.fileHash,
      quiltId: uploaded.quiltId,
      fileName: uploaded.fileName
    });
    setLastMint(result);
  }

  return (
    <Card className="relative overflow-hidden">
      {lastMint ? <Confetti recycle={false} numberOfPieces={280} className="pointer-events-none fixed inset-0 z-50 h-screen w-screen" /> : null}
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-secondary" />
          Mint NFT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input id="nft-name" name="nft-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="NFT name" maxLength={80} />
        <Textarea id="nft-description" name="nft-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" maxLength={500} />
        <Button type="button" onClick={handleMint} disabled={!uploaded || !name || !description || isPending || !packageId} className="w-full">
          <Sparkles className="h-4 w-4" />
          {isPending ? 'Minting...' : 'Mint Owned Object NFT'}
        </Button>
        {!packageId ? <p className="text-sm text-destructive">Set the {network} package id environment variable before minting on this network.</p> : null}
        {lastMint ? <p className="break-all text-xs text-muted-foreground">Minted object: {lastMint.objectId}</p> : null}
      </CardContent>
    </Card>
  );
}
