'use client';

import { ImageOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NFTCard } from '@/components/nft-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useOwnedNFTs } from '@/hooks/useOwnedNFTs';

export function NFTList() {
  const { data, isLoading, isError, error, refetch, isFetching } = useOwnedNFTs();

  if (isLoading) {
    return (
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-80" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6">
        <p className="font-semibold text-destructive">Unable to load NFTs</p>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button type="button" onClick={() => void refetch()} className="mt-4" variant="outline">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] p-8 text-center">
        <ImageOff className="mb-3 h-10 w-10 text-muted-foreground" />
        <p className="font-semibold">No vault NFTs yet</p>
        <p className="mt-2 text-sm text-muted-foreground">Upload a media file and mint your first owned object NFT.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.map((nft) => (
          <NFTCard key={nft.objectId} nft={nft} />
        ))}
      </div>
    </div>
  );
}
