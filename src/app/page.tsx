'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// ssr: false にすることで、サーバーとクライアントの「時刻のズレ」によるエラーを物理的に消滅させます
const DashboardContent = dynamic(() => import('@/components/DashboardContent'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDFE]">
      <div className="font-black text-pink-200 animate-pulse text-4xl italic">KARINTO...</div>
    </div>
  )
});

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DashboardContent />
    </Suspense>
  );
}