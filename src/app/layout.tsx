'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  useEffect(() => {
    const checkPassword = async () => {
      // 1. ログインユーザーを取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. IDを特定
      const rawId = user.email?.split('@')[0] || '';
      
      // 3. パスワードの状態をDBから直接取得
      const { data } = await supabase
        .from('cast_members')
        .select('password')
        .in('login_id', [rawId, String(Number(rawId))])
        .limit(1);

      const pw = data?.[0]?.password;

      // 4. 判定: 空、'0000'、またはブラウザの自動入力干渉(managed_by_supabase)の場合に警告
      if (!pw || String(pw) === '0000' || String(pw) === 'managed_by_supabase') {
        setIsAlertOpen(true);
      }
    };

    checkPassword();
  }, [supabase]);

  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}

        {/* 📍 画面中央の強制ポップアップ（z-index 10000で最前面に固定） */}
        {isAlertOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 animate-in fade-in duration-300">
            {/* 背景を暗くぼかす */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* ポップアップ本体 */}
            <div className="relative bg-white rounded-[40px] p-8 w-full max-w-sm shadow-2xl border-4 border-rose-400 animate-in zoom-in duration-300 text-center space-y-6">
              <div className="text-6xl animate-bounce">⚠️</div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-800 tracking-tighter uppercase">Security Alert</h2>
                <p className="text-sm font-bold text-gray-500 leading-relaxed">
                  パスワードが初期設定(0000)のままです。<br />
                  安全のため、今すぐ変更してください。
                </p>
              </div>
              
              <button
                onClick={() => {
                  setIsAlertOpen(false);
                  router.push('/mypage');
                }}
                className="w-full py-5 bg-rose-500 text-white font-black rounded-[24px] shadow-lg shadow-rose-200 active:scale-95 transition-all text-lg"
              >
                マイページで変更する ➔
              </button>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}