'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, parseISO, getDate } from 'date-fns';
import { ja } from 'date-fns/locale';
import DashboardCalendar from '@/components/DashboardCalendar';

export default function Page() {
  const router = useRouter();
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const [shifts, setShifts] = useState<any[]>([]);
  const [castProfile, setCastProfile] = useState<any>(null);
  const [newsList, setNewsList] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewDate, setViewDate] = useState(new Date()); 
  const [loading, setLoading] = useState(true);
  
  const [editReward, setEditReward] = useState<{f:any, first:any, main:any, amount:any}>({ 
    f: '', first: '', main: '', amount: '' 
  });

  useEffect(() => { fetchInitialData(); }, [supabase, router]);

  async function fetchInitialData() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/login'); return; }
    const loginId = session.user.email?.replace('@karinto-internal.com', '');
    const [castRes, shiftRes] = await Promise.all([
      supabase.from('cast_members').select('*').eq('login_id', loginId).single(),
      supabase.from('shifts').select('*').eq('login_id', loginId).order('shift_date', { ascending: true }),
    ]);
    setCastProfile(castRes.data);
    setShifts(shiftRes.data || []);
    setLoading(false);
  }

  // ✨ 入力データの出し分け
  useEffect(() => {
    if (!selectedDate) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const shift = shifts.find(s => s.shift_date === dateStr);
    
    // nullやundefined（未入力）は '' にして placeholder を出す
    // 0が保存されていれば 0（実数）としてセット
    setEditReward({
      f: shift?.f_count ?? '',
      first: shift?.first_request_count ?? '',
      main: shift?.main_request_count ?? '',
      amount: shift?.reward_amount ?? ''
    });
  }, [selectedDate, shifts]);

  const handleSaveReward = async () => {
    if (!selectedDate) return;
    if (editReward.f === '' || editReward.first === '' || editReward.main === '') {
      alert('「フリー」「初指名」「本指名」を入力してください（無い場合は 0）');
      return;
    }
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const { error } = await supabase.from('shifts').update({
      f_count: Number(editReward.f),
      first_request_count: Number(editReward.first),
      main_request_count: Number(editReward.main),
      reward_amount: Number(editReward.amount) || 0
    }).eq('login_id', castProfile.login_id).eq('shift_date', dateStr);
    
    if (error) alert('失敗');
    else { fetchInitialData(); alert('保存完了💰'); }
  };

  if (loading) return <div className="p-10 text-pink-300">Loading...</div>;
  const selectedShift = shifts.find(s => selectedDate && s.shift_date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="min-h-screen bg-[#FFF9FA] text-gray-800 pb-40 font-sans overflow-x-hidden">
      <header className="bg-white px-5 pt-12 pb-6 border-b border-pink-100 rounded-b-[30px]">
        <h1 className="text-3xl font-black">{castProfile?.display_name || 'Cast'}さん🌸</h1>
      </header>

      <main className="px-3 mt-4 space-y-4">
        {/* 📅 カレンダー */}
        <section className="bg-white p-2 rounded-[22px] border border-pink-200">
          <DashboardCalendar 
            shifts={shifts} 
            selectedDate={selectedDate} 
            onSelect={setSelectedDate}
            month={viewDate}
            onMonthChange={setViewDate} 
          />
        </section>

        {/* ✍️ 入力フォーム */}
        <section className="bg-white rounded-[24px] border border-pink-300 overflow-hidden shadow-xl">
          <div className="bg-[#FFF5F6] p-3 px-4 flex justify-between items-center">
            <h3 className="text-lg font-black">{selectedDate ? format(selectedDate, 'M/d (eee)', { locale: ja }) : '日付選択'}</h3>
            <span className="text-pink-500 font-black">{selectedShift ? `${selectedShift.start_time}~${selectedShift.end_time}` : 'OFF'}</span>
          </div>

          {selectedShift && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['f', 'first', 'main'].map((key) => (
                  <div key={key} className="text-center space-y-1">
                    <label className="text-sm font-black text-gray-900">{key === 'f' ? 'フリー' : key === 'first' ? '初指名' : '本指名'}</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={editReward[key as keyof typeof editReward]} 
                      onFocus={(e) => e.target.select()}
                      onChange={e => setEditReward({...editReward, [key]: e.target.value})}
                      /* ✨ 空ならグレー(placeholder風)、数字があればピンク */
                      className={`w-full text-center py-2 bg-[#FAFAFA] rounded-lg font-black text-2xl border border-gray-100 focus:ring-0 focus:border-pink-300 ${editReward[key as keyof typeof editReward] === '' ? 'text-gray-200' : 'text-pink-500'}`}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-pink-50/30 p-3 rounded-xl border border-pink-100 flex items-center justify-between">
                <label className="font-black text-gray-900">本日の報酬</label>
                <div className="flex items-center text-right flex-1">
                  <span className="text-pink-200 text-2xl font-black mr-1">¥</span>
                  <input 
                    type="text" 
                    placeholder="0"
                    value={editReward.amount ? Number(editReward.amount).toLocaleString() : ''} 
                    onFocus={(e) => e.target.select()}
                    onChange={e => { const val = e.target.value.replace(/,/g, ''); if (/^\d*$/.test(val)) setEditReward({...editReward, amount: val}); }} 
                    className={`w-full text-right bg-transparent font-black text-3xl focus:ring-0 border-none ${editReward.amount === '' ? 'text-gray-200' : 'text-pink-500'}`}
                  />
                </div>
              </div>

              <button onClick={handleSaveReward} className="w-full bg-pink-500 text-white font-black py-5 rounded-xl text-xl shadow-lg active:scale-95 transition-all">実績を保存 💾</button>
            </div>
          )}
        </section>

        <div className="text-center py-4">
          <p className="text-[10px] font-bold text-gray-200 uppercase">Karinto Cast Manager ver 1.15.0</p>
        </div>
      </main>
    </div>
  );
}