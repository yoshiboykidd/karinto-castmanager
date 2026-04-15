'use client';

import { useState } from 'react';
// 📍 修正：共通クライアントをインポート [cite: 2026-02-20]
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [castId, setCastId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 📍 修正：共通クライアントを使用。useStateや環境変数の記述を削除 [cite: 2026-02-20]
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const email = castId.includes('@') ? castId : `${castId}@karinto-internal.com`;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (authError) {
      alert('IDまたはパスワードが違います');
      setLoading(false);
      return;
    }

    // 役職を確認して飛ばし先を決める
    const { data: member } = await supabase
      .from('cast_members')
      .select('role')
      .eq('login_id', castId)
      .single();

    if (member?.role === 'admin' || member?.role === 'developer') {
      router.push('/admin');
    } else {
      router.push(password === '0000' ? '/?alert_password=true' : '/');
    }
    
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center p-6 text-slate-800 font-sans">
      <div className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-xl border border-pink-50">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black italic tracking-tighter uppercase mb-2">Login</h1>
          <p className="text-pink-300 text-[10px] font-bold tracking-widest uppercase text-center">KCM Management</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 ml-4 mb-1 block uppercase tracking-widest">User ID</label>
            <input type="text" placeholder="IDを入力" value={castId} onChange={(e) => setCastId(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" required />
          </div>
          <div>
            <label className="text-[10px] font-black text-gray-400 ml-4 mb-1 block uppercase tracking-widest">Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
            {loading ? 'AUTHENTICATING...' : 'GO 🌸'}
          </button>
        </form>
      </div>
    </div>
  );
}