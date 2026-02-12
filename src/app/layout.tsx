'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation';
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const checkPassword = async () => {
    // 👑 管理画面（/admin）にいる時は何もしない
    if (pathname.startsWith('/admin')) {
      setIsAlertOpen(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const rawId = user.email?.split('@')[0] || '';
    const { data } = await supabase
      .from('cast_members')
      .select('password, role')
      .in('login_id', [rawId, String(Number(rawId))])
      .limit(1);

    const profile = data?.[0];

    // 👑 管理者ならアラートを出さない
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
    checkPassword();
  }, [pathname]);

  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
        {isAlertOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div className="relative bg-white rounded-[40px] p-8 w-full max-w-[340px] text-center shadow-2xl">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-black mb-2 text-gray-800">Security Alert</h2>
              <p className="text-xs font-bold text-gray-400 mb-8">初期パスワードを変更してください。</p>
              <div className="space-y-3">
                <button onClick={() => { setIsAlertOpen(false); router.push('/mypage'); }} className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl shadow-lg">今すぐ変更</button>
                <button onClick={() => setIsAlertOpen(false)} className="w-full py-3 text-gray-400 font-black text-xs">後で設定</button>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}