'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Clock, MapPin, LogOut, Home, Search, Heart, User, ChevronDown, ChevronUp } from 'lucide-react';

const shopMap: Record<string, string> = {
  '001': '神田', '002': '赤坂', '003': '秋葉原', '004': '上野',
  '005': '渋谷', '006': '池袋西口', '007': '五反田', '008': '大宮',
  '009': '吉祥寺', '010': '大久保', '011': '池袋東口', '012': '小岩'
};

function DashboardContent() {
  const router = useRouter();
  const supabase = createClient();
  const [activeStore, setActiveStore] = useState('');
  const [shifts, setShifts] = useState<any[]>([]);
  const [displayStores, setDisplayStores] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sessionData = localStorage.getItem('user_session');
    if (!sessionData) { router.push('/user/login'); return; }

    // 📍 修正：マイページの設定(V2)を元に「表示店舗」を確定
    const savedV2 = localStorage.getItem('user_favorite_shops_v2');
    let targetStores: string[] = [];

    if (savedV2) {
      const parsed = JSON.parse(savedV2);
      // visible が true のものだけを取得
      targetStores = parsed.filter((s: any) => s.visible === true).map((s: any) => s.name);
    }

    if (targetStores.length === 0) {
      targetStores = ['神田', '赤坂', '秋葉原', '上野', '渋谷', '池袋西口', '五反田', '大宮', '吉祥寺', '大久保', '池袋東口', '小岩'];
    }

    setDisplayStores(targetStores);
    setActiveStore(targetStores[0]);

    const fetchData = async () => {
      setLoading(true);
      const today = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
      const { data: shiftData } = await supabase.from('shifts').select('*').eq('shift_date', today).eq('status', 'official');
      if (shiftData) {
        const { data: castData } = await supabase.from('cast_members').select('*');
        const merged = shiftData.map(s => {
          const cast = castData?.find(c => String(c.login_id) === String(s.login_id));
          return {
            ...s,
            computed_store_name: shopMap[String(s.login_id).substring(0, 3)] || '未設定',
            profile_image_url: cast?.profile_image_url || cast?.image_url || null
          };
        });
        setShifts(merged);
      }
      setLoading(false);
    };
    fetchData();
  }, [router, supabase]);

  const filteredShifts = shifts.filter(s => s.computed_store_name === activeStore);

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800 font-sans">
      <header className="bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <h1 className="text-xl font-black tracking-tighter italic uppercase">Portal</h1>
        <button onClick={() => { localStorage.removeItem('user_session'); router.push('/user/login'); }}><LogOut size={20} className="text-slate-400" /></button>
      </header>
      <main className="px-6 pt-6 space-y-6">
        <section>
          <div className="flex space-x-2 overflow-x-auto pb-2 no-scrollbar">
            {displayStores.map((store) => (
              <button key={store} onClick={() => setActiveStore(store)} className={`px-5 py-2.5 rounded-2xl font-black text-sm transition-all whitespace-nowrap ${activeStore === store ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100'}`}>
                {store}
              </button>
            ))}
          </div>
        </section>
        <section className="space-y-3">
          {loading ? <div className="text-center py-20 text-slate-300 font-black text-xs">Loading...</div> : 
            filteredShifts.length > 0 ? filteredShifts.map((shift, idx) => (
              <div key={idx} className="bg-white rounded-[28px] p-4 flex items-center space-x-4 border border-slate-100 shadow-sm">
                <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0"><img src={shift.profile_image_url || 'https://placehold.jp/150x150.png?text=No%20Image'} className="w-full h-full object-cover" /></div>
                <div className="flex-1">
                  <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase">{shift.computed_store_name}</span>
                  <h4 className="text-lg font-black text-slate-800 mt-1">{shift.hp_display_name}</h4>
                  <div className="flex items-center text-slate-400 mt-2 text-sm font-black"><Clock size={14} className="mr-1 text-blue-300" /> {shift.start_time} — {shift.end_time}</div>
                </div>
              </div>
            )) : <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-slate-200 text-slate-300 font-bold text-sm">出勤データはありません</div>
          }
        </section>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-8 py-4 flex justify-between items-center z-20">
        <button onClick={() => router.push('/user/dashboard')} className="flex flex-col items-center text-blue-500"><Home size={24} /><span className="text-[10px] font-black mt-1">Home</span></button>
        <button className="flex flex-col items-center text-slate-300"><Search size={24} /><span className="text-[10px] font-black mt-1">Search</span></button>
        <button className="flex flex-col items-center text-slate-300"><Heart size={24} /><span className="text-[10px] font-black mt-1">Favorite</span></button>
        <button onClick={() => router.push('/user/profile')} className="flex flex-col items-center text-slate-300"><User size={24} /><span className="text-[10px] font-black mt-1">Mypage</span></button>
      </nav>
    </div>
  );
}

export default function UserDashboard() { return <Suspense fallback={null}><DashboardContent /></Suspense>; }