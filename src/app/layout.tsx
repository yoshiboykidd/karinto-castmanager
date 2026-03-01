'use client';

import { useState, useEffect } from 'react';
// 📍 修正：共通クライアントをインポートするように変更 [cite: 2026-02-04, 2026-02-20]
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  // 📍 修正：共通クライアントを使用。URLやKeyの記述は不要になります [cite: 2026-02-20]
  const supabase = createClient();
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const checkUserStatus = async () => {
    // 管理画面内ならアラートを出さない
    if (pathname.startsWith('/admin')) {
      setIsAlertOpen(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rawId = user.email?.split('@')[0] || '';
    
    // password だけでなく display_name と role も取得
    const { data } = await supabase
      .from('cast_members')
      .select('password, display_name, role')
      .in('login_id', [rawId, String(Number(rawId))])
      .limit(1);

    const profile = data?.[0];

    // 管理者の場合はアラートを強制停止
    if (profile?.role === 'admin' || profile?.role === 'developer') {
      setIsAlertOpen(false);
      return;
    }

    const pw = profile?.password;
    if (!pw || String(pw) === '0000' || String(pw) === 'managed_by_supabase') {
      setIsAlertOpen(true);
    } else {
      setIsAlertOpen(false);
    }
  };

  useEffect(() => {
    checkUserStatus();
  }, [pathname]);

  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
        {isAlertOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="relative bg-white rounded-[40px] p-8 w-full max-w-[340px] text-center shadow-2xl border border-gray-100 animate-in zoom-in duration-300">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-black mb-2 text-gray-800 tracking-tighter">Security Alert</h2>
              <p className="text-xs font-bold text-gray-400 mb-8 leading-relaxed">
                初期パスワードのままです。<br />安全のため変更してください。
              </p>
              <div className="space-y-3">
                <button onClick={() => { setIsAlertOpen(false); router.push('/mypage'); }} className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all">今すぐ変更する</button>
                <button onClick={() => setIsAlertOpen(false)} className="w-full py-3 text-gray-400 font-black text-xs active:scale-95 transition-all">後で設定する</button>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}