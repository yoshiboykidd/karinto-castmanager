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

      const rawId = user.email?.split('@')[0] || ''; 

      // データベースから「名前」を取得
      const { data } = await supabase
        .from('cast_members')
        .select('display_name')
        .eq('login_id', rawId)
        .maybeSingle();

      if (data?.display_name) {
        setDisplayName(data.display_name);
      } else {
        setDisplayName(`未登録(ID:${rawId})`);
      }
    };
    fetchProfile();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#FFF5F7] p-6 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-xl border border-pink-50 text-center">
        <div className="mb-4">
          <span className="bg-pink-50 text-pink-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
            Cast Profile
          </span>
        </div>
        
        {/* ★ ここに名前が表示されます */}
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">
          {displayName} <span className="text-lg font-bold text-slate-400">さん</span>
        </h1>
        
        <div className="mt-8 pt-8 border-t border-pink-50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            今日も一日お疲れ様です 🌸
          </p>
        </div>
      </div>
    </div>
  );
}