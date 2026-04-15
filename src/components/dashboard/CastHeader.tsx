'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
// 📍 RefreshCw（更新アイコン）を追加
import { LogOut, RefreshCw } from 'lucide-react';
import { format, isValid, parseISO, isToday } from 'date-fns';

type CastHeaderProps = {
  shopName: string;
  syncTime?: string | null;
  displayName?: string;
  version?: string;
  bgColor?: string; 
};

export default function CastHeader({ 
  shopName, 
  syncTime, 
  displayName, 
  version, // 📍 引数に version を追加し、波線エラーを解消しました
  bgColor 
}: CastHeaderProps) {
  const router = useRouter();
  const [seasonalEmoji, setSeasonalEmoji] = useState('☃️');
  const [isPanicMode, setIsPanicMode] = useState(false);

  const formattedTime = useMemo(() => {
    if (!syncTime) return '--:--';
    try {
      const date = typeof syncTime === 'string' ? parseISO(syncTime) : syncTime;
      if (!isValid(date)) return String(syncTime);
      if (isToday(date)) return format(date, 'HH:mm');
      return format(date, 'M/d HH:mm');
    } catch (e) {
      return '--:--';
    }
  }, [syncTime]);

  useEffect(() => {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) setSeasonalEmoji('🌸');
    else if (month >= 6 && month <= 8) setSeasonalEmoji('🌻');
    else if (month >= 9 && month <= 11) setSeasonalEmoji('🍁');
    else setSeasonalEmoji('☃️');
  }, []);

  const isThemed = !!bgColor;

  return (
    <header className={`sticky top-0 z-50 w-full backdrop-blur-xl border-b transition-colors duration-300
      ${isThemed ? 'border-white/10' : 'bg-white/80 border-slate-100 shadow-sm'}
    `}
    style={isThemed ? { backgroundColor: bgColor } : {}}
    >
      <div className="px-5 py-3 max-w-md mx-auto relative overflow-hidden">
        {isThemed && (
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        )}
        
        <div className="flex justify-between items-center relative z-10">
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full">
                {shopName || 'SHOP'}
              </span>
              <span className={`text-[10px] font-black uppercase tracking-widest
                ${isThemed ? 'text-white/60' : 'text-slate-300'}
              `}>
                Ver {version || '1.0'}
              </span>
            </div>
            <h1 className={`text-xl font-black tracking-tight flex items-center gap-2
              ${isThemed ? 'text-white' : 'text-slate-800'}
            `}>
              {displayName || 'Cast Portal'} 
              <span className="text-sm animate-bounce-slow">{seasonalEmoji}</span>
            </h1>
          </div>

          <div className="flex flex-col items-end space-y-1.5">
            
            {/* 📍 HP SYNCの横にリロードボタンを配置 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.reload()}
                className={`w-[42px] h-[42px] rounded-xl border flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer
                  ${isThemed 
                    ? 'bg-white/20 border-white/20 text-white hover:bg-white/30' 
                    : 'bg-white border-pink-50 text-gray-400 hover:bg-gray-50'
                  }
                `}
              >
                <RefreshCw size={18} />
              </button>

              <div className={`w-[128px] h-[42px] rounded-xl border flex items-center justify-center gap-2 shadow-sm transition-colors
                ${isThemed 
                  ? 'bg-white/20 border-white/20 text-white' 
                  : 'bg-green-50/80 border-green-100'
                }
              `}>
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
                    ${isThemed ? 'bg-white' : 'bg-green-400'}
                  `}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5
                    ${isThemed ? 'bg-white' : 'bg-green-500'}
                  `}></span>
                </span>
                <div className="flex flex-col leading-none items-center">
                  <span className={`text-[8px] font-black uppercase tracking-tighter mb-0.5
                    ${isThemed ? 'text-white/70' : 'text-green-600/50'}
                  `}>HP SYNC</span>
                  <span className={`font-black tracking-tight whitespace-nowrap
                    ${formattedTime.length > 5 ? 'text-[11px]' : 'text-[13px]'}
                    ${isThemed ? 'text-white' : 'text-green-600'}
                  `}>{formattedTime}</span>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPanicMode(true);
              }}
              className={`w-[128px] h-[42px] rounded-xl border flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 group z-10 cursor-pointer
                ${isThemed
                  ? 'bg-white/20 border-white/20 text-white hover:bg-white/30'
                  : 'bg-rose-50/80 border-rose-100 hover:bg-rose-100'
                }
              `}
            >
              <LogOut className={`w-4 h-4 shrink-0 group-hover:rotate-12 transition-transform
                ${isThemed ? 'text-white' : 'text-rose-400'}
              `} />
              <div className="flex flex-col leading-none items-center">
                <span className={`text-[8px] font-black uppercase tracking-tighter mb-0.5
                  ${isThemed ? 'text-white/70' : 'text-rose-400/50'}
                `}>SECRET</span>
                <span className={`text-[13px] font-black tracking-tight
                  ${isThemed ? 'text-white' : 'text-rose-500'}
                `}>ESCAPE</span>
              </div>
            </button>
            
          </div>
        </div>
      </div>
    </header>
  );
}