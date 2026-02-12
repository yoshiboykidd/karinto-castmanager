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
      // 1. 管理画面内ならアラートを出さない
      if (pathname.startsWith('/admin')) {
        setIsAlertOpen(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const loginId = user.email?.split('@')[0] || '';
      
      // 2. プロフィール情報を取得（roleも含める）
      const { data: profile } = await supabase
        .from('cast_members')
        .select('password, role, display_name')
        .eq('login_id', loginId)
        .single();

      if (!profile) return;

      // 👑 管理者ならアラートを出さない
      if (profile.role === 'admin' || profile.role === 'developer') {
        setIsAlertOpen(false);
        return;
      }

      // 👗 キャストかつ初期パスワードならアラート
      if (profile.password === '0000' || profile.password === 'managed_by_supabase') {
        setIsAlertOpen(true);
      } else {
        setIsAlertOpen(false);
      }
    };

    checkUser();
  }, [pathname, supabase]);

  return (
    <html lang="ja">
      <body className="antialiased text-slate-900">
        {children}
        {isAlertOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-[340px] text-center shadow-2xl">
              <div className="text-5xl mb-4">⚠️</div>
              <h2 className="text-xl font-black mb-2 tracking-tighter text-slate-800">Security Alert</h2>
              <p className="text-xs font-bold text-slate-400 mb-8 leading-relaxed">初期パスワードを変更してください。</p>
              <div className="space-y-3">
                <button onClick={() => { setIsAlertOpen(false); router.push('/mypage'); }} className="w-full py-4 bg-rose-500 text-white font-black rounded-2xl">今すぐ変更</button>
                <button onClick={() => setIsAlertOpen(false)} className="w-full py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">後で設定</button>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}