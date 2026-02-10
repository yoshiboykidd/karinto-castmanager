'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation';
import CastHeader from '@/components/dashboard/CastHeader';
// @ts-ignore
import FixedFooter from '@/components/dashboard/FixedFooter';

const THEMES = [
  { id: 'pink',   name: 'サクラ',   bg: 'bg-[#FFB7C5]',   ring: 'ring-pink-200' },
  { id: 'blue',   name: 'マリン',   bg: 'bg-cyan-300',   ring: 'ring-cyan-200' },
  { id: 'yellow', name: 'レモン',   bg: 'bg-yellow-300', ring: 'ring-yellow-200' },
  { id: 'white',  name: 'ピュア',   bg: 'bg-gray-400',   ring: 'ring-gray-300' },
  { id: 'black',  name: 'クール',   bg: 'bg-gray-800',   ring: 'ring-gray-500' },
  { id: 'red',    name: 'ルージュ', bg: 'bg-red-500',    ring: 'ring-red-300' },
];

export default function MyPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [targetAmount, setTargetAmount] = useState(''); 
  const [theme, setTheme] = useState('pink');
  const [isSaving, setIsSaving] = useState(false);

  // 1. データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login'); return; }
        const rawLoginId = user.email?.split('@')[0] || '';         
        const strippedLoginId = String(Number(rawLoginId));  
        const { data: members } = await supabase.from('cast_members').select('*').in('login_id', [rawLoginId, strippedLoginId]);
        const member = members?.[0];
        if (member) {
          setProfile(member);
          setTargetAmount(String(member.monthly_target_amount || '')); 
          setTheme(member.theme_color || 'pink');
        }
      } finally { setLoading(false); }
    };
    fetchData();
  }, [router, supabase]);

  // 2. ポップアップ警告（確実に出すために useEffect の位置を調整）
  useEffect(() => {
    if (!loading && profile && String(profile.password) === '0000') {
      setTimeout(() => {
        alert('⚠️ セキュリティ警告\nパスワードが初期設定(0000)のままです。安全のため、今すぐ変更してください！');
      }, 500);
    }
  }, [loading, profile]);

  // 3. 設定保存関数
  const handleSaveSettings = async () => {
    if (!profile?.login_id) return;
    setIsSaving(true);
    try {
      const cleanAmount = Number(String(targetAmount).replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))) || 0;
      await supabase.from('cast_members').update({ monthly_target_amount: cleanAmount, theme_color: theme }).eq('login_id', profile.login_id);
      alert('設定を保存しました♪');
      window.location.reload();
    } finally { setIsSaving(false); }
  };

  // 4. パスワード変更関数（ここがボタンより上にないと波線が出ます）
  const handlePasswordChange = async () => {
    if (!profile?.login_id) return;
    if (!newPassword || newPassword.length < 4) {
      alert('パスワードは4文字以上で入力してください');
      return;
    }
    try {
      const { error } = await supabase.from('cast_members').update({ password: newPassword }).eq('login_id', profile.login_id);
      if (!error) { 
        alert('パスワードを変更しました✨'); 
        setNewPassword('');
        window.location.reload();
      } else {
        throw error;
      }
    } catch (e) {
      alert('変更に失敗しました...');
    }
  };

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];
  const isDangerPassword = profile?.password === '0000';

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDFE]">
      <div className="font-black text-pink-300 animate-pulse text-4xl italic tracking-tighter">KARINTO...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans text-gray-800 overflow-x-hidden">
      <CastHeader shopName="マイページ" displayName={profile?.display_name} bgColor={currentTheme.bg} />
      
      <main className="px-5 mt-4 space-y-3">
        
        {/* 目標金額 */}
        <section className="bg-white border border-pink-50 rounded-[32px] p-5 shadow-lg shadow-pink-100/10">
          <div className="flex items-center gap-2 mb-3 font-black text-gray-700">
            <span className="text-lg">💰</span>
            <h3 className="text-sm tracking-tight">目標金額</h3>
          </div>
          <div className="relative">
            <input 
              type="text" 
              inputMode="numeric" 
              value={targetAmount} 
              onChange={(e) => setTargetAmount(e.target.value)} 
              className="w-full px-5 py-3 pl-10 rounded-2xl bg-gray-50 border-none font-black text-xl text-gray-700 focus:ring-2 focus:ring-pink-100 transition-all" 
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-300 font-black text-lg">¥</span>
          </div>
        </section>

        {/* テーマカラー */}
        <section className="bg-white border border-pink-50 rounded-[32px] p-5 shadow-lg shadow-pink-100/10">
          <div className="flex items-center gap-2 mb-3 font-black text-gray-700">
            <span className="text-lg">🎨</span>
            <h3 className="text-sm tracking-tight">テーマカラー</h3>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {THEMES.map((t) => (
              <button key={t.id} onClick={() => setTheme(t.id)} className={`w-9 h-9 rounded-full mx-auto shadow-sm transition-all ${t.bg} ${theme === t.id ? `scale-110 ring-4 ring-white shadow-md` : 'opacity-40'}`} />
            ))}
          </div>
        </section>

        <button onClick={handleSaveSettings} disabled={isSaving} className={`w-full py-4 rounded-2xl shadow-md font-black text-white text-md active:scale-95 transition-all flex items-center justify-center gap-2 ${isSaving ? 'bg-gray-300' : 'bg-gradient-to-r from-pink-400 to-rose-400'}`}>
          {isSaving ? 'Saving...' : '設定を保存する ✨'}
        </button>

        {/* PW変更 */}
        <section className={`border-2 rounded-[32px] p-5 shadow-sm transition-all duration-500
          ${isDangerPassword ? 'bg-rose-50 border-rose-100 animate-pulse' : 'bg-gray-50 border-gray-100'}
        `}>
          <div className={`flex items-center gap-2 mb-3 font-black ${isDangerPassword ? 'text-rose-500' : 'text-gray-500'}`}>
            <span className="text-lg">{isDangerPassword ? '⚠️' : '🔒'}</span>
            <h3 className="text-sm uppercase tracking-tight">{isDangerPassword ? 'Security Alert' : 'Password'}</h3>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="新PW" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl bg-white border border-gray-200 font-bold text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-gray-100"
            />
            <button 
              onClick={handlePasswordChange}
              className={`px-4 py-2 font-black rounded-xl text-white text-xs shadow-sm active:scale-95 whitespace-nowrap
                ${isDangerPassword ? 'bg-rose-400' : 'bg-gray-400'}
              `}
            >
              更新
            </button>
          </div>
        </section>

      </main>

      {/* @ts-ignore */}
      <FixedFooter pathname={pathname || ''} onLogout={async () => { await supabase.auth.signOut(); router.push('/login'); }} />
    </div>
  );
}