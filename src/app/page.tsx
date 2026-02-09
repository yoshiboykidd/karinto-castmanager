'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// パスはあなたの環境に合わせて @/ に固定します
const DashboardContent = dynamic(() => import('@/components/DashboardContent'), { ssr: false });

export default function Page() {
  const today = new Date();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="min-h-screen bg-[#FFFDFE]">
        {/* これを表示して真っ白になるなら、DashboardContent.tsx 自体が壊れています */}
        <DashboardContent 
          date={today} 
          dayNum={today.getDate()} 
          reservations={[]} 
        />
      </main>
    </Suspense>
  );
}