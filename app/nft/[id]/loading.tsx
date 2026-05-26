import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="container min-h-screen py-8">
      <Skeleton className="h-12 w-80" />
      <Skeleton className="mt-8 aspect-video w-full" />
      <Skeleton className="mt-6 h-56 w-full" />
    </main>
  );
}
