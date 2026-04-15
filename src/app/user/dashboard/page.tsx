'use client';

import React, { useState, useEffect, Suspense } from 'react'; // 📍 Suspenseを追加
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Heart, Clock, MapPin, LogOut, Bell, User, Home, Search, Star } from 'lucide-react';

// 📍 実際のコンテンツを別コンポーネントに切り出し
function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const alertPassword = searchParams.get('alert_password');

  const [userName, setUserName] = useState('ゲスト');
  const [activeStore, setActiveStore] = useState('すべて');
  const [casts, setCasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const stores = ['すべて', '池袋', '赤坂', '五反田', '小岩', '新宿', '渋谷'];

  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
      router.push('/user/login');
      return;
    }
    const user = JSON.parse(sessionData);
    setUserName(user.name || 'お客様');

    const fetchShifts = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('date', today)
        .order('start_time', { ascending: true });

      if (!error && data) {
        setCasts(data);
      }
      setLoading(false);
    };

    fetchShifts();
  }, [router, supabase]);

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    router.push('/user/login');
  };

  const filteredCasts = activeStore === 'すべて' 
    ? casts 
    : casts.filter(c => c.store_name?.includes(activeStore));

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      <header className="bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-xs">KCM</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-800">Member Portal</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Bell size={20} className="text-slate-400" />
          <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="px-6 pt-6 space-y-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-400 rounded-[32px] p-6 text-white shadow-lg shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Welcome back</p>
            <h2 className="text-2xl font-black mb-4">{userName} 様</h2>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-blue-100 text-[10px] uppercase font-bold tracking-tighter">Current Points</p>
                <p className="text-3xl font-black">1,240 <span className="text-sm font-bold">pt</span></p>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 text-xs font-bold">
                デジタル会員証
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {alertPassword === 'true' && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start space-x-3">
            <div className="p-2 bg-amber-200 rounded-xl">
              <Star size={16} className="text-amber-700 fill-amber-700" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900">セキュリティ通知</p>
              <p className="text-xs font-bold text-amber-700 leading-relaxed">
                初期パスワード（0000）のままです。安全のためマイページから変更をお願いします。
              </p>
            </div>
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-lg flex items-center">
              <MapPin size={18} className="mr-2 text-blue-500" />
              本日の出勤表
            </h3>
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
            {stores.map((store) => (
              <button
                key={store}
                onClick={() => setActiveStore(store)}
                className={`px-5 py-2.5 rounded-2xl font-black text-sm transition-all whitespace-nowrap ${
                  activeStore === store 
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-100' 
                  : 'bg-white text-slate-400 border border-slate-100'
                }`}
              >
                {store}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          {loading ? (
            <p className="text-center py-10 text-slate-400 font-bold">読み込み中...</p>
          ) : filteredCasts.length > 0 ? (
            filteredCasts.map((cast, idx) => (
              <div key={idx} className="bg-white rounded-[24px] p-4 flex items-center space-x-4 border border-slate-100 shadow-sm">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0">
                  <img 
                    src={cast.image_url || 'https://via.placeholder.com/150'} 
                    alt={cast.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                        {cast.store_name || '店舗情報なし'}
                      </span>
                      <h4 className="text-lg font-black text-slate-800 mt-0.5">{cast.name}</h4>
                    </div>
                    <Heart size={20} className="text-slate-200 hover:text-blue-400 cursor-pointer transition-colors" />
                  </div>
                  <div className="flex items-center text-slate-400 mt-2">
                    <Clock size={14} className="mr-1" />
                    <span className="text-sm font-bold tracking-tighter">
                      {cast.start_time} — {cast.end_time}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-300 font-bold">本日の出勤データはありません</p>
            </div>
          )}
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-between items-center z-20">
        <button className="flex flex-col items-center text-blue-500">
          <Home size={24} />
          <span className="text-[10px] font-black mt-1">Home</span>
        </button>
        <button className="flex flex-col items-center text-slate-300 hover:text-blue-400 transition-colors">
          <Search size={24} />
          <span className="text-[10px] font-black mt-1">Search</span>
        </button>
        <button className="flex flex-col items-center text-slate-300 hover:text-blue-400 transition-colors">
          <Heart size={24} />
          <span className="text-[10px] font-black mt-1">Favorite</span>
        </button>
        <button onClick={() => router.push('/user/profile')} className="flex flex-col items-center text-slate-300 hover:text-blue-400 transition-colors">
          <User size={24} />
          <span className="text-[10px] font-black mt-1">Mypage</span>
        </button>
      </nav>
    </div>
  );
}

// 📍 エクスポート部分で Suspense で包む（これでビルドエラーが消えます）
export default function UserDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}