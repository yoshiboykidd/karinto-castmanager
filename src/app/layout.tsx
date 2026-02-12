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
    const checkUserStatus = async () => {
      if (pathname.startsWith('/admin')) {
        setIsAlertOpen(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const loginId = user.email?.split('@')[0] || '';
      
      // 名前(display_name)と役職(role)をセットで取得
      const { data: profile } = await supabase
        .from('cast_members')
        .select('password, display_name, role')
        .eq('login_id', loginId)
        .single();

      if (!profile) return;

      // 管理者はアラート対象外
      if (profile.role === 'admin' || profile.role === 'developer') {
        setIsAlertOpen(false);
        return;
      }

      if (profile.password === '0000' || profile.password === 'managed_by_supabase') {
        setIsAlertOpen(true);
      } else {
        setIsAlertOpen(false);
      }
    };

    checkUserStatus();
  }, [pathname, supabase]);

  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
        {isAlertOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-[40px] p-8 w-full max-w-[340px] text-center shadow-2xl">
              <h2 className="text-xl font-black mb-4">初期パスワード変更</h2>
              <div className="space-y-3">
                <button onClick={() => { setIsAlertOpen(false); router.push('/mypage'); }} className="w-full py-4 bg-pink-500 text-white font-black rounded-2xl">変更する</button>
                <button onClick={() => setIsAlertOpen(false)} className="w-full py-3 text-gray-400 font-bold text-xs">後で設定</button>
              </div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}