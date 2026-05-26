'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { MediaRenderer } from '@/components/media-renderer';
import { Card, CardContent } from '@/components/ui/card';
import { truncateAddress } from '@/lib/utils';
import type { VaultNFT } from '@/types/nft';

export function NFTCard({ nft }: { nft: VaultNFT }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
      <Card className="h-full overflow-hidden">
        <div className="p-3">
          <MediaRenderer src={nft.walrusUrl} mimeType={nft.mediaType} kind={nft.mediaKind} title={nft.name} />
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
