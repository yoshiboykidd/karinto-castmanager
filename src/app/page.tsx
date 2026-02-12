'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function HomePage() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  const [displayName, setDisplayName] = useState<string>('取得中...');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ログインメール(00600037@...)からIDを抽出
      const rawId = user.email?.split('@')[0] || ''; 

      // UUIDではなく、もともと使っていた login_id で名前(display_name)を取得
      const { data } = await supabase
        .from('cast_members')
        .select('display_name')
        .eq('login_id', rawId)
        .single();

      if (data?.display_name) {
        setDisplayName(data.display_name);
      } else {
        setDisplayName(`未登録(ID:${rawId})`);
      }
    };
    fetchProfile();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#FFF5F7] p-6 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-xl border border-pink-50 text-center text-slate-800 font-sans">
        <h1 className="text-3xl font-black tracking-tighter mb-2">
          {displayName} <span className="text-lg font-bold text-slate-400">さん</span>
        </h1>
        <div className="mt-8 pt-8 border-t border-pink-50">
          <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest leading-none">
            Karinto Management System
          </p>
        </div>
      </div>
    </div>
  );
}