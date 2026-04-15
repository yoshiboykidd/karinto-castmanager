'use client';

import React, { useState, useEffect } from 'react';
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) { router.push('/user/login'); return; }
    setUser(JSON.parse(sessionData));

    const saved = localStorage.getItem('user_favorite_shops_v2');
    if (saved) setStores(JSON.parse(saved));
  }, [router]);

  // --- ドラッグ&ドロップ ロジック ---
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newStores = [...stores];
    const draggedItem = newStores.splice(draggedIndex, 1)[0];
    newStores.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setStores(newStores);
  };

  // --- 表示切替 ---
  const toggleVisibility = (index: number) => {
    const newStores = [...stores];
    newStores[index].visible = !newStores[index].visible;
    setStores(newStores);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (newPassword) {
        if (newPassword !== confirmPassword) throw new Error('パスワード不一致');
        const { error } = await supabase.from('customer_logins').update({ password_hash: newPassword }).eq('user_id', user.id);
        if (error) throw error;
      }
      // V2として保存（オブジェクト配列形式）
      localStorage.setItem('user_favorite_shops_v2', JSON.stringify(stores));
      setMessage({ type: 'success', text: '設定を保存しました！' });
      setTimeout(() => router.push('/user/dashboard'), 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '更新失敗' });
    } finally { setLoading(false); }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 font-sans">
      <header className="bg-white px-6 py-4 flex items-center sticky top-0 z-10 shadow-sm">
        <button onClick={() => router.back()} className="text-slate-400 p-1"><ChevronLeft size={24} /></button>
        <h1 className="flex-1 text-center text-lg font-black pr-8">My Page</h1>
      </header>

      <main className="px-6 pt-8 space-y-6 max-w-md mx-auto">
        {/* プロフィール表示 */}
        <section className="text-center">
          <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-100">
            <User size={40} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">{user.name} 様</h2>
        </section>

        {/* 店舗並び替え & 表示切替 */}
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500"><Heart size={18} /></div>
            <h3 className="font-black text-lg">店舗の並び替え・表示</h3>
          </div>
          
          <div className="space-y-2">
            {stores.map((store, index) => (
              <div 
                key={store.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={() => setDraggedIndex(null)}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  store.visible ? 'bg-slate-50 border-slate-100 opacity-100' : 'bg-slate-100 border-transparent opacity-50'
                } ${draggedIndex === index ? 'scale-105 shadow-xl ring-2 ring-blue-400 z-50' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="cursor-grab active:cursor-grabbing text-slate-300"><GripVertical size={20} /></div>
                  <span className="font-black text-sm text-slate-700">{store.name}</span>
                </div>
                <button 
                  onClick={() => toggleVisibility(index)}
                  className={`p-2 rounded-xl transition-colors ${store.visible ? 'bg-blue-50 text-blue-500' : 'bg-slate-200 text-slate-400'}`}
                >
                  {store.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* パスワード変更 & 保存 */}
        <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <input
              type="password"
              placeholder="新しいパスワード"
              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 font-bold outline-none focus:border-blue-100 focus:bg-white transition-all"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            {message.text && <div className="text-[11px] font-black text-center">{message.text}</div>}
            <button disabled={loading} className="w-full bg-blue-500 text-white rounded-2xl py-5 font-black text-lg shadow-xl shadow-blue-100 active:scale-95 transition-all disabled:bg-slate-200">
              {loading ? "SAVING..." : '設定を保存する'}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}