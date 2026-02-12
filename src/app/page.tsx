'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function HomePage() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  const [displayName, setDisplayName] = useState<string>('読み込み中...');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const loginId = user.email?.split('@')[0] || '';
      
      // ★ ここで「名前」を取ってきます
      const { data } = await supabase
        .from('cast_members')
        .select('display_name')
        .eq('login_id', loginId)
        .single();

      if (data?.display_name) {
        setDisplayName(data.display_name);
      } else {
        setDisplayName('名前未設定');
      }
    };
    fetchProfile();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#FFF5F7] p-6 text-slate-800">
      {/* ★ ここが「名前」を表示する場所です */}
      <div className="max-w-md mx-auto bg-white rounded-[32px] p-8 shadow-sm border border-pink-50 text-center">
        <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest mb-1">Welcome back</p>
        <h1 className="text-2xl font-black text-slate-800">
          {displayName} <span className="text-sm font-medium">さん</span>
        </h1>
        <p className="mt-4 text-xs text-gray-400 font-bold">今日も一日お疲れ様です🌸</p>
      </div>

      {/* 以下に、あなたの元の「キャストメニュー」などのボタンが続きます */}
      <div className="mt-8 space-y-4">
        {/* 元々のボタン類をここに置いてください */}
      </div>
    </div>
  );
}