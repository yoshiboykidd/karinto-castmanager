'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

/**
 * DashboardContent をサーバーサイドレンダリング(SSR)なしで読み込みます。
 * これにより、Vercel上での時刻のズレや祝日取得によるクラッシュを物理的に回避します。
 * * インポートパスの解説:
 * ../          <- src/app フォルダから src フォルダへ出る
 * components/  <- components フォルダへ入る
 * DashboardContent <- 目的のファイル
 */
const DashboardContent = dynamic(() => import('../components/DashboardContent'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDFE]">
      <div className="font-black text-pink-200 animate-pulse text-4xl italic tracking-tighter">
        KARINTO...
      </div>
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