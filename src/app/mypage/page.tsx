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
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const [newPassword, setNewPassword] = useState('');
  const [targetAmount, setTargetAmount] = useState(''); 
  const [theme, setTheme] = useState('pink');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) { 
          router.push('/login'); 
          return; 
        }
        const rawLoginId = user.email.split('@')[0];         
        const strippedLoginId = String(Number(rawLoginId));  

        const { data: members, error } = await supabase
          .from('cast_members')
          .select('*') 
          .in('login_id', [rawLoginId, strippedLoginId]);

        if (error) throw error;
        const member = members && members.length > 0 ? members[0] : null;

        if (member) {
          setProfile(member);
          setTargetAmount(String(member.monthly_target_amount || '')); 
          setTheme(member.theme_color || 'pink');
        }
      } catch (e) {
        console.error('Fetch Error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router, supabase]);

  const handleSaveSettings = async () => {
    if (!profile || !profile.login_id) return;
    setIsSaving(true);
    try {
      const cleanAmount = Number(String(targetAmount).replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))) || 0;
      const { error } = await supabase
        .from('cast_members')
        .update({ monthly_target_amount: cleanAmount, theme_color: theme })
        .eq('login_id', profile.login_id);
      if (error) throw error;
      alert('新しい設定が保存されました♪');
      window.location.reload();
    } catch (e: any) {
      alert('保存に失敗しました...');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!profile?.login_id || !newPassword) return;
    const { error } = await supabase.from('cast_members').update({ password: newPassword }).eq('login_id', profile.login_id);
    if (!error) { 
      alert('パスワードを変更しました✨'); 
      setNewPassword('');
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
      
      <CastHeader 
        shopName="マイページ"
        displayName={profile?.display_name}
        version="v4.2.1"
        bgColor={currentTheme.bg}
      />

      <main className="px-5 mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-gray-800 tracking-tighter">
            {profile?.display_name || "Guest"}
          </h2>
          <p className="text-pink-300 text-[10px] font-black tracking-[0.2em] uppercase italic">
            ID: {profile?.login_id}
          </p>
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-pink-50 rounded-[40px] p-8 shadow-xl shadow-pink-100/20 space-y-6">
            <div className="flex items-center gap-3 font-black text-gray-700">
              <div className="w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center text-xl shadow-inner">🎨</div>
              <h3 className="text-lg tracking-tight">テーマカラー</h3>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`w-10 h-10 rounded-full mx-auto shadow-sm transition-all ${t.bg} ${theme === t.id ? `scale-125 ring-4 ring-white shadow-lg` : 'opacity-40 hover:opacity-100'}`}
                />
              ))}
            </div>
          </section>

          <section className="bg-white border border-pink-50 rounded-[40px] p-8 shadow-xl shadow-pink-100/20 space-y-6">
            <div className="flex items-center gap-3 font-black text-gray-700">
              <div className="w-10 h-10 bg-pink-50 rounded-2xl flex items-center justify-center text-xl shadow-inner">💰</div>
              <h3 className="text-lg tracking-tight">今月の目標金額</h3>
            </div>
            <div className="relative">
              <input 
                type="text" 
                inputMode="numeric"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                className="w-full px-6 py-5 pl-12 rounded-3xl bg-gray-50 border-none font-black text-2xl text-gray-700 focus:ring-4 focus:ring-pink-100 transition-all"
              />
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-pink-300 font-black text-xl">¥</span>
            </div>
          </section>

          <button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={`w-full py-5 rounded-[32px] shadow-xl shadow-pink-200/50 font-black text-white text-lg active:scale-95 transition-all flex items-center justify-center gap-3
              ${isSaving ? 'bg-gray-300' : 'bg-gradient-to-r from-pink-400 to-rose-400'}
            `}
          >
            {isSaving ? 'Saving...' : '設定を保存する ✨'}
          </button>
        </div>

        <section className={`border-2 rounded-[40px] p-8 shadow-lg transition-all duration-500
          ${isDangerPassword ? 'bg-rose-50 border-rose-100 animate-pulse' : 'bg-gray-50 border-gray-100'}
        `}>
          <div className={`flex items-center gap-3 font-black mb-4 ${isDangerPassword ? 'text-rose-500' : 'text-gray-500'}`}>
            <span className="text-xl">{isDangerPassword ? '⚠️' : '🔒'}</span>
            <h3 className="text-lg">{isDangerPassword ? 'Security Alert' : 'Password'}</h3>
          </div>
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="新しいパスワード" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-white border border-gray-100 font-bold text-gray-700 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all"
            />
            <button 
              onClick={handlePasswordChange}
              className={`w-full font-black py-4 rounded-2xl text-white shadow-md active:scale-95 transition-all
                ${isDangerPassword ? 'bg-rose-400' : 'bg-gray-400'}
              `}
            >
              パスワードを更新
            </button>
          </div>
        </section>

        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="w-full py-10 text-gray-300 text-xs font-black tracking-[0.3em] hover:text-rose-400 transition-colors uppercase italic">Logout</button>
      </main>

      {/* 【修正箇所】余計なProps(onHome等)を削除しました */}
      {/* @ts-ignore */}
      <FixedFooter 
        pathname={pathname || ''} 
        onLogout={async () => { 
          await supabase.auth.signOut(); 
          router.push('/login'); 
        }} 
      />
    </div>
  );
}