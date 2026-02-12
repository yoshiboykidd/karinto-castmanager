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
      // 管理画面ならアラート不要
      if (pathname.startsWith('/admin')) {
        setIsAlertOpen(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const loginId = user.email?.split('@')[0] || '';
      
      // role, password, display_nameをすべて取得
      const { data: profile } = await supabase
        .from('cast_members')
        .select('password, role, display_name')
        .eq('login_id', loginId)
        .single();

      // 管理者はアラートを出さない
      if (profile?.role === 'admin' || profile?.role === 'developer') {
        setIsAlertOpen(false);
        return;
      }

      // キャストかつ初期パスワードなら表示
      if (profile?.password === '0000') {
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
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-[340px] text-center shadow-2xl">
              <h2 className="text-xl font-black mb-4">初期パスワード変更</h2>
              <button onClick={() => { setIsAlertOpen(false); router.push('/mypage'); }} className="w-full py-4 bg-pink-500 text-white font-black rounded-2xl mb-2">変更する</button>
              <button onClick={() => setIsAlertOpen(false)} className="w-full py-3 text-gray-400 text-xs">後で設定</button>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}