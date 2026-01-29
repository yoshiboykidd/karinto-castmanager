'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';

export default function AdminPage() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  const [content, setContent] = useState('');
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // 編集中のID
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // 🔐 管理者として許可するメールアドレス
  const ADMIN_EMAIL = "admin@karinto.com"; // ★ここをSupabaseで作った管理用メールに変更してください

  useEffect(() => {
    async function initAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 管理者メール以外は追い出す
      if (!session || session.user.email !== ADMIN_EMAIL) {
        alert('管理者専用ページです。専用アカウントでログインしてください。');
        router.push('/login');
        return;
      }

      setIsAdmin(true);
      fetchNews();
    }
    initAdmin();
  }, [supabase, router]);

  async function fetchNews() {
    const { data } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });
    setNewsList(data || []);
    setLoading(false);
  }

  // 投稿または更新
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (editingId) {
      // 【編集モード】既存のデータを書き換え
      const { error } = await supabase
        .from('news')
        .update({ content })
        .eq('id', editingId);
      
      if (!error) {
        alert('お知らせを修正しました！');
        setEditingId(null);
      }
    } else {
      // 【新規投稿モード】
      const { error } = await supabase
        .from('news')
        .insert([{ content, display_date: new Date().toISOString().split('T')[0] }]);
      
      if (!error) alert('新しく配信しました！🌸');
    }

    setContent('');
    fetchNews(); // データを最新にして、ページには留まる
    setIsProcessing(false);
  };

  // 編集モードへの切り替え
  const startEdit = (news: any) => {
    setEditingId(news.id);
    setContent(news.content);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // 入力欄まで戻す
  };

  // 削除
  const handleDelete = async (id: string) => {
    if (!confirm('本当に削除しますか？')) return;
    await supabase.from('news').delete().eq('id', id);
    fetchNews();
  };

  if (!isAdmin || loading) return <div className="p-10 text-center font-bold text-pink-400">認証中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="flex justify-between items-center">
          <h1 className="text-xl font-black text-gray-800 tracking-tighter">MANAGER CENTER ⚙️</h1>
          <button onClick={() => router.push('/')} className="text-[10px] font-bold bg-white px-3 py-1.5 rounded-full shadow-sm text-gray-400">ホーム確認</button>
        </header>

        {/* 📋 入力・編集フォーム */}
        <section className={`p-6 rounded-[30px] shadow-xl border-2 transition-all ${editingId ? 'bg-amber-50 border-amber-200' : 'bg-white border-pink-100'}`}>
          <h2 className="text-xs font-black text-gray-400 mb-4 uppercase tracking-widest">
            {editingId ? '📝 お知らせを修正中' : '📢 新規お知らせ配信'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              className="w-full h-28 p-4 bg-white/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-bold text-gray-700"
              placeholder="メッセージを入力..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                className={`flex-1 font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-white ${editingId ? 'bg-amber-500' : 'bg-pink-500'}`}
              >
                {editingId ? '修正を保存する' : 'キャストへ配信する'}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={() => { setEditingId(null); setContent(''); }}
                  className="bg-gray-200 text-gray-500 px-4 rounded-2xl font-bold"
                >
                  止める
                </button>
              )}
            </div>
          </form>
        </section>

        {/* 📢 配信履歴一覧（キャストページと同じものが見れる） */}
        <section className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-[0.2em]">Live Feed / Management</p>
          {newsList.map((news) => (
            <div key={news.id} className="bg-white border border-gray-100 rounded-[22px] p-4 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] font-bold text-gray-300">{format(parseISO(news.created_at), 'yyyy.MM.dd HH:mm')}</span>
                <div className="space-x-2">
                  <button onClick={() => startEdit(news)} className="text-[10px] font-bold text-blue-400 bg-blue-50 px-2 py-1 rounded-md">修正</button>
                  <button onClick={() => handleDelete(news.id)} className="text-[10px] font-bold text-red-300 bg-red-50 px-2 py-1 rounded-md">削除</button>
                </div>
              </div>
              <p className="text-sm font-bold text-gray-600 leading-relaxed">{news.content}</p>
            </div>
          ))}
        </section>

      </div>
    </div>
  );
}