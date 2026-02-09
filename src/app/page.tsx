'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight } from 'lucide-react';

// 【修正点1】
// インポートパスをエイリアス（@/）に。
// DashboardContent.tsxの中身は DailyDetail なので、名前が違っても読み込めるよう定義。
const DashboardContent = dynamic(() => import('@/components/DashboardContent'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDFE]">
      <div className="font-black text-pink-200 animate-pulse text-4xl italic tracking-tighter">
        KARINTO...
      </div>
    </div>
  )
});

function PasswordAlertChecker() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    if (searchParams.get('alert_password') === 'true') {
      setShowAlert(true);
    }
  }, [searchParams]);

  if (!showAlert) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border-2 border-pink-100">
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
        </div>
        <div className="text-center mb-6">
          <h2 className="text-lg font-black text-gray-800 mb-2">パスワードを変更してください</h2>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            現在のパスワードは初期設定の<span className="font-bold text-rose-500 mx-1">0000</span>のままです。
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => router.push('/profile')} className="w-full bg-rose-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2">
            <span>今すぐ変更する</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => setShowAlert(false)} className="w-full bg-gray-50 text-gray-400 font-bold py-3 rounded-xl text-xs">
            あとでする
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  // クライアントサイドでのみ実行するためのハイドレーション対策
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const today = new Date();

  return (
    <Suspense fallback={null}>
      <main className="min-h-screen bg-[#FFFDFE]">
        {/* 【修正点2：重要】
            DashboardContent.tsx (DailyDetail) が絶対に必要としている 
            date, dayNum, reservations を渡します。
            これで「真っ白」と「波線」の両方が解消されます。
        */}
        <DashboardContent 
          date={today} 
          dayNum={today.getDate()} 
          reservations={[]} 
        />
        
        <PasswordAlertChecker />
      </main>
    </Suspense>
  );
}