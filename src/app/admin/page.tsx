'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('news')
      .insert([{ 
        content, 
        display_date: new Date().toISOString().split('T')[0] 
      }]);

    if (error) {
      alert('エラーが発生しました');
    } else {
      alert('お知らせを更新しました！');
      setContent('');
      router.push('/'); // トップ画面に戻って確認
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-pink-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-[30px] p-8 shadow-xl">
        <h1 className="text-2xl font-black text-gray-800 mb-6">📢 お知らせ更新</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            className="w-full h-32 p-4 bg-gray-50 border border-pink-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-bold"
            placeholder="ここにメッセージを入力..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '送信中...' : 'キャスト全員に公開する'}
          </button>
        </form>
      </div>
    </div>
  );
}