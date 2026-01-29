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

  const email = castId.includes('@') ? castId : `${castId}@karinto-internal.com`;

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  if (error) {
    alert('IDまたはパスワードが違います');
    setLoading(false);
  } else {
    // ✨ ここで自動振り分け！
    // 管理者のメールアドレスだった場合は /admin へ、それ以外は / へ
    if (email === "admin@karinto-internal.com") {
      router.push('/admin');
    } else {
      router.push('/');
    }
    router.refresh();
  }
};

    // ✨ 魔法の1行：@が含まれていなければ、自動でドメインを補完する
    const email = castId.includes('@') ? castId : `${castId}@karinto-internal.com`;

    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      alert('IDまたはパスワードが違います');
      setLoading(false);
    } else {
      // ログイン成功したらトップへ
      router.push('/');
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[40px] p-10 shadow-xl shadow-pink-100 border border-pink-50">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-gray-800 tracking-tighter uppercase mb-2">Login</h1>
          <p className="text-pink-300 text-[10px] font-bold tracking-widest uppercase">Karinto Cast Manager</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 ml-4 mb-1 block uppercase tracking-widest">User ID</label>
            <input
              type="text" // ✨ 数字のみ(numeric)からテキストに変更して admin も打てるように
              placeholder="IDを入力"
              value={castId}
              onChange={(e) => setCastId(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-200 font-bold text-gray-700 transition-all"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 ml-4 mb-1 block uppercase tracking-widest">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-200 font-bold text-gray-700 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-pink-200 hover:bg-pink-600 active:scale-95 transition-all disabled:opacity-50 mt-4"
          >
            {loading ? '認証中...' : 'ログインする 🌸'}
          </button>
        </form>
      </div>
    </div>
  );
}