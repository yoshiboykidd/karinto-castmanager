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
      // 1. 電話番号から user_id を特定
      const { data: loginData, error: loginErr } = await supabase
        .from('customer_logins')
        .select('user_id')
        .eq('phone_number', phone)
        .single();

      if (loginErr || !loginData) {
        throw new Error('電話番号が見つかりません');
      }

      // 2. user_id を使ってパスワードを確認
      const { data: userData, error: userErr } = await supabase
        .from('customers')
        .select('*')
        .eq('id', loginData.user_id)
        .single();

      if (userErr || !userData) {
        throw new Error('ユーザーデータが見つかりません');
      }

      // 3. パスワード照合 (簡易的に文字列比較、本来はハッシュ化推奨)
      if (userData.password_hash !== password) {
        throw new Error('パスワードが正しくありません');
      }

      // 成功時：ローカルストレージ等にセッションを保持（暫定）
      localStorage.setItem('user_session', JSON.stringify(userData));
      
      // ダッシュボードへ
      router.push('/user/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-8">
      <div className="mb-12">
        <h1 className="text-3xl font-black text-gray-800 mb-2">Member Login</h1>
        <p className="text-gray-400 font-bold">会員様専用マイページ</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        <div>
          <label className="block text-[11px] font-black text-pink-400 uppercase mb-2 ml-1">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="09012345678"
            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-700 focus:ring-2 focus:ring-pink-200"
            required
          />
        </div>

        <div>
          <label className="block text-[11px] font-black text-pink-400 uppercase mb-2 ml-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••"
            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-700 focus:ring-2 focus:ring-pink-200"
            required
          />
          <p className="mt-2 text-[10px] text-gray-300 ml-1">※初期パスワードは 0000 です</p>
        </div>

        {error && <p className="text-rose-500 text-[12px] font-bold ml-1">⚠️ {error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white rounded-[24px] py-5 font-black text-[16px] shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? '認証中...' : 'ログイン 🚀'}
        </button>
      </form>

      <div className="mt-12 text-center">
        <button className="text-[12px] font-bold text-gray-300 border-b border-gray-100 pb-1">
          パスワードを忘れた方はこちら
        </button>
      </div>
    </div>
  );
}