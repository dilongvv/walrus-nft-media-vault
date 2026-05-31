'use client';

import { UploadCloud, FileCheck2, Link2, Hash, ExternalLink } from 'lucide-react';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { MediaRenderer } from '@/components/media-renderer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { formatBytes, getWalAppLink } from '@/lib/utils';
import type { UploadedMedia, UploadProgress } from '@/types/nft';

export function UploadZone({
  uploaded,
  progress,
  isUploading,
  onUpload
}: {
  uploaded?: UploadedMedia;
  progress: UploadProgress;
  isUploading: boolean;
  onUpload: (file: File) => Promise<UploadedMedia>;
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const [file] = acceptedFiles;
      if (file) void onUpload(file);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    multiple: false,
    accept: {
      'image/*': [],
      'video/*': [],
      'audio/*': [],
      'model/gltf-binary': ['.glb'],
      'model/gltf+json': ['.gltf']
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadCloud className="h-5 w-5 text-primary" />
          Upload Media
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div
          {...getRootProps()}
          className={`flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition ${
            isDragActive ? 'border-primary bg-primary/10' : 'border-white/20 bg-white/[0.03] hover:bg-white/[0.06]'
          }`}
        >
          <input {...getInputProps({ id: 'media-file', name: 'media-file' })} />
          <UploadCloud className="mb-4 h-12 w-12 text-primary" />
          <p className="text-lg font-semibold">Drop rich media here</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">Images, video, audio, GLB, and GLTF files up to 50MB are hashed locally before upload.</p>
          <Button type="button" onClick={open} disabled={isUploading} className="mt-5">
            <UploadCloud className="h-4 w-4" />
            Select File
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{progress.message}</span>
            <span className="font-mono text-primary">{progress.percent}%</span>
          </div>
          <Progress value={progress.percent} />
        </div>

        {uploaded ? (
          <div className="space-y-4 rounded-lg border border-white/10 bg-black/20 p-4 text-sm">
            <MediaRenderer src={uploaded.walrusUrl} posterSrc={uploaded.thumbnailWalrusUrl} mimeType={uploaded.mimeType} kind={uploaded.mediaKind} title={uploaded.fileName} />
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="secondary">
                <a href={uploaded.walrusUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Open media
                </a>
              </Button>
            </div>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Info icon={<FileCheck2 className="h-4 w-4" />} label="Blob ID" value={uploaded.blobId} />
              <Info icon={<FileCheck2 className="h-4 w-4" />} label="Quilt Patch ID" value={uploaded.quiltPatchId || 'N/A'} />
              <Info icon={<FileCheck2 className="h-4 w-4" />} label="Thumbnail Blob ID" value={uploaded.thumbnailBlobId} />
              <Info icon={<FileCheck2 className="h-4 w-4" />} label="Thumbnail Patch ID" value={uploaded.thumbnailQuiltPatchId || 'N/A'} />
              <Info icon={<Link2 className="h-4 w-4" />} label="Media URL" value={uploaded.walrusUrl} wide />
              <Info icon={<Link2 className="h-4 w-4" />} label="Thumbnail URL" value={uploaded.thumbnailWalrusUrl} wide />
              <Info icon={<Link2 className="h-4 w-4" />} label="Blob URL" value={uploaded.blobWalrusUrl} wide />
              <Info icon={<Link2 className="h-4 w-4" />} label="wal.app" value={getWalAppLink(uploaded.blobId)} />
              <Info label="Size" value={formatBytes(uploaded.size)} />
              <Info label="MIME" value={uploaded.mimeType} />
              <Info icon={<Hash className="h-4 w-4" />} label="SHA-256" value={uploaded.fileHash} wide />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Info({ label, value, icon, wide }: { label: string; value: string; icon?: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'sm:col-span-2' : undefined}>
      <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="break-all font-mono text-xs text-foreground">{value}</div>
    </div>
  );
}
