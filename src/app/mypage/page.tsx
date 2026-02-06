'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, usePathname } from 'next/navigation';
import CastHeader from '@/components/dashboard/CastHeader';
import FixedFooter from '@/components/dashboard/FixedFooter';

const THEMES = [
  { id: 'pink',   name: 'サクラ',   bg: 'bg-pink-300',   ring: 'ring-pink-200' },
  { id: 'blue',   name: 'マリン',   bg: 'bg-cyan-300',   ring: 'ring-cyan-200' },
  { id: 'yellow', name: 'レモン',   bg: 'bg-yellow-300', ring: 'ring-yellow-200' },
  { id: 'white',  name: 'ピュア',   bg: 'bg-gray-400',   ring: 'ring-gray-300' },
  { id: 'black',  name: 'クール',   bg: 'bg-gray-800',   ring: 'ring-gray-500' },
  { id: 'red',    name: 'ルージュ', bg: 'bg-red-500',    ring: 'ring-red-300' },
];

export default function MyPage() {
  const router = useRouter();
  
  // ★ここに「pathname」の定義を追加しました！これで波線が消えます。
  const pathname = usePathname(); 

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // フォーム状態
  const [newPassword, setNewPassword] = useState('');
  const [targetAmount, setTargetAmount] = useState(''); 
  const [theme, setTheme] = useState('pink');
  
  const [isSaving, setIsSaving] = useState(false);

  // データ取得
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

        console.log(`Searching profile for: "${rawLoginId}" OR "${strippedLoginId}"`);

        const { data: members, error } = await supabase
          .from('cast_members')
          .select('*, shops(shop_name)')
          .in('login_id', [rawLoginId, strippedLoginId]);

        if (error) throw error;

        const member = members && members.length > 0 ? members[0] : null;

        if (member) {
          console.log('Profile Loaded:', member);
          setProfile(member);
          setTargetAmount(String(member.monthly_target_amount || '')); 
          setTheme(member.theme_color || 'pink');
        } else {
          console.error('Profile NOT found in DB');
        }

      } catch (e) {
        console.error('Fetch Error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router, supabase]);

  // 設定保存
  const handleSaveSettings = async () => {
    if (!profile || !profile.login_id) {
      alert('エラー：プロフィール情報が読み込めていません。\n画面をリロードしてみてください。');
      return;
    }

    setIsSaving(true);

    try {
      const cleanAmountStr = String(targetAmount).replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
      const cleanAmount = cleanAmountStr ? Number(cleanAmountStr) : 0;

      if (targetAmount && isNaN(cleanAmount)) {
        alert('目標金額は「数字」で入力してください🙇‍♂️');
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('cast_members')
        .update({ 
          monthly_target_amount: cleanAmount,
          theme_color: theme 
        })
        .eq('login_id', profile.login_id);

      if (error) throw error;

      alert('設定を保存しました！🎨\n（ダッシュボードの色が変わります）');
      setTargetAmount(String(cleanAmount));
      
      window.location.reload();

    } catch (e: any) {
      console.error('Update Error:', e);
      alert(`保存に失敗しました...\nエラー内容: ${e.message || '不明なエラー'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // パスワード変更
  const handlePasswordChange = async () => {
    if (!profile?.login_id) return alert('プロフィール読込中...');
    if (!newPassword || newPassword.length < 4) return alert('パスワードは4文字以上にしてください');
    
    const { error } = await supabase
      .from('cast_members')
      .update({ password: newPassword })
      .eq('login_id', profile.login_id);

    if (!error) { 
      alert('パスワードを変更しました✨'); 
      setNewPassword('');
    } else {
      alert('変更に失敗しました...');
    }
  };

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-pink-300 animate-pulse">LOADING...</div>;

  const isDangerPassword = profile?.password === '0000';

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans text-gray-800">
      
      <CastHeader 
        shopName={profile?.shops?.shop_name || "マイページ"} 
        displayName={profile?.display_name} 
        version="v3.7.3" 
        bgColor={currentTheme.bg} 
      />

      {/* ★ここの波線も、上の pathname が定義されたことで消えるはずです！ */}
      <main className="px-5 mt-6 space-y-8">
        
        <div className="text-center space-y-1">
          {!profile && (
             <div className="bg-red-50 p-4 rounded-xl mb-4 text-left border border-red-200">
               <p className="text-red-500 font-bold text-sm">⚠️ データの取得に失敗しました</p>
               <p className="text-xs text-red-400 mt-1">
                 データベースにこのIDのユーザー登録がありません。<br/>
                 管理者に連絡してください。
               </p>
             </div>
          )}

          <h2 className="text-xl font-black text-gray-800">
            {profile?.display_name || "ゲスト"}
          </h2>
          <p className="text-gray-400 text-xs font-bold tracking-widest">
            ID: {profile?.login_id}
          </p>
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 font-black text-gray-700">
              <span className="text-xl">🎨</span>
              <h3>テーマカラー</h3>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`w-10 h-10 rounded-full mx-auto shadow-sm transition-all ${t.bg} ${theme === t.id ? `scale-125 ring-2 ${t.ring} ring-offset-2` : 'opacity-70 hover:opacity-100'}`}
                />
              ))}
            </div>
          </section>

          <section className="bg-white border border-gray-100 rounded-[32px] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 font-black text-gray-700">
              <span className="text-xl">💰</span>
              <h3>今月の目標金額</h3>
            </div>
            <div className="relative">
              <input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0"
                className="w-full px-5 py-4 pl-10 rounded-2xl bg-gray-50 border border-gray-100 font-black text-xl text-gray-700 focus:ring-2 focus:ring-pink-200 focus:outline-none"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">¥</span>
            </div>
          </section>

          <button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={`w-full py-4 rounded-2xl shadow-lg font-black text-white text-lg active:scale-95 transition-all flex items-center justify-center gap-2
              ${isSaving ? 'bg-gray-400 cursor-not-allowed' : currentTheme.bg}
            `}
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                保存中...
              </>
            ) : (
              '設定を保存する ✨'
            )}
          </button>
        </div>

        <hr className="border-gray-100" />

        <section className={`border-2 rounded-[32px] p-6 shadow-lg transition-colors duration-500
          ${isDangerPassword ? 'bg-red-50 border-red-100 animate-pulse-slow' : 'bg-gray-50 border-gray-100'}
        `}>
          <div className={`flex items-center gap-2 font-black mb-3 ${isDangerPassword ? 'text-red-500' : 'text-gray-500'}`}>
            <span className="text-xl">{isDangerPassword ? '⚠️' : '🔒'}</span>
            <h3>{isDangerPassword ? 'パスワード変更のお願い' : 'パスワード変更'}</h3>
          </div>
          
          {isDangerPassword && (
            <p className="text-xs text-red-400 mb-4 font-bold">
              初期設定の「0000」のままです。<br/>セキュリティのため変更してください。
            </p>
          )}

          <div className="space-y-3">
            <input 
              type="text" 
              placeholder="新しいパスワード" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-5 py-3 rounded-xl bg-white border border-gray-200 font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <button 
              onClick={handlePasswordChange}
              className={`w-full font-black py-3 rounded-xl text-white shadow-md active:scale-95 transition-all
                ${isDangerPassword ? 'bg-red-400' : 'bg-gray-400'}
              `}
            >
              パスワードを変更
            </button>
          </div>
        </section>

        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }} className="w-full py-4 text-gray-400 text-xs font-bold tracking-widest">LOGOUT</button>
      </main>

      {/* pathname={pathname} もこれでエラーが消えます */}
      <FixedFooter 
        pathname={pathname || ''} 
        onHome={() => router.push('/')} 
        onSalary={() => router.push('/salary')} 
        onProfile={() => {}} 
        onLogout={async () => { await supabase.auth.signOut(); router.push('/login'); }} 
      />
    </div>
  );
}