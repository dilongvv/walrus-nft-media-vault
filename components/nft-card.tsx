'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink, Play } from 'lucide-react';
import { MediaRenderer } from '@/components/media-renderer';
import { Card, CardContent } from '@/components/ui/card';
import { truncateAddress } from '@/lib/utils';
import type { VaultNFT } from '@/types/nft';

export function NFTCard({ nft }: { nft: VaultNFT }) {
  const hasDedicatedThumbnail = Boolean(nft.thumbnailQuiltPatchId && nft.thumbnailQuiltPatchId !== nft.quiltPatchId);
  const shouldRenderImageCover = nft.mediaKind === 'image' || (nft.mediaKind === 'video' && hasDedicatedThumbnail);

  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="h-full overflow-hidden">
        <div className="p-3">
          {shouldRenderImageCover ? (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={nft.thumbnailWalrusUrl} alt={nft.name} className="h-full w-full object-contain" loading="lazy" />
              {nft.mediaKind === 'video' ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/30 bg-black/50 text-white shadow-glow backdrop-blur">
                    <Play className="ml-0.5 h-5 w-5 fill-current" />
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <MediaRenderer src={nft.walrusUrl} mimeType={nft.mediaType} kind={nft.mediaKind} title={nft.name} />
          )}
        </div>
        <CardContent className="space-y-3 pt-2">
          <div>
            <h3 className="line-clamp-1 font-semibold">{nft.name}</h3>
            <p className="line-clamp-2 text-sm text-muted-foreground">{nft.description}</p>
          </div>
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="font-mono">{truncateAddress(nft.objectId, 5)}</span>
            <Link href={`/nft/${nft.objectId}`} className="inline-flex items-center gap-1 text-primary hover:underline">
              Detail <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
