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
      const { data: loginData, error: loginErr } = await supabase
        .from('customer_logins')
        .select('user_id')
        .eq('phone_number', phone)
        .single();

      if (loginErr || !loginData) throw new Error('会員情報が見つかりません');

      const { data: userData, error: userErr } = await supabase
        .from('customers')
        .select('*')
        .eq('id', loginData.user_id)
        .single();

      if (userErr || !userData) throw new Error('ログインに失敗しました');
      if (userData.password_hash !== password) throw new Error('パスワードが違います');

      localStorage.setItem('user_session', JSON.stringify(userData));
      router.push('/user/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-black text-gray-800 tracking-tighter">KCM</h1>
        <p className="text-[12px] font-bold text-pink-400">Karinto Customer Manager</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <input
          type="tel"
          placeholder="電話番号を入力"
          className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-700"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="パスワード (初期: 0000)"
          className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}
        <button
          disabled={loading}
          className="w-full bg-pink-500 text-white rounded-2xl py-5 font-black text-lg shadow-lg shadow-pink-100 active:scale-95 transition-all"
        >
          {loading ? '認証中...' : 'ログイン'}
        </button>
      </form>
    </div>
  );
}