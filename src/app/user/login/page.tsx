'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function UserLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. ログイン情報の取得（電話番号で検索）
      const { data: loginData, error: loginErr } = await supabase
        .from('customer_logins')
        .select('user_id, password_hash')
        .eq('phone_number', phone)
        .single();

      if (loginErr || !loginData) throw new Error('会員情報が見つかりません');

      // 2. パスワード照合
      if (loginData.password_hash !== password) throw new Error('パスワードが違います');

      // 3. ユーザー詳細（名前など）の取得
      const { data: userData, error: userErr } = await supabase
        .from('customers')
        .select('*')
        .eq('id', loginData.user_id)
        .single();

      if (userErr || !userData) throw new Error('ログインに失敗しました');

      // 4. 📍 セッション保存：password_hash を含めて保存することでダッシュボード側で判定可能にする
      localStorage.setItem('user_session', JSON.stringify({
        ...userData,
        password_hash: loginData.password_hash 
      }));

      // 5. 📍 ダッシュボードへ移動（パラメータなしでOK。ダッシュボード側が自立判定します）
      router.push('/user/dashboard');
      
      // 画面をリフレッシュしてMiddlewareやStateに確実に反映
      router.refresh();

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-8">
      {/* ロゴセクション */}
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">KCM</h1>
        <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] mt-1">Member Portal</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto w-full">
        {/* 電話番号入力 */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Phone Number</label>
          <input
            type="tel"
            placeholder="09012345678"
            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold text-slate-700 focus:border-blue-100 focus:bg-white outline-none transition-all placeholder:text-slate-300"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        {/* パスワード入力 */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Password</label>
          <input
            type="password"
            placeholder="••••"
            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold text-slate-700 focus:border-blue-100 focus:bg-white outline-none transition-all placeholder:text-slate-300"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {/* エラーメッセージ */}
        {error && (
          <div className="bg-rose-50 text-rose-500 text-[11px] font-bold py-3 px-4 rounded-xl text-center border border-rose-100 animate-in zoom-in-95">
            {error}
          </div>
        )}
        
        {/* ログインボタン */}
        <button
          disabled={loading}
          className="w-full bg-blue-500 text-white rounded-2xl py-5 font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:bg-slate-200 mt-4 flex justify-center items-center overflow-hidden relative"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="tracking-widest">AUTHENTICATING...</span>
            </div>
          ) : (
            <span className="tracking-widest uppercase">Login</span>
          )}
        </button>
      </form>

      {/* フッターコピーライト */}
      <p className="mt-12 text-center text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
        &copy; 2026 KCM Group. Secure Portal Access.
      </p>
    </div>
  );
}