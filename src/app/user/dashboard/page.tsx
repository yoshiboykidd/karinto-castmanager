'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Heart, Clock, MapPin, LogOut, Bell, User, Home, Search, Star, ChevronDown, ChevronUp } from 'lucide-react';

// 📍 001-012までの完全な店名マップ
const shopMap: Record<string, string> = {
  'all': '全店舗',
  '001': '神田',
  '002': '赤坂',
  '003': '秋葉原',
  '004': '上野',
  '005': '渋谷',
  '006': '池袋西口',
  '007': '五反田',
  '008': '大宮',
  '009': '吉祥寺',
  '010': '大久保',
  '011': '池袋東口',
  '012': '小岩'
};

function DashboardContent() {
  const router = useRouter();
  const supabase = createClient();

  const [userName, setUserName] = useState('ゲスト');
  const [showPasswordAlert, setShowPasswordAlert] = useState(false);
  const [activeStore, setActiveStore] = useState('すべて');
  const [shifts, setShifts] = useState<any[]>([]);
  const [latestNews, setLatestNews] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isNewsExpanded, setIsNewsExpanded] = useState(false);

  // 📍 修正：管理画面と一致する12店舗リスト
  const stores = ['すべて', '神田', '赤坂', '秋葉原', '上野', '渋谷', '池袋西口', '五反田', '大宮', '吉祥寺', '大久保', '池袋東口', '小岩'];

  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) {
      router.push('/user/login');
      return;
    }
    const user = JSON.parse(sessionData);
    setUserName(user.name || 'お客様');

    if (user.password_hash === '0000') {
      setShowPasswordAlert(true);
    }

    const fetchData = async () => {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      const { data: shiftData } = await supabase
        .from('shifts')
        .select(`
          *,
          cast_members (
            store_name,
            profile_image_url
          )
        `)
        .eq('shift_date', today)
        .order('start_time', { ascending: true });

      if (shiftData) setShifts(shiftData);

      const { data: newsData } = await supabase
        .from('user_news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (newsData && newsData.length > 0) {
        setLatestNews(newsData[0]);
      }

      setLoading(false);
    };

    fetchData();
  }, [router, supabase]);

  const handleLogout = () => {
    if (!window.confirm('ログアウトしますか？')) return;
    localStorage.removeItem('user_session');
    router.push('/user/login');
  };

  // 📍 修正：店舗名が厳密に分かれたため、完全一致(===)でフィルタリング
  const filteredShifts = activeStore === 'すべて' 
    ? shifts 
    : shifts.filter(s => s.cast_members?.store_name === activeStore);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      <header className="bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-blue-100">
            <span className="text-white font-black text-xs">KCM</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-slate-800">Member Portal</h1>
        </div>
        <div className="flex items-center space-x-4 text-slate-400">
          <Bell size={20} />
          <button onClick={handleLogout} className="hover:text-rose-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="px-6 pt-6 space-y-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-400 rounded-[32px] p-6 text-white shadow-lg shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-1">Membership</p>
            <h2 className="text-2xl font-black mb-4">{userName} 様</h2>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-blue-100 text-[10px] uppercase font-bold tracking-tighter">Points Balance</p>
                <p className="text-3xl font-black italic">1,240 <span className="text-sm font-bold">pt</span></p>
              </div>
              <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 text-[10px] font-black uppercase tracking-widest">
                Card Detail
              </div>
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {showPasswordAlert && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start space-x-3 animate-pulse">
            <div className="p-2 bg-amber-200 rounded-xl shrink-0">
              <Star size={16} className="text-amber-700 fill-amber-700" />
            </div>
            <div>
              <p className="text-sm font-black text-amber-900">セキュリティ警告</p>
              <p className="text-[11px] font-bold text-amber-700 leading-relaxed mt-0.5">
                初期パスワード（0000）が設定されています。マイページより変更してください。
              </p>
            </div>
          </div>
        )}

        {latestNews && (
          <div 
            onClick={() => setIsNewsExpanded(!isNewsExpanded)}
            className="bg-white p-5 rounded-[32px] border border-blue-100 shadow-sm cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="bg-blue-500 text-white text-[9px] font-black px-2 py-1 rounded-lg uppercase shrink-0">News</div>
                
                <div className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-1 rounded-lg border border-slate-200 uppercase shrink-0">
                  {shopMap[latestNews.shop_id] || '全店舗'}
                </div>

                <h3 className="text-[14px] font-black text-slate-800 truncate">{latestNews.title}</h3>
              </div>
              <div className="text-slate-300 shrink-0">
                {isNewsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
            
            {isNewsExpanded && (
              <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {latestNews.image_url && (
                  <img 
                    src={latestNews.image_url} 
                    className="w-full h-auto rounded-2xl border border-slate-50 shadow-sm" 
                    alt="News" 
                  />
                )}
                {latestNews.body && (
                  <p className="text-[12px] text-slate-500 font-bold leading-relaxed whitespace-pre-wrap px-1">
                    {latestNews.body}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-4 px-1">
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
            <div className="flex flex-col items-center py-20 space-y-4">
              <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-slate-300 font-black text-xs uppercase tracking-widest">Loading...</p>
            </div>
          ) : filteredShifts.length > 0 ? (
            filteredShifts.map((shift, idx) => (
              <div key={idx} className="bg-white rounded-[28px] p-4 flex items-center space-x-4 border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-50">
                  <img 
                    src={shift.cast_members?.profile_image_url || 'https://via.placeholder.com/150'} 
                    alt={shift.hp_display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase">
                        {shift.cast_members?.store_name || 'SHOP'}
                      </span>
                      <h4 className="text-lg font-black text-slate-800 mt-1">{shift.hp_display_name}</h4>
                    </div>
                    <button className="text-slate-200 hover:text-blue-400 transition-colors">
                      <Heart size={20} />
                    </button>
                  </div>
                  <div className="flex items-center text-slate-400 mt-2">
                    <Clock size={14} className="mr-1 text-blue-300" />
                    <span className="text-sm font-black tracking-tighter">
                      {shift.start_time} — {shift.end_time}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200">
              <p className="text-slate-300 font-bold text-sm">本日の出勤データはありません</p>
            </div>
          )}
        </section>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-between items-center z-20">
        <button className="flex flex-col items-center text-blue-500">
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
        <button onClick={() => router.push('/user/profile')} className="flex flex-col items-center text-slate-300">
          <User size={24} />
          <span className="text-[10px] font-black mt-1">Mypage</span>
        </button>
      </nav>
    </div>
  );
}

export default function UserDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-300 uppercase tracking-widest text-xs">Loading Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}