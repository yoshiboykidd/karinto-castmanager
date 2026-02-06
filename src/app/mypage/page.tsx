'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation';
import CastHeader from '@/components/dashboard/CastHeader';
import FixedFooter from '@/components/dashboard/FixedFooter';

// カラー定義
const THEMES = [
  { id: 'pink',   name: 'サクラ',   bg: 'bg-pink-500',   ring: 'ring-pink-300' },
  { id: 'blue',   name: 'マリン',   bg: 'bg-blue-500',   ring: 'ring-blue-300' },
  { id: 'black',  name: 'クール',   bg: 'bg-gray-800',   ring: 'ring-gray-500' },
  { id: 'white',  name: 'ピュア',   bg: 'bg-gray-500',   ring: 'ring-gray-300' }, // header用に少し濃く調整
  { id: 'red',    name: 'ルージュ', bg: 'bg-red-500',    ring: 'ring-red-300' },
  { id: 'yellow', name: 'レモン',   bg: 'bg-yellow-400', ring: 'ring-yellow-300' },
];

export default function MyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // フォーム状態
  const [newPassword, setNewPassword] = useState('');
  const [targetAmount, setTargetAmount] = useState(''); // 目標金額
  const [theme, setTheme] = useState('pink');           // テーマカラー
  const [isPwChanged, setIsPwChanged] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. ユーザー取得
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) { 
            router.push('/login'); 
            return; 
        }

        // 2. プロフィール取得
        const loginId = user.email.split('@')[0];
        console.log('Fetching profile for:', loginId);

        const { data: member, error } = await supabase
          .from('cast_members')
          .select('*, shops(shop_name)')
          .eq('login_id', loginId)
          .single();

        if (error) {
           console.error('Supabase Error:', error);
           // エラーでも処理を止めずに、空の状態で画面を出す
        }

        if (member) {
          setProfile(member);
          setTargetAmount(member.monthly_target_amount || ''); 
          setTheme(member.theme_color || 'pink');
        }

      } catch (e) {
        console.error('Unknown Error:', e);
      } finally {
        // ★重要: 成功しても失敗しても、必ずLoadingを終わらせる
        setLoading(false);
      }
    };
    fetchData();
  }, [router, supabase]);

  // 設定保存（目標＆カラー）
  const handleSaveSettings = async () => {
    if (!profile?.id) return;

    const { error } = await supabase
      .from('cast_members')
      .update({ 
        monthly_target_amount: Number(targetAmount) || 0,
        theme_color: theme 
      })
      .eq('id', profile.id);

    if (!error) {
      alert('設定を保存しました！🎨\nダッシュボードに戻ると反映されます。');
      setProfile({ ...profile, monthly_target_amount: targetAmount, theme_color: theme });
    } else {
      alert('保存に失敗しました...');
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 4) return alert('4文字以上にしてください');
    const { error } = await supabase.from('cast_members').update({ password: newPassword }).eq('id', profile.id);
    if (!error) { alert('変更しました✨'); setIsPwChanged(true); }
  };

  // 選択中のテーマ情報
  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-black text-pink-300 animate-pulse">
        LOADING...
      </div>
    );
  }

  const showPwChangeForm = profile?.password === '0000' && !isPwChanged;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans text-gray-800">
      
      {/* ★ヘッダーにもテーマ色を適用 */}
      <CastHeader 
        shopName={profile?.shops?.shop_name || "マイページ"} 
        displayName={profile?.display_name} 
        version="v3.6.0" 
        bgColor={currentTheme.bg} 
      />

      <main className="px-5 mt-6 space-y-8">
        
        {/* PW変更警告 */}
        {showPwChangeForm && (
          <section className="bg-red-50 border-2 border-red-100 rounded-[32px] p-6 shadow-lg animate-bounce-slow">
            <h3 className="text-red-500 font-black mb-2">⚠️ パスワード変更のお願い</h3>
            <div className="space-y-3">
              <input type="text" placeholder="新しいパスワード" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-5 py-3 rounded-xl bg-white border border-red-100 font-bold" />
              <button onClick={handlePasswordChange} className="w-full bg-red-400 text-white font-black py-3 rounded-xl">変更する</button>
            </div>
          </section>
        )}

        {/* 💰 目標金額設定 */}
        <section className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 font-black text-gray-700">
            <span className="text-xl">💰</span>
            <h3>今月の目標金額</h3>
          </div>
          <div className="relative">
            <input 
              type="number" 
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="例: 500000"
              className="w-full px-5 py-4 pl-10 rounded-2xl bg-gray-50 border border-gray-100 font-black text-xl text-gray-700 focus:ring-2 focus:ring-pink-200 focus:outline-none"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">¥</span>
          </div>
        </section>

        {/* 🎨 テーマカラー設定 */}
        <section className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 font-black text-gray-700">
            <span className="text-xl">🎨</span>
            <h3>アプリのテーマカラー</h3>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`w-10 h-10 rounded-full mx-auto shadow-sm transition-all ${t.bg} ${theme === t.id ? `scale-125 ring-2 ${t.ring} ring-offset-2` : 'opacity-70 hover:opacity-100'}`}
                title={t.name}
              />
            ))}
          </div>
          <p className="text-center text-xs font-bold text-gray-400 mt-2">
            現在のテーマ: {THEMES.find(t => t.id === theme)?.name}
          </p>
        </section>

        <button 
          onClick={handleSaveSettings}
          className={`w-full py-4 rounded-2xl shadow-lg font-black text-white text-lg active:scale-95 transition-all ${currentTheme.bg}`}
        >
          設定を保存する ✨
        </button>

        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="w-full py-4 text-gray-400 text-xs font-bold tracking-widest">LOGOUT</button>
      </main>

      <FixedFooter 
        pathname={pathname} 
        onHome={() => router.push('/')} 
        onSalary={() => router.push('/salary')} 
        onProfile={() => {}} 
        onLogout={async () => { await supabase.auth.signOut(); router.push('/login'); }} 
      />
    </div>
  );
}