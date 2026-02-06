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
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // デバッグ用
  const [debugRawId, setDebugRawId] = useState('');
  const [debugStrippedId, setDebugStrippedId] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [targetAmount, setTargetAmount] = useState(''); 
  const [theme, setTheme] = useState('pink');
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !user.email) { router.push('/login'); return; }

        const rawLoginId = user.email.split('@')[0];         // そのまま "00600037"
        const strippedLoginId = String(Number(rawLoginId));  // ゼロなし "600037"
        
        setDebugRawId(rawLoginId);
        setDebugStrippedId(strippedLoginId);

        console.log(`Searching for ID: "${rawLoginId}" OR "${strippedLoginId}"`);

        // ★最強検索: 両方のパターンで探して、最初に見つかった方を採用
        const { data: members, error } = await supabase
          .from('cast_members')
          .select('*, shops(shop_name)')
          .in('login_id', [rawLoginId, strippedLoginId]); // どっちかあればOK

        if (error) {
          console.error('Data Fetch Error:', error);
        }

        // 配列の1つ目を取得
        const member = members && members.length > 0 ? members[0] : null;

        if (member) {
          console.log('Member Found:', member);
          setProfile(member);
          setTargetAmount(member.monthly_target_amount || ''); 
          setTheme(member.theme_color || 'pink');
        } else {
          console.warn('Member not found for either ID.');
        }

      } catch (e) {
        console.error('Error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router, supabase]);

  const handleSaveSettings = async () => {
    if (!profile?.id) return;

    const cleanAmountStr = String(targetAmount).replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
    const cleanAmount = cleanAmountStr ? Number(cleanAmountStr) : 0;

    if (isNaN(cleanAmount)) {
      alert('目標金額は「数字」で入力してください🙇‍♂️');
      return;
    }

    const { error } = await supabase
      .from('cast_members')
      .update({ 
        monthly_target_amount: cleanAmount,
        theme_color: theme 
      })
      .eq('id', profile.id);

    if (!error) {
      alert('設定を保存しました！🎨');
      setTargetAmount(String(cleanAmount));
      setProfile({ ...profile, monthly_target_amount: cleanAmount, theme_color: theme });
    } else {
      alert('保存に失敗しました...');
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 4) return alert('パスワードは4文字以上にしてください');
    
    const { error } = await supabase
      .from('cast_members')
      .update({ password: newPassword })
      .eq('id', profile.id);

    if (!error) { 
      alert('パスワードを変更しました✨'); 
      setNewPassword('');
      setProfile({ ...profile, password: newPassword });
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
        version="v3.6.5" 
        bgColor={currentTheme.bg} 
      />

      <main className="px-5 mt-6 space-y-8">
        
        {/* プロフィール情報 */}
        <div className="text-center space-y-1">
          {/* まだ見つからない場合のデバッグ表示 */}
          {!profile && (
             <div className="bg-gray-100 p-4 rounded-xl mb-4 text-left border-l-4 border-red-400">
               <p className="text-red-500 font-bold text-sm mb-1">⚠️ まだデータが見つかりません</p>
               <p className="text-xs text-gray-600 leading-relaxed">
                 以下のどちらのIDも登録がありませんでした。<br/>
                 1. <span className="font-mono font-bold">{debugRawId}</span> (そのまま)<br/>
                 2. <span className="font-mono font-bold">{debugStrippedId}</span> (ゼロなし)<br/>
                 <br/>
                 <span className="text-red-400 font-bold">対処法：</span><br/>
                 Supabaseの `cast_members` テーブルに、このIDの行を追加してください。
               </p>
             </div>
          )}

          <h2 className="text-xl font-black text-gray-800">
            {profile?.display_name || "ゲスト"}
          </h2>
          <p className="text-gray-400 text-xs font-bold tracking-widest">
            ID: {profile?.login_id || debugRawId}
          </p>
        </div>

        {/* 設定フォーム */}
        <div className="space-y-6">
          {/* テーマカラー */}
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

          {/* 目標金額 */}
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
            className={`w-full py-4 rounded-2xl shadow-lg font-black text-white text-lg active:scale-95 transition-all ${currentTheme.bg}`}
          >
            設定を保存する ✨
          </button>
        </div>

        <hr className="border-gray-100" />

        {/* パスワード変更 */}
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