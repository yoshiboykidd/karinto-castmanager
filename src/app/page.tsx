'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function HomePage() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  // 初期値を「読み込み中」にして、取得に失敗した場合はIDそのものを出すようにします
  const [displayName, setDisplayName] = useState<string>('読み込み中...');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const rawId = user.email?.split('@')[0] || '';
      
      // ★ 8桁のID(00600001)と、数値化したID(600001)の両方で検索をかける
      const { data, error } = await supabase
        .from('cast_members')
        .select('display_name')
        .in('login_id', [rawId, String(Number(rawId))])
        .single();

      if (data?.display_name) {
        setDisplayName(data.display_name);
      } else {
        // 名前が見つからない場合は、原因を特定するためにIDを表示させる
        setDisplayName(`ID:${rawId} (名前未登録)`);
      }
    };
    fetchProfile();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#FFF5F7] p-6 flex flex-col items-center justify-center font-sans text-slate-800">
      <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-xl border border-pink-50 text-center">
        <p className="text-[10px] font-black text-pink-300 uppercase tracking-[0.2em] mb-2">Welcome Back</p>
        
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
          {displayName} <span className="text-base font-bold text-slate-400">さん</span>
        </h1>
        
        <div className="mt-8 pt-8 border-t border-pink-50">
          <p className="text-xs font-bold text-slate-400">今日も一日お疲れ様です 🌸</p>
        </div>
      </div>
    </div>
  );
}