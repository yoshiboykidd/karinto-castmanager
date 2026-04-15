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
      // 1. ログイン情報の取得
      const { data: loginData, error: loginErr } = await supabase
        .from('customer_logins')
        .select('user_id, password_hash') // password_hashもここで取るのが効率的
        .eq('phone_number', phone)
        .single();

      if (loginErr || !loginData) throw new Error('会員情報が見つかりません');

      // 2. パスワード照合
      if (loginData.password_hash !== password) throw new Error('パスワードが違います');

      // 3. ユーザー詳細の取得
      const { data: userData, error: userErr } = await supabase
        .from('customers')
        .select('*')
        .eq('id', loginData.user_id)
        .single();

      if (userErr || !userData) throw new Error('ログインに失敗しました');

      // 4. セッション保存
      localStorage.setItem('user_session', JSON.stringify(userData));

      // 📍 修正ポイント：0000 の場合はアラート付きで飛ばす
      if (password === '0000') {
        await router.push('/user/dashboard?alert_password=true');
      } else {
        await router.push('/user/dashboard');
      }
      
      // 画面をリフレッシュして確実にログイン状態を反映
      router.refresh();

    } catch (err: any) {
      setError(err.message);
      setLoading(false); // エラー時はボタンを元に戻す
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-slate-800 tracking-tighter">KCM</h1>
        <p className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em] mt-1">Member Portal</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto w-full">
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Phone Number</label>
          <input
            type="tel"
            placeholder="09012345678"
            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold text-slate-700 focus:border-blue-100 focus:bg-white outline-none transition-all"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 ml-4 uppercase">Password</label>
          <input
            type="password"
            placeholder="••••"
            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold text-slate-700 focus:border-blue-100 focus:bg-white outline-none transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        {error && (
          <div className="bg-rose-50 text-rose-500 text-[11px] font-bold py-3 px-4 rounded-xl text-center border border-rose-100 animate-pulse">
            {error}
          </div>
        )}
        
        <button
          disabled={loading}
          className="w-full bg-blue-500 text-white rounded-2xl py-5 font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:bg-slate-200 mt-4 flex justify-center items-center"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>AUTHENTICATING...</span>
            </div>
          ) : 'LOGIN'}
        </button>
      </form>

      <p className="mt-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
        &copy; 2026 KCM Group. All Rights Reserved.
      </p>
    </div>
  );
}