'use client';

type CastHeaderProps = {
  shopName: string;
  syncTime: string;
  displayName: string;
  version: string;
};

export default function CastHeader({ shopName, syncTime, displayName, version }: CastHeaderProps) {
  return (
    <header className="bg-white px-6 pt-10 pb-4 rounded-b-[40px] shadow-sm border-b border-pink-50 relative">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-black text-pink-300 uppercase tracking-widest mb-1 leading-none underline decoration-pink-100 decoration-2 underline-offset-4">
            {version}
          </p>
          <p className="text-[13px] font-bold text-gray-400 mb-1">{shopName}店</p>
        </div>
        {syncTime && (
          <div className="bg-gray-50 px-2 py-1 rounded-lg border border-gray-100 flex items-center gap-1">
            <span className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></span>
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">
              HP同期: {syncTime}
            </span>
          </div>
        )}
      </div>
      <h1 className="text-3xl font-black flex items-baseline gap-0.5 leading-tight">
        {displayName || 'キャスト'}
        <span className="text-[14px] text-pink-400 font-bold ml-0.5">さん</span>
      </h1>
    </header>
  );
}