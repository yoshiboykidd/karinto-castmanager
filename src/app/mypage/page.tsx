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
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('cast_members')
        .select('*')
        .eq('login_id', session.user.email?.split('@')[0])
        .single();

      if (!error && data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [supabase, router]);

  // テーマ変更処理
  const handleThemeChange = async (themeId: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from('cast_members')
      .update({ theme_color: themeId })
      .eq('login_id', profile.login_id);

    if (!error) {
      setProfile({ ...profile, theme_color: themeId });
    }
  };

  // 📍 ログインパスワード ＆ DBテーブル 同時書き換えロジック
  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 4) {
      alert('パスワードは4文字以上で入力してください');
      return;
    }

    setIsSaving(true);
    try {
      // 1. 【最重要】Supabase Authのログインパスワードを更新
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      // 2. データベース側のパスワード表示用カラムも更新
      const { error: dbError } = await supabase
        .from('cast_members')
        .update({ password: newPassword })
        .eq('login_id', profile.login_id);

      if (dbError) throw dbError;

      alert('ログインパスワードを更新しました。次回から新しいパスワードでログインしてください。');
      setNewPassword('');
    } catch (err: any) {
      alert('エラーが発生しました: ' + (err.message || '通信失敗'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return null;
  if (!profile) return null;

  const currentTheme = THEMES.find(t => t.id === profile.theme_color) || THEMES[0];
  const isDanger = profile.password === '0000';

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-32 font-sans overflow-x-hidden text-gray-800">
      <CastHeader 
        displayName={profile.display_name} 
        shopName={profile.shop_name || '所属店舗なし'} 
        syncTime={profile.last_sync_at}
        bgColor={currentTheme.bg}
      />

      <main className="px-6 -mt-8 relative z-10 space-y-6">
        {/* プロフィールカード */}
        <section className="bg-white rounded-[40px] p-8 shadow-xl shadow-pink-100/20 border border-gray-50 flex flex-col items-center">
          <div className={`w-24 h-24 rounded-full ${currentTheme.bg} mb-4 flex items-center justify-center text-white text-3xl font-black shadow-inner ring-8 ${currentTheme.ring} ring-opacity-50`}>
            {profile.display_name?.substring(0, 1)}
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-1 italic">{profile.display_name}</h2>
          <p className="text-gray-400 font-bold text-sm tracking-widest uppercase mb-6">{profile.login_id}</p>
          
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="bg-gray-50 p-4 rounded-3xl text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Target</p>
              <p className="text-xl font-black text-gray-700">¥{(profile.monthly_target_amount || 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-3xl text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Point</p>
              <p className="text-xl font-black text-gray-700">{profile.current_points || 0}pt</p>
            </div>
          </div>
        </section>

        {/* テーマ設定 */}
        <section className="bg-white rounded-[40px] p-6 shadow-xl shadow-pink-100/20 border border-gray-50">
          <h3 className="text-[10px] font-black text-gray-400 ml-2 mb-4 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1 h-3 bg-pink-400 rounded-full"></span> Color Theme
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-3xl transition-all active:scale-95 ${
                  profile.theme_color === theme.id ? 'bg-gray-900 text-white shadow-lg' : 'bg-gray-50 text-gray-500'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${theme.bg} shadow-sm ring-2 ring-white`} />
                <span className="text-[11px] font-black">{theme.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* パスワード変更フォーム */}
        <section className={`border-2 rounded-[32px] p-5 shadow-sm transition-all duration-500 ${
          isDanger ? 'bg-rose-50 border-rose-100 animate-pulse' : 'bg-gray-50 border-gray-100'
        }`}>
          <div className={`flex items-center gap-2 mb-3 font-black ${isDanger ? 'text-rose-500' : 'text-gray-500'}`}>
            <span className="text-lg">{isDanger ? '⚠️' : '🔒'}</span>
            <h3 className="text-sm uppercase tracking-tight">
              {isDanger ? 'Security Alert' : 'Change Password'}
            </h3>
          </div>
          <p className="text-[10px] font-bold text-gray-400 mb-3 px-1 leading-relaxed">
            {isDanger ? '初期設定のままです。悪用を防ぐため至急変更してください。' : 'ログインパスワードを変更します。'}
          </p>
          <div className="flex gap-2">
            {/* 📍 16pxズーム対策 */}
            <input 
              type="text" 
              placeholder="新しいパスワード" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-white border border-gray-200 font-bold text-gray-700 text-[16px] focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <button 
              onClick={handlePasswordChange}
              disabled={isSaving}
              className={`px-6 py-2 font-black rounded-xl text-white text-xs shadow-sm active:scale-95 whitespace-nowrap ${
                isSaving ? 'bg-gray-300' : (isDanger ? 'bg-rose-500' : 'bg-gray-900')
              }`}
            >
              {isSaving ? '保存中...' : '更新'}
            </button>
          </div>
        </section>
      </main>

      <FixedFooter 
        pathname={pathname} 
        onLogout={() => supabase.auth.signOut().then(() => router.push('/login'))} 
      />
    </div>
  );
}