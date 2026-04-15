'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ChevronLeft, Lock, CheckCircle2, AlertCircle, Home, Search, Heart, User, LogOut, MapPin, ChevronUp, ChevronDown } from 'lucide-react';

const DEFAULT_STORES = ['神田', '赤坂', '秋葉原', '上野', '渋谷', '池袋西口', '五反田', '大宮', '吉祥寺', '大久保', '池袋東口', '小岩'];

export default function UserProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [stores, setStores] = useState<string[]>(DEFAULT_STORES); // 📍 追加：店舗リスト
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
      router.push('/user/login');
      return;
    }
    setUser(JSON.parse(sessionData));

    // 📍 修正：保存されているお気に入り順序をロード
    const savedOrder = localStorage.getItem('user_favorite_shops');
    if (savedOrder) {
      setStores(JSON.parse(savedOrder));
    }
  }, [router]);

  // 📍 追加：並び替えロジック
  const moveStore = (index: number, direction: 'up' | 'down') => {
    const newStores = [...stores];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= stores.length) return;

    [newStores[index], newStores[targetIndex]] = [newStores[targetIndex], newStores[index]];
    setStores(newStores);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. パスワード変更がある場合
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setMessage({ type: 'error', text: 'パスワードが一致しません' });
          setLoading(false);
          return;
        }
        if (newPassword.length < 4) {
          setMessage({ type: 'error', text: '4文字以上で入力してください' });
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from('customer_logins')
          .update({ password_hash: newPassword })
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // 📍 2. お気に入り店舗の順序を保存
      localStorage.setItem('user_favorite_shops', JSON.stringify(stores));

      setMessage({ type: 'success', text: '設定を保存しました！' });
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => router.push('/user/dashboard'), 1500);
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
      <header className="bg-white px-6 py-4 flex items-center sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.back()} className="text-slate-400 p-1">
          <ChevronLeft size={24} />
        </button>
        <h1 className="flex-1 text-center text-lg font-black pr-8">My Page</h1>
      </header>

      <main className="px-6 pt-8 space-y-6 max-w-md mx-auto">
        <section className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-100">
            <User size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">{user.name || 'お客様'} 様</h2>
          <div className="inline-block mt-2 px-4 py-1 bg-white border border-slate-200 rounded-full">
            <p className="text-slate-500 font-bold text-xs">{user.phone_number}</p>
          </div>
        </section>

        {/* 📍 追加：お気に入り店舗並び替えセクション */}
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500">
              <Heart size={18} />
            </div>
            <h3 className="font-black text-lg">お気に入り店舗順</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-bold mb-4 px-2 italic">※上に配置した店舗がホーム画面で優先表示されます</p>
          
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
            {stores.map((store, index) => (
              <div key={store} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-300 w-4">{index + 1}</span>
                  <span className="font-black text-sm text-slate-700">{store}</span>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => moveStore(index, 'up')}
                    disabled={index === 0}
                    className="p-2 bg-white rounded-lg text-slate-400 disabled:opacity-30 shadow-sm active:scale-90"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button 
                    onClick={() => moveStore(index, 'down')}
                    disabled={index === stores.length - 1}
                    className="p-2 bg-white rounded-lg text-slate-400 disabled:opacity-30 shadow-sm active:scale-90"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
              <Lock size={18} />
            </div>
            <h3 className="font-black text-lg">セキュリティ設定</h3>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 ml-4 uppercase tracking-widest">New Password</label>
              <input
                type="password"
                placeholder="新しいパスワード（任意）"
                className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold text-slate-700 focus:border-blue-100 focus:bg-white outline-none transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
              {loading ? "SAVING..." : '設定を保存する'}
            </button>
          </form>
        </section>

        <button onClick={handleLogout} className="w-full py-4 flex items-center justify-center gap-2 text-slate-400 font-bold text-sm hover:text-rose-500 transition-colors">
          <LogOut size={16} />
          <span>ログアウトする</span>
        </button>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-between items-center z-20">
        <button onClick={() => router.push('/user/dashboard')} className="flex flex-col items-center text-slate-300"><Home size={24} /><span className="text-[10px] font-black mt-1">Home</span></button>
        <button className="flex flex-col items-center text-slate-300"><Search size={24} /><span className="text-[10px] font-black mt-1">Search</span></button>
        <button className="flex flex-col items-center text-slate-300"><Heart size={24} /><span className="text-[10px] font-black mt-1">Favorite</span></button>
        <button className="flex flex-col items-center text-blue-500"><User size={24} /><span className="text-[10px] font-black mt-1">Mypage</span></button>
      </nav>
    </div>
  );
}