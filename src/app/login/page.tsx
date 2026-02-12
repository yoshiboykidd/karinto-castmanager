'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [castId, setCastId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const email = `${castId}@karinto-internal.com`;

    const { error: authError } = await supabase.auth.signInWithPassword({
      email, password,
    });

    if (authError) {
      alert('IDまたはパスワードが違います');
      setLoading(false);
      return;
    }

    // 役職をチェック
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
    <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center p-6 text-slate-800">
      <div className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-xl border border-pink-50">
        <h1 className="text-2xl font-black italic text-center mb-8 uppercase">Login</h1>
        <form onSubmit={handleLogin} className="space-y-5">
          <input type="text" placeholder="ID" value={castId} onChange={(e) => setCastId(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border rounded-2xl font-bold" required />
          <input type="password" placeholder="PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-6 py-4 bg-gray-50 border rounded-2xl font-bold" required />
          <button type="submit" disabled={loading} className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl">
            {loading ? 'WAIT...' : 'GO 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}