'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  Megaphone, 
  LogOut, 
  Home
} from 'lucide-react';

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // ナビゲーション項目の定義（PC/モバイル共通）
  const navItems = [
    { href: '/admin', icon: <LayoutDashboard size={22} />, label: 'TOP' },
    { href: '/admin/attendance', icon: <CalendarCheck size={22} />, label: '勤怠管理' },
    { href: '/admin/members', icon: <Users size={22} />, label: 'キャスト' },
    { href: '/admin/news', icon: <Megaphone size={22} />, label: 'ニュース' },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* 📍 デスクトップ用サイドバー (md以上で表示) */}
      <aside className="hidden md:flex w-64 flex-col bg-slate-900 text-white sticky top-0 h-screen shadow-2xl">
        <div className="p-8">
          <h2 className="text-2xl font-black italic tracking-tighter text-pink-500">KCM ADMIN</h2>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Management Console</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <AdminNavLink 
              key={item.href}
              href={item.href} 
              icon={item.icon} 
              label={item.label} 
              active={pathname === item.href}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link 
            href="/" 
            className="flex items-center gap-3 px-4 py-4 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
          >
            <LogOut size={18} />
            一般画面へ戻る
          </Link>
        </div>
      </aside>

      {/* 📍 メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 pb-24 md:pb-0">
          {children}
        </main>
      </div>

      {/* 📍 モバイル用ボトムナビゲーション (スマホ時のみ常に下部に固定) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-4 pb-6 pt-3 flex justify-around items-center shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${
                isActive ? 'text-pink-500' : 'text-slate-500'
              }`}
            >
              <div className={`p-2 rounded-2xl transition-all ${
                isActive ? 'bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.1)]' : ''
              }`}>
                {item.icon}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter ${
                isActive ? 'opacity-100' : 'opacity-40'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

// 📍 PCサイドバー用ナビパーツ
function AdminNavLink({ href, icon, label, active }: { href: string, icon: React.ReactNode, label: string, active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all font-black text-sm ${
        active 
        ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' 
        : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <span className={active ? 'text-white' : 'text-slate-500'}>{icon}</span>
      {label}
    </Link>
  );
}