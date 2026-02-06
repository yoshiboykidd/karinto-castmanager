'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

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

// ポップアップ制御用コンポーネント
function PasswordAlertChecker() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // URLに ?alert_password=true があればポップアップを表示
    if (searchParams.get('alert_password') === 'true') {
      setShowAlert(true);
    }
  }, [searchParams]);

  if (!showAlert) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-300 relative border-2 border-pink-100">
        
        {/* アイコン */}
        <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4 mx-auto">
          <AlertTriangle className="w-6 h-6 text-rose-500" />
        </div>

        {/* テキスト */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-black text-gray-800 mb-2">
            パスワードを変更してください
          </h2>
          <p className="text-sm text-gray-500 leading-relaxed font-medium">
            現在のパスワードは初期設定の<br/>
            <span className="font-bold text-rose-500 mx-1">0000</span>のままです。<br/>
            セキュリティのため変更をお願いします。
          </p>
        </div>

        {/* ボタンエリア */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push('/profile')} 
            className="w-full bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>今すぐ変更する</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => setShowAlert(false)}
            className="w-full bg-gray-50 text-gray-400 font-bold py-3 rounded-xl hover:bg-gray-100 active:scale-95 transition-all text-xs"
          >
            あとでする
          </button>
        </div>

      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      {/* ダッシュボード本体 */}
      <DashboardContent />
      
      {/* パスワード警告監視くん (本体の上に重ねる) */}
      <PasswordAlertChecker />
    </Suspense>
  );
}