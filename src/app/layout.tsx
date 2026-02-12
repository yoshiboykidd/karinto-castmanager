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

  useEffect(() => {
    const checkUser = async () => {
      // 管理画面内ではアラートを表示しない
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
        .eq('login_id', rawId)
        .single();

      // 管理者・開発者はアラート対象外
      if (data?.role === 'admin' || data?.role === 'developer') {
        setIsAlertOpen(false);
        return;
      }

      // キャストで初期PWの場合のみ表示
      if (data?.password === '0000' || data?.password === 'managed_by_supabase') {
        setIsAlertOpen(true);
      } else {
        setIsAlertOpen(false);
      }
    };

    checkUser();
  }, [pathname, supabase]);

  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
        {isAlertOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-[340px] text-center shadow-2xl border border-gray-100 animate-in zoom-in duration-300">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-black mb-2 text-gray-800 tracking-tighter">Security Alert</h2>
              <p className="text-xs font-bold text-gray-400 mb-8 leading-relaxed">初期パスワードを変更してください。</p>
              <div className="space-y-3">
                <button onClick={() => { setIsAlertOpen(false); router.push('/mypage'); }} className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all">今すぐ変更する</button>
                <button onClick={() => setIsAlertOpen(false)} className="w-full py-3 text-gray-400 font-black text-xs active:scale-95 transition-all uppercase tracking-widest">後で設定する</button>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}