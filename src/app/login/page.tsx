'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [castId, setCastId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      // キャストIDをメールアドレス形式に変換
      const email = `${castId}@karinto-internal.com`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // ログイン成功したらダッシュボードへ移動＆リフレッシュ
      router.push('/');
      router.refresh();

    } catch (error) {
      setErrorMsg('IDまたはパスワードが違います');
      setLoading(false);
    }
  };

  return (
    // 🌸 全体の背景：優しいピンクのグラデーション
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-pink-100 px-4">
      
      {/* 🤍 ログインカード：白い箱で角を丸く */}
      <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm p-8 rounded-[30px] shadow-[0_10px_30px_rgba(255,182,193,0.3)] border border-pink-100">
        
        {/* 🎀 ロゴエリア：ここをCSSでポップに装飾！ */}
        <div className="text-center mb-8">
          <div className="inline-block bg-pink-100 rounded-full p-3 mb-3">
            <span className="text-3xl">🌸</span>
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tighter">
            Karinto Cast
            <span className="block text-pink-500 text-3xl">Manager</span>
          </h1>
          <p className="text-xs text-gray-400 font-bold tracking-widest mt-2">CAST PORTAL LOGIN</p>
        </div>

        {/* エラーメッセージ表示エリア */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-500 text-sm font-bold text-center animate-pulse">
            {errorMsg}
          </div>
        )}

        {/* 入力フォーム */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label htmlFor="castId" className="block text-xs font-bold text-gray-500 mb-1 ml-1">
              キャストID (数字)
            </label>
            <input
              id="castId"
              type="text"
              inputMode="numeric"
              pattern="\d*"
              placeholder="例: 00600005"
              value={castId}
              onChange={(e) => setCastId(e.target.value)}
              className="w-full bg-pink-50/50 border border-pink-100 text-gray-700 font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all placeholder-gray-300"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-gray-500 mb-1 ml-1">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-pink-50/50 border border-pink-100 text-gray-700 font-bold rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-300 transition-all placeholder-gray-300"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-400 to-rose-400 hover:from-pink-500 hover:to-rose-500 text-white font-black rounded-xl px-4 py-3 shadow-md shadow-pink-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '確認中...' : 'ログインする'}
          </button>
        </form>

      </div>
    </div>
  );
}