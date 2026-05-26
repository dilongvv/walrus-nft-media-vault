'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container flex min-h-screen items-center justify-center py-8">
      <div className="max-w-xl rounded-lg border border-destructive/40 bg-destructive/10 p-6">
        <h1 className="text-xl font-bold text-destructive">NFT detail failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button type="button" onClick={reset} className="mt-5">
          Retry
        </Button>
      </div>
    </main>
  );
}
