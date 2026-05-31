'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ExternalLink, Share2 } from 'lucide-react';
import { CopyButton } from '@/components/copy-button';
import { MediaRenderer } from '@/components/media-renderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WalletBar } from '@/components/wallet-bar';
import { useNFT } from '@/hooks/useOwnedNFTs';
import { getWalAppLink, truncateAddress } from '@/lib/utils';

export function NFTDetailClient({ objectId: providedObjectId }: { objectId?: string }) {
  const pathname = usePathname();
  const objectId = providedObjectId || decodeURIComponent(pathname.split('/').filter(Boolean).at(-1) || '');
  const { data, isLoading, isError, error } = useNFT(objectId);
  const shareUrl = typeof window === 'undefined' ? '' : window.location.href;

  return (
    <main className="min-h-screen">
      <div className="container space-y-8 py-6 md:py-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Button asChild variant="ghost">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>
          <WalletBar />
        </header>

        {!objectId || objectId === 'preview' ? (
          <Card>
            <CardHeader>
              <CardTitle>NFT detail shell</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Open a minted NFT detail link to load its object data from Sui.</CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-12 w-96" />
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-52 w-full" />
          </div>
        ) : isError ? (
          <Card className="border-destructive/40 bg-destructive/10">
            <CardHeader>
              <CardTitle className="text-destructive">Unable to load NFT</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{error.message}</CardContent>
          </Card>
        ) : data ? (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-4">
              <h1 className="text-3xl font-black md:text-5xl">{data.name}</h1>
              <MediaRenderer src={data.walrusUrl} posterSrc={data.thumbnailWalrusUrl} mimeType={data.mediaType} kind={data.mediaKind} title={data.name} />
            </section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  NFT Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <p className="text-sm text-muted-foreground">{data.description}</p>
                <Meta label="NFT Object ID" value={data.objectId} />
                <Meta label="Blob ID" value={data.imageBlobId} />
                <Meta label="Walrus URL" value={data.walrusUrl} />
                <Meta label="Thumbnail URL" value={data.thumbnailWalrusUrl} />
                <Meta label="MIME type" value={data.mediaType} />
                <Meta label="File hash" value={data.fileHash} />
                <Meta label="Created" value={new Date(data.createdAt).toLocaleString()} />
                <div className="flex flex-wrap gap-2">
                  <CopyButton value={data.objectId} label="Copy Object" />
                  <CopyButton value={data.imageBlobId} label="Copy Blob" />
                  <CopyButton value={data.walrusUrl} label="Copy Media URL" />
                  <CopyButton value={data.thumbnailWalrusUrl} label="Copy Thumbnail" />
                  {shareUrl ? <CopyButton value={shareUrl} label="Copy Share" /> : null}
                  <Button asChild variant="secondary" size="sm">
                    <a href={data.walrusUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open media
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={getWalAppLink(data.imageBlobId)} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      wal.app
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="break-all font-mono text-sm">{label.includes('ID') ? truncateAddress(value, 12) : value}</div>
    </div>
  );
}
