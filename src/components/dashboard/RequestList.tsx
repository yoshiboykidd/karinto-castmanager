'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

type RequestListProps = {
  multiDates: Date[];
  requestDetails: { [key: string]: { s: string; e: string } };
  setRequestDetails: (details: any) => void;
  shifts: any[];
  onSubmit: () => void;
};

const TIME_OPTIONS: string[] = [];
for (let h = 11; h <= 23; h++) {
  TIME_OPTIONS.push(`${h}:00`);
  if (h !== 23) TIME_OPTIONS.push(`${h}:30`);
}

export default function RequestList({
  multiDates,
  requestDetails,
  setRequestDetails,
  shifts,
  onSubmit
}: RequestListProps) {
  if (multiDates.length === 0) {
    return (
      <section className="bg-white rounded-[32px] border border-purple-100 p-8 shadow-xl text-center">
        <p className="text-gray-300 text-xs font-bold italic">カレンダーから日付を選んでください📅</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-[32px] border border-purple-100 p-5 shadow-xl space-y-3">
      <h3 className="font-black text-purple-600 text-[14px] uppercase tracking-widest flex items-center gap-2">
        <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
        申請リスト ({multiDates.length}件)
      </h3>
      <div className="flex flex-col">
        {multiDates.map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          const officialShift = (shifts || []).find(s => s.shift_date === key && s.status === 'official');
          const isOff = requestDetails[key]?.s === 'OFF';

          return (
            <div key={key} className="py-3.5 border-b border-gray-100 last:border-0 flex flex-col space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[16px] font-black text-gray-800">
                  {format(d, 'M/d')} <span className="text-xs opacity-60">({format(d, 'E', { locale: ja })})</span>
                </span>
                {officialShift && (
                  <div className="flex items-center gap-1.5 flex-nowrap">
                    <span className="text-[12px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 leading-none whitespace-nowrap">確定</span>
                    <span className="text-[17px] font-black text-gray-600 leading-none whitespace-nowrap">
                      {officialShift.start_time === 'OFF' ? 'お休み' : `${officialShift.start_time}〜${officialShift.end_time}`}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {officialShift ? (
                  <span className="bg-orange-50 text-orange-500 text-[12px] font-black px-2.5 py-2 rounded-xl border border-orange-100 leading-none shrink-0">変更</span>
                ) : (
                  <span className="bg-green-50 text-green-500 text-[12px] font-black px-2.5 py-2 rounded-xl border border-green-100 leading-none shrink-0">新規</span>
                )}
                
                {isOff ? (
                  <div className="flex-1 bg-gray-50 py-2.5 rounded-lg text-center font-black text-gray-400 tracking-widest text-sm border border-dashed border-gray-200">
                    OFF (お休み)
                  </div>
                ) : (
                  <>
                    <select
                      value={requestDetails[key]?.s || '11:00'}
                      onChange={(e) => setRequestDetails({ ...requestDetails, [key]: { ...requestDetails[key], s: e.target.value } })}
                      className="w-24 bg-gray-100 py-2.5 rounded-lg text-center font-black text-base border-none focus:ring-1 focus:ring-purple-200 appearance-none"
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-gray-300 font-black text-lg">~</span>
                    <select
                      value={requestDetails[key]?.e || '23:00'}
                      onChange={(e) => setRequestDetails({ ...requestDetails, [key]: { ...requestDetails[key], e: e.target.value } })}
                      className="w-24 bg-gray-100 py-2.5 rounded-lg text-center font-black text-base border-none focus:ring-1 focus:ring-purple-200 appearance-none"
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </>
                )}
                <button
                  onClick={() => {
                    const nextVal = isOff ? { s: '11:00', e: '23:00' } : { s: 'OFF', e: 'OFF' };
                    setRequestDetails({ ...requestDetails, [key]: nextVal });
                  }}
                  className={`px-4 py-2.5 rounded-lg font-black text-[12px] transition-all border shrink-0 ${isOff ? 'bg-purple-500 text-white border-purple-500 shadow-md' : 'bg-white text-gray-400 border-gray-200'}`}
                >
                  {isOff ? '出勤にする' : 'お休み'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={onSubmit}
        className="w-full bg-purple-600 text-white font-black py-4 rounded-2xl text-lg shadow-lg active:scale-95 transition-all"
      >
        申請を確定する 🚀
      </button>
    </section>
  );
}