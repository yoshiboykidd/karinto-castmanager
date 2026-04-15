'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { ChevronLeft, Lock, CheckCircle2, AlertCircle, Home, Search, Heart, User, LogOut, GripVertical, Eye, EyeOff } from 'lucide-react';

const DEFAULT_STORES = [
  { id: '001', name: '神田', visible: true }, { id: '002', name: '赤坂', visible: true },
  { id: '003', name: '秋葉原', visible: true }, { id: '004', name: '上野', visible: true },
  { id: '005', name: '渋谷', visible: true }, { id: '006', name: '池袋西口', visible: true },
  { id: '007', name: '五反田', visible: true }, { id: '008', name: '大宮', visible: true },
  { id: '009', name: '吉祥寺', visible: true }, { id: '010', name: '大久保', visible: true },
  { id: '011', name: '池袋東口', visible: true }, { id: '012', name: '小岩', visible: true }
];

export default function UserProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [stores, setStores] = useState<any[]>(DEFAULT_STORES);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // 📍 並び替え管理用
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) { router.push('/user/login'); return; }
    setUser(JSON.parse(sessionData));

    const saved = localStorage.getItem('user_favorite_shops_v2');
    if (saved) {
      try {
        setStores(JSON.parse(saved));
      } catch (e) {
        setStores(DEFAULT_STORES);
      }
    }
  }, [router]);

  // 📍 保存処理
  const saveToLocal = (updatedStores: any[]) => {
    localStorage.setItem('user_favorite_shops_v2', JSON.stringify(updatedStores));
  };

  // 📍 ドラッグ&ドロップ (PC/マウス用)
  const onDragStart = (index: number) => setDraggedIndex(index);
  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newStores = [...stores];
    const item = newStores.splice(draggedIndex, 1)[0];
    newStores.splice(index, 0, item);
    setDraggedIndex(index);
    setStores(newStores);
    saveToLocal(newStores);
  };

  // 📍 表示・非表示切り替え
  const toggleVisibility = (index: number) => {
    const newStores = [...stores];
    newStores[index].visible = !newStores[index].visible;
    setStores(newStores);
    saveToLocal(newStores);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    setLoading(true);
    try {
      if (newPassword !== confirmPassword) throw new Error('パスワード不一致');
      const { error } = await supabase.from('customer_logins').update({ password_hash: newPassword }).eq('user_id', user.id);
      if (error) throw error;
      setMessage({ type: 'success', text: 'パスワードを更新しました' });
      setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 font-sans select-none">
      <header className="bg-white px-6 py-4 flex items-center sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.back()} className="text-slate-400 p-1"><ChevronLeft size={24} /></button>
        <h1 className="flex-1 text-center text-lg font-black pr-8 italic uppercase tracking-tighter">Setting</h1>
      </header>

      <main className="px-6 pt-8 space-y-6 max-w-md mx-auto">
        {/* 店舗設定セクション */}
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500"><Heart size={18} /></div>
            <h3 className="font-black text-lg tracking-tight">店舗並び替え・表示</h3>
          </div>
          <p className="text-[10px] text-slate-400 font-black mb-4 px-1 italic">※枠を掴んで上下にスライドして並び替え（即時保存）</p>
          
          <div className="space-y-2">
            {stores.map((store, index) => (
              <div 
                key={store.id}
                draggable
                onDragStart={() => onDragStart(index)}
                onDragOver={(e) => onDragOver(e, index)}
                onDragEnd={() => setDraggedIndex(null)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 touch-none ${
                  store.visible ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-transparent opacity-40 grayscale'
                } ${draggedIndex === index ? 'opacity-50 scale-95 border-blue-200 bg-blue-50' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1 h-full">
                  <GripVertical size={20} className="text-slate-300 shrink-0" />
                  <span className="font-black text-sm text-slate-700">{store.name}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVisibility(index);
                  }}
                  className={`p-2 rounded-xl transition-all active:scale-90 ${
                    store.visible ? 'bg-blue-500 text-white shadow-md shadow-blue-100' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {store.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* パスワード設定セクション */}
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <h3 className="font-black text-xs text-slate-400 ml-2 italic uppercase tracking-widest">Security Update</h3>
            <input
              type="password"
              placeholder="新しいパスワード"
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-100 focus:bg-white transition-all text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="確認用再入力"
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-100 focus:bg-white transition-all text-sm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {message.text && (
              <div className={`text-center font-black text-[11px] animate-in fade-in zoom-in-95 ${message.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                {message.text}
              </div>
            )}
            <button 
              disabled={loading || !newPassword} 
              className="w-full bg-blue-500 text-white rounded-2xl py-5 font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:opacity-30"
            >
              {loading ? "更新中..." : 'パスワードを更新する'}
            </button>
          </form>
        </section>

        <button 
          onClick={() => { localStorage.removeItem('user_session'); router.push('/user/login'); }}
          className="w-full py-4 flex items-center justify-center gap-2 text-slate-300 font-bold text-xs hover:text-rose-400 transition-colors"
        >
          <LogOut size={16} />
          <span>ログアウトする</span>
        </button>
      </main>

      {/* フッターナビ */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-between items-center z-20">
        <button onClick={() => router.push('/user/dashboard')} className="flex flex-col items-center text-slate-300"><Home size={24} /><span className="text-[10px] font-black mt-1 uppercase">Home</span></button>
        <button className="flex flex-col items-center text-slate-300"><Search size={24} /><span className="text-[10px] font-black mt-1 uppercase">Search</span></button>
        <button className="flex flex-col items-center text-slate-300"><Heart size={24} /><span className="text-[10px] font-black mt-1 uppercase">Favorite</span></button>
        <button className="flex flex-col items-center text-blue-500"><User size={24} /><span className="text-[10px] font-black mt-1 uppercase">Mypage</span></button>
      </nav>
    </div>
  );
}