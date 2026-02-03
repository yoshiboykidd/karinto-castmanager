'use client';

type FixedFooterProps = {
  pathname: string;
  onHome: () => void;
  onSalary: () => void;
  onLogout: () => void;
};

export default function FixedFooter({ pathname, onHome, onSalary, onLogout }: FixedFooterProps) {
  const isHome = pathname === '/' || !pathname;
  const isSalary = pathname === '/salary';

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-8 pt-4">
      <nav className="flex justify-around items-center max-w-md mx-auto px-6">
        <button onClick={onHome} className="flex flex-col items-center gap-1.5">
          <span className={`text-2xl ${isHome ? 'opacity-100' : 'opacity-30'}`}>🏠</span>
          <span className={`text-[9px] font-black uppercase ${isHome ? 'text-pink-500' : 'text-gray-300'}`}>ホーム</span>
        </button>
        <button onClick={onSalary} className="flex flex-col items-center gap-1.5">
          <span className={`text-2xl ${isSalary ? 'opacity-100' : 'opacity-30'}`}>💰</span>
          <span className={`text-[9px] font-black uppercase ${isSalary ? 'text-pink-500' : 'text-gray-300'}`}>給与明細</span>
        </button>
        <button onClick={onLogout} className="flex flex-col items-center gap-1.5 text-gray-300">
          <span className="text-2xl opacity-30">🚪</span>
          <span className="text-[9px] font-black uppercase">ログアウト</span>
        </button>
      </nav>
    </footer>
  );
}