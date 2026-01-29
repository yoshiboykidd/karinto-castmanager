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
  const [targetShopId, setTargetShopId] = useState('all'); // ✨ 配信先店舗ID（初期値は全体）
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  // 🔐 管理者として許可するメールアドレス（あなたの管理用アドレス）
  const ADMIN_EMAIL = "admin@karinto-internal.com"; 

  // 店舗リスト（将来店舗が増えたらここに追加、またはDBから取得）
  const SHOP_LIST = [
    { id: 'all', name: '📢 全店舗共通' },
    { id: 'ikebukuro', name: '📍 池袋店' },
    { id: 'akasaka', name: '📍 赤坂店' },
    { id: 'main', name: '📍 本店' },
  ];

  useEffect(() => {
    async function initAdmin() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || session.user.email !== ADMIN_EMAIL) {
        alert('管理者専用ページです');
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
      .order('created_at', { ascending: false }); // 全データを取得
    setNewsList(data || []);
    setLoading(false);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const payload = { 
      content, 
      shop_id: targetShopId, // ✨ 選択した店舗IDを保存
      display_date: new Date().toISOString().split('T')[0] 
    };

    if (editingId) {
      await supabase.from('news').update(payload).eq('id', editingId);
      alert('修正しました！');
      setEditingId(null);
    } else {
      await supabase.from('news').insert([payload]);
      alert('配信しました！🌸');
    }

    setContent('');
    fetchNews();
    setIsProcessing(false);
  };

  const startEdit = (news: any) => {
    setEditingId(news.id);
    setContent(news.content);
    setTargetShopId(news.shop_id || 'all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return;
    await supabase.from('news').delete().eq('id', id);
    fetchNews();
  };

  if (!isAdmin || loading) return <div className="p-10 text-center font-bold text-pink-400">認証中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4 font-sans text-gray-800">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="flex justify-between items-center px-2">
          <h1 className="text-xl font-black tracking-tighter">MANAGER CENTER ⚙️</h1>
          <span className="text-[10px] font-bold bg-pink-100 text-pink-500 px-3 py-1 rounded-full uppercase">Top Admin</span>
        </header>

        {/* 📝 入力・編集フォーム */}
        <section className={`p-6 rounded-[30px] shadow-xl border-2 transition-all bg-white ${editingId ? 'border-amber-200' : 'border-pink-100'}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ✨ 配信先店舗の選択ボタン */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">配信先を選択</label>
              <div className="grid grid-cols-2 gap-2">
                {SHOP_LIST.map((shop) => (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => setTargetShopId(shop.id)}
                    className={`text-xs py-2.5 rounded-xl font-bold transition-all border ${
                      targetShopId === shop.id 
                      ? 'bg-pink-500 text-white border-pink-500 shadow-md' 
                      : 'bg-gray-50 text-gray-400 border-gray-100'
                    }`}
                  >
                    {shop.name}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              className="w-full h-24 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-pink-300 font-bold text-gray-700"
              placeholder="メッセージを入力..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            
            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-white ${editingId ? 'bg-amber-500' : 'bg-pink-500'}`}
            >
              {editingId ? '内容を保存する' : 'この内容で配信する 🚀'}
            </button>
          </form>
        </section>

        {/* 📢 配信履歴（すべて表示） */}
        <section className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-[0.2em]">All Shop Feeds</p>
          {newsList.map((news) => (
            <div key={news.id} className="bg-white border border-gray-100 rounded-[22px] p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full mr-2 ${news.shop_id === 'all' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                    {SHOP_LIST.find(s => s.id === news.shop_id)?.name || news.shop_id}
                  </span>
                  <span className="text-[9px] font-bold text-gray-300">{format(parseISO(news.created_at), 'MM/dd HH:mm')}</span>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => startEdit(news)} className="text-[10px] font-bold text-blue-400 p-1 px-2">修正</button>
                  <button onClick={() => handleDelete(news.id)} className="text-[10px] font-bold text-red-300 p-1 px-2">削除</button>
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