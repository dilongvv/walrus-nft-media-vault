'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { MediaKind } from '@/types/nft';
import { Skeleton } from '@/components/ui/skeleton';

const ModelViewer = dynamic(() => import('@/components/model-viewer').then((mod) => mod.ModelViewer), {
  ssr: false,
  loading: () => <Skeleton className="aspect-video w-full" />
});

export function MediaRenderer({ src, mimeType, kind, title }: { src: string; mimeType: string; kind: MediaKind; title: string }) {
  const cacheBustedSrc = useMemo(() => src, [src]);

  if (kind === 'image') {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cacheBustedSrc} alt={title} className="h-full w-full object-contain" loading="lazy" />
      </div>
    );
  }

  if (kind === 'video') {
    return <video src={cacheBustedSrc} controls autoPlay muted loop playsInline className="aspect-video w-full rounded-lg bg-black object-contain" />;
  }

  if (kind === 'audio') {
    return (
      <div className="flex min-h-48 items-center justify-center rounded-lg border border-white/10 bg-black/40 p-6">
        <audio src={cacheBustedSrc} controls preload="metadata" className="w-full" />
      </div>
    );
  }

  if (kind === 'model') {
    return <ModelViewer src={cacheBustedSrc} mimeType={mimeType} />;
  }

  return (
    <div className="flex min-h-48 items-center justify-center rounded-lg border border-white/10 bg-black/40 p-6 text-sm text-muted-foreground">
      Unsupported preview type: {mimeType}
    </div>
  );
}
