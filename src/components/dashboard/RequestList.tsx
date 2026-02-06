'use client';

import { format, isAfter, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';

// 型定義
type RequestListProps = {
  multiDates: Date[];
  requestDetails: { [key: string]: { s: string; e: string } };
  setRequestDetails: (details: any) => void;
  shifts: any; // ★修正: any[] から any に変更（これでnullが来てもエラーになりません）
  onSubmit: () => void;
};

// 時間リスト生成
const TIME_OPTIONS: string[] = [];
for (let h = 11; h <= 23; h++) {
  TIME_OPTIONS.push(`${h}:00`);
  TIME_OPTIONS.push(`${h}:30`);
}

export default function RequestList({
  multiDates,
  requestDetails,
  setRequestDetails,
  shifts,
  onSubmit
}: RequestListProps) {
  const today = startOfDay(new Date());

  const sortedDates = [...multiDates]
    .filter((d) => isAfter(startOfDay(d), today))
    .sort((a, b) => a.getTime() - b.getTime());

  // 確定情報を取得するロジック
  const getOfficialBase = (dateStr: string) => {
    // 安全に配列化
    const safeShifts = Array.isArray(shifts) ? shifts : [];
    const s = safeShifts.find((x: any) => x.shift_date === dateStr);
    
    if (!s) return { s: 'OFF', e: 'OFF', exists: false };

    if (s.status === 'official') {
      return { s: s.start_time, e: s.end_time, exists: s.start_time !== 'OFF' };
    } else if (s.status === 'requested') {
      if (s.is_official_pre_exist || s.hp_start_time) {
        const underlyingS = s.hp_start_time || 'OFF';
        const underlyingE = s.hp_end_time || 'OFF';
        return { 
          s: underlyingS, 
          e: underlyingE, 
          exists: underlyingS !== 'OFF' 
        };
      }
    }
    return { s: 'OFF', e: 'OFF', exists: false };
  };

  // 重複チェック
  const redundantDates = sortedDates.filter((d) => {
    const key = format(d, 'yyyy-MM-dd');
    const base = getOfficialBase(key);
    
    const currentS = requestDetails[key]?.s || base.s;
    const currentE = requestDetails[key]?.e || base.e;

    return base.s === currentS && base.e === currentE;
  });

  // 時間逆転チェック
  const invalidDates = sortedDates.filter((d) => {
    const key = format(d, 'yyyy-MM-dd');
    const base = getOfficialBase(key);
    
    const s = requestDetails[key]?.s || base.s;
    const e = requestDetails[key]?.e || base.e;

    if (s === 'OFF' || e === 'OFF') return false;
    return s >= e;
  });

  const canSubmit = sortedDates.length > 0 && redundantDates.length === 0 && invalidDates.length === 0;

  if (sortedDates.length === 0) {
    return (
      <section className="bg-white rounded-[32px] border border-purple-100 p-8 shadow-xl text-center">
        <p className="text-gray-300 text-xs font-bold italic">明日以降の日付を選んでください📅</p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-[32px] border border-purple-100 p-5 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-purple-600 text-[14px] uppercase tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-4 bg-purple-500 rounded-full"></span>
          申請リスト ({sortedDates.length}件)
        </h3>
        {(invalidDates.length > 0 || redundantDates.length > 0) && (
          <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-lg animate-pulse">
            {invalidDates.length > 0 ? '⚠️ 時間の前後がおかしいです' : '⚠️ 時間を変更してください'}
          </span>
        )}
      </div>

      <div className="flex flex-col">
        {sortedDates.map((d) => {
          const key = format(d, 'yyyy-MM-dd');
          const base = getOfficialBase(key);
          const showOfficial = base.exists;
          
          const isOff = (requestDetails[key]?.s || base.s) === 'OFF';
          const defaultS = base.s !== 'OFF' ? base.s : '11:00';
          const defaultE = base.e !== 'OFF' ? base.e : '23:30';

          const isRedundant = (requestDetails[key]?.s || base.s) === base.s && (requestDetails[key]?.e || base.e) === base.e;
          
          const currentS = requestDetails[key]?.s || base.s;
          const currentE = requestDetails[key]?.e || base.e;
          const isInvalid = !isOff && currentS >= currentE;

          return (
            <div key={key} className={`py-3.5 border-b border-gray-100 last:border-0 flex flex-col space-y-2 transition-all 
              ${isRedundant ? 'bg-red-50/50 -mx-2 px-2 rounded-xl' : ''}
              ${isInvalid ? 'bg-yellow-50 -mx-2 px-2 rounded-xl ring-1 ring-yellow-200' : ''}
            `}>
              <div className="flex items-center justify-between px-1">
                <span className="text-[16px] font-black text-gray-800">
                  {format(d, 'M/d')} <span className="text-xs opacity-60">({format(d, 'E', { locale: ja })})</span>
                </span>
                
                {showOfficial && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 leading-none">確定</span>
                    <span className="text-[17px] font-black text-gray-400 leading-none">
                      {`${base.s}〜${base.e}`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {showOfficial ? (
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
                      value={requestDetails[key]?.s || defaultS}
                      onChange={(e) => setRequestDetails({ ...requestDetails, [key]: { ...requestDetails[key], s: e.target.value } })}
                      className={`w-24 bg-gray-100 py-2.5 rounded-lg text-center font-black text-base border-none focus:ring-1 focus:ring-purple-200 appearance-none ${isInvalid ? 'text-red-500 bg-red-50' : ''}`}
                      style={{ textAlignLast: 'center' }}
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <span className="text-gray-300 font-black text-lg">~</span>
                    <select
                      value={requestDetails[key]?.e || defaultE}
                      onChange={(e) => setRequestDetails({ ...requestDetails, [key]: { ...requestDetails[key], e: e.target.value } })}
                      className={`w-24 bg-gray-100 py-2.5 rounded-lg text-center font-black text-base border-none focus:ring-1 focus:ring-purple-200 appearance-none ${isInvalid ? 'text-red-500 bg-red-50' : ''}`}
                      style={{ textAlignLast: 'center' }}
                    >
                      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </>
                )}
                <button
                  onClick={() => {
                    const nextVal = isOff ? { s: defaultS, e: defaultE } : { s: 'OFF', e: 'OFF' };
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
        disabled={!canSubmit}
        className={`w-full font-black py-4 rounded-2xl text-lg shadow-lg active:scale-95 transition-all ${
          canSubmit 
            ? 'bg-purple-600 text-white shadow-purple-200' 
            : 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed'
        }`}
      >
        {canSubmit 
          ? '申請を確定する 🚀' 
          : invalidDates.length > 0 
            ? '終了時間は開始より後にしてください ⏳' 
            : '時間を変更してください ⚠️'
        }
      </button>
    </section>
  );
}