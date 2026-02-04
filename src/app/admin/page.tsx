'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr'; // ✨ ここを修正
import { Users, Calendar, Bell, ArrowRight, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null);
  
  // ✨ クライアント作成方法を修正
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  useEffect(() => {
    const fetchProfile = async () => {
      // 1. セッション（ログイン中か）の確認
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 2. ログイン中のユーザー情報をDBから取得
      const { data } = await supabase
        .from('cast_members')
        .select('*')
        .eq('login_id', session.user.email?.split('@')[0])
        .single();
      
      setProfile(data);
    };
    fetchProfile();
  }, [supabase]);

  // ロード中表示
  if (!profile) {
    return (
      <div className="flex items-center justify-center h-[50vh] text-slate-400 font-bold">
        Loading Dashboard...
      </div>
    );
  }

  // メニュー項目の定義
  const menuCards = [
    { 
      title: 'シフト申請管理', 
      desc: 'キャストからのシフト希望を確認し、HP転記用のリストを表示します。', 
      icon: Calendar, 
      href: '/admin/requests',
      color: 'bg-purple-600',
      shadow: 'shadow-purple-100'
    },
    { 
      title: 'キャスト管理', 
      desc: '新規入店登録、プロフィールの編集、パスワードリセットなど。', 
      icon: Users, 
      href: '/admin/casts',
      color: 'bg-blue-600',
      shadow: 'shadow-blue-100'
    },
    { 
      title: 'お知らせ配信', 
      desc: 'キャストアプリのトップに表示する「News」を作成・配信します。', 
      icon: Bell, 
      href: '/admin/news',
      color: 'bg-orange-500',
      shadow: 'shadow-orange-100'
    },
    { 
      title: '店舗設定', 
      desc: '店舗情報の確認や設定を行います。（開発中）', 
      icon: Settings, 
      href: '/admin/settings',
      color: 'bg-slate-500',
      shadow: 'shadow-slate-100'
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* 1. ウェルカムヘッダー */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          Dashboard
        </h1>
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-lg font-bold text-slate-600">
              Welcome back, {profile.display_name} 👋
            </p>
            <p className="text-sm text-slate-400 font-medium mt-1">
              {profile.role === 'master' 
                ? '👑 Master Admin (全店舗データアクセス権限)' 
                : '👤 Shop Admin (担当店舗管理権限)'}
            </p>
          </div>
          
          {/* 所属店舗バッジ */}
          {profile.home_shop_id && profile.role !== 'master' && (
             <span className="inline-block bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200">
               Shop ID: {profile.home_shop_id}
             </span>
          )}
        </div>
      </div>

      {/* 2. メニューカードグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuCards.map((card) => (
          <Link 
            key={card.title} 
            href={card.href}
            className="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
          >
            {/* ホバー時の背景装飾 */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${card.color} opacity-5 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:opacity-10`} />

            <div className="relative z-10">
              {/* アイコン */}
              <div className={`${card.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-5 shadow-lg ${card.shadow} group-hover:scale-110 transition-transform duration-300`}>
                <card.icon size={28} strokeWidth={2.5} />
              </div>

              {/* タイトル & 矢印 */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-slate-800">
                  {card.title}
                </h3>
                <ArrowRight size={20} className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-2 transition-all duration-300" />
              </div>

              {/* 説明文 */}
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                {card.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}