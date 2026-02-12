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

      const rawId = user.email?.split('@')[0] || ''; // '00600037'
      const trimmedId = rawId.replace(/^0+/, '');    // '600037' (ゼロを除去)

      // ★ '00600037' か '600037' のどちらかにある方を拾う
      const { data, error } = await supabase
        .from('cast_members')
        .select('display_name')
        .or(`login_id.eq.${rawId},login_id.eq.${trimmedId}`)
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
    <div className="min-h-screen bg-[#FFF5F7] p-6 flex items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-xl border border-pink-50 text-center">
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">
          {displayName} <span className="text-lg font-bold text-slate-400">さん</span>
        </h1>
        <p className="mt-4 text-xs text-pink-300 font-bold uppercase tracking-widest">Karinto System Grounded</p>
      </div>
    </div>
  );
}