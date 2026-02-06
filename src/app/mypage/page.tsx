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

        // ★修正: 再度、結合クエリを使用（これが一番確実に取れるため）
        // ただし、shopsがnullでもエラーにならないよう左外部結合的な挙動を期待
        const { data: members, error } = await supabase
          .from('cast_members')
          .select('*, shops(shop_name, last_synced_at)') 
          .in('login_id', [rawLoginId, strippedLoginId]);

        if (error) throw error;

        const member = members && members.length > 0 ? members[0] : null;

        if (member) {
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
    if (!profile || !profile.login_id) return;
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

      alert('設定を保存しました！🎨');
      setTargetAmount(String(cleanAmount));
      window.location.reload(); // 反映のためリロード

    } catch (e: any) {
      console.error('Update Error:', e);
      alert(`保存に失敗しました...`);
    } finally {
      setIsSaving(false);
    }
  };

  // パスワード変更
  const handlePasswordChange = async () => {
    if (!profile?.login_id) return;
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
  const isDangerPassword = profile?.password === '0000';
  
  // Header情報
  const headerShopName = profile?.shops?.shop_name || "マイページ";
  // ★重要: 配列ではなくオブジェクトとして入ってくるのでそのまま参照
  const headerSyncTime = profile?.shops?.last_synced_at; 
  const headerDisplayName = profile?.display_name;
  const headerBgColor = currentTheme.bg;

  if (loading) return <div className="min-h-screen flex items-center justify-center font-black text-pink-300 animate-pulse">LOADING...</div>;

  return (
    <div className="min-h-screen bg-[#FFFDFE] pb-36 font-sans text-gray-800">
      
      <CastHeader 
        shopName={headerShopName}
        displayName={headerDisplayName}
        syncTime={headerSyncTime}
        version="v3.8.0"
        bgColor={headerBgColor}
      />

      {/* ★修正: 余白を詰める (mt-6 -> mt-3, space-y-8 -> space-y-4) */}
      <main className="px-4 mt-3 space-y-4">
        
        {!profile && (
            <div className="bg-red-50 p-3 rounded-xl mb-2 text-left border border-red-200">
              <p className="text-red-500 font-bold text-xs">⚠️ データの取得に失敗しました</p>
            </div>
        )}

        <div className="space-y-3"> {/* 間隔を詰める */}
          
          {/* 1. 目標金額設定 */}
          <section className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-lg space-y-2">
            <div className="flex items-center gap-2 font-black text-gray-700">
              <span className="text-lg">💰</span>
              <h3 className="text-sm">今月の目標金額</h3>
            </div>
            <div className="relative">
              <input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 pl-9 rounded-xl bg-gray-50 border border-gray-100 font-black text-lg text-gray-700 focus:ring-2 focus:ring-pink-200 focus:outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">¥</span>
            </div>
          </section>

          {/* 2. テーマカラー設定 */}
          <section className="bg-white border border-gray-100 rounded-[24px] p-5 shadow-lg space-y-2">
            <div className="flex items-center gap-2 font-black text-gray-700">
              <span className="text-lg">🎨</span>
              <h3 className="text-sm">テーマカラー</h3>
            </div>
            <div className="grid grid-cols-6 gap-2 pt-1">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`w-9 h-9 rounded-full mx-auto shadow-sm transition-all ${t.bg} ${theme === t.id ? `scale-110 ring-2 ${t.ring} ring-offset-2` : 'opacity-70 hover:opacity-100'}`}
                />
              ))}
            </div>
          </section>

          {/* 設定保存ボタン */}
          <button 
            onClick={handleSaveSettings}
            disabled={isSaving}
            className={`w-full py-3.5 rounded-xl shadow-md font-black text-white text-base active:scale-95 transition-all flex items-center justify-center gap-2
              ${isSaving ? 'bg-gray-400 cursor-not-allowed' : currentTheme.bg}
            `}
          >
            {isSaving ? '保存中...' : '設定を保存する ✨'}
          </button>
        </div>

        <hr className="border-gray-100 my-2" />

        {/* 3. パスワード変更 */}
        <section className={`border-2 rounded-[24px] p-5 shadow-md transition-colors duration-500
          ${isDangerPassword ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}
        `}>
          <div className={`flex items-center gap-2 font-black mb-2 ${isDangerPassword ? 'text-red-500' : 'text-gray-500'}`}>
            <span className="text-lg">{isDangerPassword ? '⚠️' : '🔒'}</span>
            <h3 className="text-sm">{isDangerPassword ? 'パスワード変更のお願い' : 'パスワード変更'}</h3>
          </div>
          
          {isDangerPassword && (
            <p className="text-[10px] text-red-400 mb-3 font-bold">
              初期設定「0000」から変更してください。
            </p>
          )}

          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="新しいパスワード" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 font-bold text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
            />
            <button 
              onClick={handlePasswordChange}
              className={`w-full font-black py-3 rounded-xl text-white shadow-sm active:scale-95 transition-all
                ${isDangerPassword ? 'bg-red-400' : 'bg-gray-400'}
              `}
            >
              変更する
            </button>
          </div>
        </section>

        {/* ログアウトボタンは削除しました */}
      </main>

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