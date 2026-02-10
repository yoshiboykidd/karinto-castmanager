'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname(); // 画面遷移を検知するために使用
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // パスワードチェック関数
  const checkPassword = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rawId = user.email?.split('@')[0] || '';
    const { data } = await supabase
      .from('cast_members')
      .select('password')
      .in('login_id', [rawId, String(Number(rawId))])
      .limit(1);

    const pw = data?.[0]?.password;

    // 「0000」または「読み取り不可」ならアラートを出す
    if (!pw || String(pw) === '0000' || String(pw) === 'managed_by_supabase') {
      setIsAlertOpen(true);
    } else {
      setIsAlertOpen(false);
    }
  };

  // 初回ロード時 ＋ 画面遷移（pathname変更）のたびにチェック
  useEffect(() => {
    checkPassword();
  }, [pathname]); 

  return (
    <html lang="ja">
      <body className="antialiased">
        {children}

        {/* --- シンプルな中央アラート --- */}
        {isAlertOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* 背景：真っ黒ではなく少し透かすことで「アプリ感」を出します */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            
            {/* 白い箱：ここが中央に出ます */}
            <div className="relative bg-white rounded-[32px] p-8 w-[85%] max-w-[320px] text-center shadow-2xl border border-gray-100">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-black mb-2 text-gray-800">セキュリティ警告</h2>
              <p className="text-sm text-gray-500 font-bold mb-6 leading-relaxed">
                初期パスワードのままです。<br />変更してください。
              </p>
              
              <button
                onClick={() => {
                  setIsAlertOpen(false);
                  router.push('/mypage');
                }}
                className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl active:scale-95 transition-transform"
              >
                設定画面へ移動する
              </button>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}