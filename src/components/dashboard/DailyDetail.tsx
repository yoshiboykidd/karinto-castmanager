'use client';

import { format, startOfDay, isAfter } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Clock, User, ShieldCheck } from 'lucide-react'; // アイコン追加で直感的に

type DailyDetailProps = {
  date: Date;
  dayNum: number;
  shift: any; 
  reservations?: any[]; 
  theme?: string; 
};

export default function DailyDetail({
  date,
  dayNum,
  shift,
  reservations = [],
  theme = 'pink'
}: DailyDetailProps) {
  if (!date) return null;

  const today = startOfDay(new Date());
  const targetDate = startOfDay(date);
  const isFuture = isAfter(targetDate, today);

  const isOfficial = shift?.status === 'official';
  const themeColors: any = {
    pink: 'text-pink-500 bg-pink-50 border-pink-100',
    blue: 'text-cyan-600 bg-cyan-50 border-cyan-100',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-100',
    black: 'text-gray-900 bg-gray-100 border-gray-200',
  };
  
  // 文字色のみの指定
  const textColors: any = {
    pink: 'text-pink-500',
    blue: 'text-cyan-600',
    yellow: 'text-yellow-600',
    black: 'text-gray-900',
  };

  const accentColor = textColors[theme] || textColors.pink;
  const cardTheme = themeColors[theme] || themeColors.pink;

  const displayOfficialS = shift?.start_time || 'OFF';
  const displayOfficialE = shift?.end_time || '';

  return (
    <section className="relative overflow-hidden rounded-[40px] border bg-white border-gray-100 shadow-2xl p-6 flex flex-col space-y-4 transition-all duration-300">
      
      {/* 1. 日付ヘッダー：より洗練された印象に */}
      <div className="flex items-end justify-between px-1">
        <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-none">
          {format(date, 'M/d')}
          <span className="text-sm ml-1 text-gray-400 font-bold uppercase">
            {format(date, 'EEE', { locale: ja })}
          </span>
        </h3>
        {isOfficial && displayOfficialS !== 'OFF' && (
          <span className="text-[10px] font-black px-3 py-1 rounded-full bg-blue-500 text-white shadow-sm uppercase tracking-widest">
            Confirmed
          </span>
        )}
      </div>

      {/* 2. メイン時間：text-[31px] のインパクト */}
      <div className="px-1 py-2">
        {isOfficial && displayOfficialS !== 'OFF' ? (
          <div className={`text-[42px] font-black leading-none tracking-tighter ${accentColor}`}>
            {displayOfficialS}<span className="text-gray-200 mx-1">/</span>{displayOfficialE}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-[24px] font-black text-gray-300 italic uppercase tracking-tighter">Day Off</span>
          </div>
        )}
      </div>

      {/* 3. 予約リスト：ここをインパクト重視に改造 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Next Missions</p>
          <span className="text-[10px] font-bold text-gray-300">{reservations.length}件の予約</span>
        </div>

        {reservations.length > 0 ? (
          <div className="space-y-2">
            {reservations.map((res: any, idx: number) => (
              <div key={idx} className="group relative bg-white rounded-[28px] p-5 border border-gray-100 shadow-sm active:scale-[0.98] transition-all">
                {/* 予約カード内の時間：ここもデカめに */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      <Clock size={10} /> Time Slot
                    </span>
                    <span className={`text-[28px] font-black leading-none tracking-tighter ${accentColor}`}>
                      {res.startTime}ー{res.endTime}
                    </span>
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl font-black text-[11px] border uppercase tracking-widest ${cardTheme}`}>
                    {res.type || 'Free'}
                  </div>
                </div>

                {/* 顧客・コース情報 */}
                <div className="flex items-center gap-4 mt-2">
                   <div className="flex-1">
                      <span className="flex items-center gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        <User size={10} /> Course / Customer
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-black text-gray-800 tracking-tight">{res.course || 'コース未定'}</span>
                        <span className="text-xs font-bold text-gray-400">{res.customerName ? `${res.customerName} 様` : ''}</span>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
            <p className="text-xs font-bold text-gray-300 italic tracking-widest uppercase">No Reservations Yet</p>
          </div>
        )}
      </div>

      {/* 4. 実績表示：過去の日付のみ表示 */}
      {!isFuture && isOfficial && (
        <div className="mt-2 pt-4 border-t border-gray-50">
          <div className={`rounded-[32px] p-5 border ${cardTheme} shadow-inner`}>
            <div className="flex items-center justify-between mb-4">
               <span className="flex items-center gap-1 text-[10px] font-black opacity-60 uppercase tracking-widest">
                 <ShieldCheck size={12} /> Daily Result
               </span>
               <div className="flex items-baseline">
                  <span className="text-sm font-black mr-1 opacity-50">¥</span>
                  <span className="text-3xl font-black tracking-tighter">
                    {(shift?.reward_amount || 0).toLocaleString()}
                  </span>
               </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'F', val: shift?.reward_f },
                { label: '1st', val: shift?.reward_first },
                { label: 'Main', val: shift?.reward_main }
              ].map((item) => (
                <div key={item.label} className="bg-white/60 backdrop-blur-sm rounded-2xl py-2 text-center">
                  <p className="text-[9px] font-black opacity-40 uppercase">{item.label}</p>
                  <p className="text-lg font-black">{item.val || 0}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}