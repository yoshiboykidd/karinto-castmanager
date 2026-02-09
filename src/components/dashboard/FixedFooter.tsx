'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, BarChart2, User, LogOut } from 'lucide-react';

interface FixedFooterProps {
  pathname: string;
  onLogout?: () => void;
}

export default function FixedFooter({ pathname, onLogout }: FixedFooterProps) {
  const router = useRouter();

  const menuItems = [
    { label: 'ホーム', icon: Home, path: '/', action: () => router.push('/') },
    { label: '実績', icon: BarChart2, path: '/salary', action: () => router.push('/salary') },
    // 📍 404回避のため /mypage に固定
    { label: 'マイページ', icon: User, path: '/mypage', action: () => router.push('/mypage') },
    { label: 'ログアウト', icon: LogOut, path: null, action: onLogout },
  ];

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-4 bg-gradient-to-t from-white via-white/95 to-transparent">
      <nav className="max-w-md mx-auto bg-white/80 backdrop-blur-xl border border-pink-100 rounded-[32px] shadow-[0_8px_32px_rgba(255,182,193,0.15)] px-6 py-3">
        <ul className="flex justify-between items-center">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <li key={item.label}>
                <button
                  onClick={item.action}
                  className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                    isActive ? 'scale-110' : 'opacity-40 hover:opacity-100'
                  }`}
                >
                  <div className={`p-2 rounded-2xl ${
                    isActive ? 'bg-pink-400 text-white shadow-lg shadow-pink-200' : 'text-gray-400'
                  }`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-black ${
                    isActive ? 'text-pink-500' : 'text-gray-400'
                  }`}>
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </footer>
  );
}