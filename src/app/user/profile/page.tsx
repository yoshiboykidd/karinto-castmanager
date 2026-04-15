'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ChevronLeft, Lock, CheckCircle2, AlertCircle, Home, Search, Heart, User, LogOut } from 'lucide-react';

export default function UserProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // セッション確認
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
      router.push('/user/login');
      return;
    }
    setUser(JSON.parse(sessionData));
  }, [router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーション
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'パスワードが一致しません' });
      return;
    }
    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: '4文字以上で入力してください' });
      return;
    }
    if (newPassword === '0000') {
      setMessage({ type: 'error', text: '初期パスワード以外を設定してください' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // 📍 customer_logins テーブルのパスワードを更新
      const { error } = await supabase
        .from('customer_logins')
        .update({ password_hash: newPassword })
        .eq('user_id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'パスワードを更新しました！' });
      setNewPassword('');
      setConfirmPassword('');
      
      // 2秒後にダッシュボードへ戻す（URLからalert_passwordが消える）
      setTimeout(() => router.push('/user/dashboard'), 2000);
    } catch (err) {
      setMessage({ type: 'error', text: '更新に失敗しました' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (!window.confirm('ログアウトしますか？')) return;
    localStorage.removeItem('user_session');
    router.push('/user/login');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      {/* --- ヘッダー --- */}
      <header className="bg-white px-6 py-4 flex items-center sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.back()} className="text-slate-400 p-1">
          <ChevronLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-lg font-black pr-8">My Page</h1>
      </header>

      <main className="px-6 pt-8 space-y-8 max-w-md mx-auto">
        {/* --- プロフィール概要 --- */}
        <section className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-100">
            <User size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">{user.name || 'お客様'} 様</h2>
          <div className="inline-block mt-2 px-4 py-1 bg-white border border-slate-200 rounded-full">
            <p className="text-slate-500 font-bold text-xs">{user.phone_number}</p>
          </div>
        </section>

        {/* --- パスワード変更カード --- */}
        <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
              <Lock size={18} />
            </div>
            <h3 className="font-black text-lg">セキュリティ設定</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">New Password</label>
              <input
                type="password"
                placeholder="新しいパスワード"
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold text-slate-700 focus:border-blue-100 focus:bg-white outline-none transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">Confirm Password</label>
              <input
                type="password"
                placeholder="確認のため再入力"
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold text-slate-700 focus:border-blue-100 focus:bg-white outline-none transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {message.text && (
              <div className={`flex items-center gap-2 p-4 rounded-2xl text-[11px] font-black animate-in zoom-in-95 ${
                message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}>
                {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {message.text}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full bg-blue-500 text-white rounded-2xl py-5 font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:bg-slate-200 mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>SAVING...</span>
                </div>
              ) : '設定を保存する'}
            </button>
          </form>
        </section>

        {/* --- ログアウトボタン --- */}
        <button 
          onClick={handleLogout}
          className="w-full py-4 flex items-center justify-center gap-2 text-slate-400 font-bold text-sm hover:text-rose-500 transition-colors"
        >
          <LogOut size={16} />
          <span>ログアウトする</span>
        </button>
      </main>

      {/* --- フッターナビゲーション --- */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-between items-center z-20">
        <button onClick={() => router.push('/user/dashboard')} className="flex flex-col items-center text-slate-300">
          <Home size={24} />
          <span className="text-[10px] font-black mt-1">Home</span>
        </button>
        <button className="flex flex-col items-center text-slate-300">
          <Search size={24} />
          <span className="text-[10px] font-black mt-1">Search</span>
        </button>
        <button className="flex flex-col items-center text-slate-300">
          <Heart size={24} />
          <span className="text-[10px] font-black mt-1">Favorite</span>
        </button>
        <button className="flex flex-col items-center text-blue-500">
          <User size={24} />
          <span className="text-[10px] font-black mt-1">Mypage</span>
        </button>
      </nav>
    </div>
  );
}