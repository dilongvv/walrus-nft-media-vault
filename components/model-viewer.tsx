'use client';

import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function LoadedModel({ src }: { src: string }) {
  const gltf = useGLTF(src);
  return <primitive object={gltf.scene} scale={1.8} position={[0, -0.8, 0]} />;
}

export function ModelViewer({ src }: { src: string; mimeType: string }) {
  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg border border-white/10 bg-black/50">
      <Suspense fallback={<Skeleton className="h-full w-full" />}>
        <Canvas camera={{ position: [2.5, 1.8, 3.2], fov: 45 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 3, 4]} intensity={1.5} />
          <LoadedModel src={src} />
          <OrbitControls enablePan={false} />
        </Canvas>
      </Suspense>
    </div>
  );
}
