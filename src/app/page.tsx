'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function HomePage() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  // 初期値
  const [displayName, setDisplayName] = useState<string>('取得中...');

  useEffect(() => {
    const fetchProfile = async () => {
      // 1. ログインユーザーの情報を取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 2. IDを2パターン用意（0あり: 00600037 / 0なし: 600037）
      const rawId = user.email?.split('@')[0] || ''; 
      const numId = rawId.replace(/^0+/, ''); 

      // 3. どちらかのIDで display_name がヒットするか検索
      const { data, error } = await supabase
        .from('cast_members')
        .select('display_name')
        .or(`login_id.eq."${rawId}",login_id.eq."${numId}"`)
        .limit(1)
        .maybeSingle();

      // 4. 結果を画面に反映
      if (data?.display_name) {
        setDisplayName(data.display_name);
      } else {
        // ヒットしなかった場合は、探したIDを画面に出して原因を特定しやすくする
        setDisplayName(`未登録(ID:${rawId})`);
        console.error("検索に失敗しました:", { rawId, numId, error });
      }
    };

    fetchProfile();
  }, [supabase]);

  return (
    <div className="min-h-screen bg-[#FFF5F7] p-6 flex flex-col items-center justify-center font-sans text-slate-800">
      <div className="w-full max-w-md bg-white rounded-[40px] p-10 shadow-xl border border-pink-50 text-center">
        {/* ステータスバッジ */}
        <div className="mb-6">
          <span className="bg-pink-100 text-pink-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em]">
            Cast Online
          </span>
        </div>
        
        {/* 名前表示エリア */}
        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">
          {displayName} <span className="text-lg font-bold text-slate-400">さん</span>
        </h1>
        
        {/* 装飾・メッセージ */}
        <div className="mt-8 pt-8 border-t border-pink-50">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
            今日も一日お疲れ様です 🌸<br />
            <span className="text-[10px] opacity-50">Karinto Internal System</span>
          </p>
        </div>
      </div>

      {/* デバッグ用：もし「未登録」が出るならここを確認 */}
      {displayName.includes('未登録') && (
        <p className="mt-4 text-[10px] text-rose-400 font-mono">
          ※DBの login_id 列にこのIDが存在するか確認してください
        </p>
      )}
    </div>
  );
}