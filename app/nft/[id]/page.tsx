import { NFTDetailClient } from '@/components/nft-detail-client';

export function generateStaticParams() {
  return [{ id: 'preview' }];
}

export default function NFTDetailPage() {
  return <NFTDetailClient />;
}
