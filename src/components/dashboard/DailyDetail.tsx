'use client';

import { format, startOfDay, isAfter } from 'date-fns';
import { ja } from 'date-fns/locale';

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
  const accentColor = theme === 'blue' ? 'text-cyan-600' : theme === 'black' ? 'text-gray-900' : 'text-pink-500';

  const displayOfficialS = shift?.start_time || 'OFF';
  const displayOfficialE = shift?.end_time || '';

  return (
    <section className="relative overflow-hidden rounded-[40px] border bg-white border-gray-100 shadow-2xl p-6 flex flex-col space-y-4">
      {/* ヘッダー部分は元のまま */}
      <div className="flex items-end justify-between px-1">
        <h3 className="text-2xl font-black text-gray-900 tracking-tighter">
          {format(date, 'M/d')}
          <span className="text-sm ml-1 text-gray-400 font-bold uppercase">
            ({format(date, 'EEE', { locale: ja })})
          </span>
        </h3>
        {isOfficial && displayOfficialS !== 'OFF' && (
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500 text-white">Confirmed</span>
        )}
      </div>

      {/* メインのシフト時間 */}
      <div className="px-1 py-2">
        {isOfficial && displayOfficialS !== 'OFF' ? (
          <div className={`text-[42px] font-black leading-none tracking-tighter ${accentColor}`}>
            {displayOfficialS}<span className="text-gray-200 mx-1">/</span>{displayOfficialE}
          </div>
        ) : (
          <div className="text-[24px] font-black text-gray-300 italic uppercase">Day Off</div>
        )}
      </div>

      {/* 予約リスト：ここをデータが出るように修正 */}
      <div className="space-y-2">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Next Missions</p>
        {reservations.length > 0 ? (
          <div className="space-y-3">
            {reservations.map((res: any, idx: number) => (
              <div key={idx} className="border-l-4 border-gray-100 pl-4 py-1">
                <div className="flex items-center gap-2">
                  {/* 📍 text-[31px] を適用 & データのキーを start_time / end_time に修正 */}
                  <span className={`text-[31px] font-black leading-none tracking-tighter ${accentColor}`}>
                    {res.start_time?.substring(0, 5)} - {res.end_time?.substring(0, 5)}
                  </span>
                  {/* 📍 type を nomination_type に修正 */}
                  <span className="text-[10px] font-black px-2 py-0.5 bg-gray-100 text-gray-400 rounded-md uppercase">
                    {res.nomination_type || 'FREE'}
                  </span>
                </div>
                {/* 📍 course / customerName を course_info / customer_name に修正 */}
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-sm font-black text-gray-600">{res.course_info || 'コース未定'}</span>
                  <span className="text-xs font-bold text-gray-400">{res.customer_name ? `${res.customer_name} 様` : ''}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center border-2 border-dashed border-gray-50 rounded-3xl">
            <p className="text-[10px] font-black text-gray-200 uppercase">No Missions</p>
          </div>
        )}
      </div>

      {/* 下部の実績エリアも元のまま */}
      {!isFuture && isOfficial && (
        <div className="mt-2 pt-4 border-t border-gray-50">
          <div className="bg-gray-50/50 rounded-[32px] p-4 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase">Daily Result</span>
              <div className={`flex items-center ${accentColor}`}>
                <span className="text-sm font-black mr-0.5 opacity-50">¥</span>
                <span className="text-2xl font-black tracking-tighter">
                  {(shift?.reward_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[{l:'F',v:shift?.reward_f},{l:'1st',v:shift?.reward_first},{l:'Main',v:shift?.reward_main}].map((item) => (
                <div key={item.l} className="text-center">
                  <p className="text-[8px] font-black text-gray-300 uppercase">{item.l}</p>
                  <p className={`text-lg font-black ${accentColor}`}>{item.v || 0}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}