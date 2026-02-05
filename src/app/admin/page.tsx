'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';

// 店舗リスト（将来はDBから取得してもOK）
const SHOP_LIST = [
  { id: 'all', name: '📢 全店舗共通' },
  { id: '001', name: '📍 神田' },  // IDはshop_masterに合わせて修正
  { id: '002', name: '📍 赤坂' },
  { id: '003', name: '📍 秋葉原' }, // あなたの環境に合わせて修正してください
  { id: '004', name: '📍 上野' },
  { id: '005', name: '📍 渋谷' },
  { id: '006', name: '📍 池西' },
  { id: '007', name: '📍 五反田' },
  { id: '008', name: '📍 大宮' },
  { id: '009', name: '📍 吉祥寺' },
  { id: '010', name: '📍 大久保' },
  { id: '011', name: '📍 池東' },
  { id: '012', name: '📍 小岩' },
];

export default function AdminPage() {
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));
  
  const [content, setContent] = useState('');
  const [targetShopId, setTargetShopId] = useState('all'); // 初期値
  const [newsList, setNewsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 権限管理用のステート
  const [role, setRole] = useState<string | null>(null);       // 'developer' or 'admin'
  const [myShopId, setMyShopId] = useState<string | null>(null); // 店長の場合の担当店舗ID
  
  const router = useRouter();

  useEffect(() => {
    async function initAdmin() {
      // 1. セッションチェック
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user.email) {
        router.push('/login');
        return;
      }

      // 2. DBから役職と担当店舗を取得（ここが新しいロジック！）
      const loginId = session.user.email.split('@')[0]; // メアドからID抽出
      const { data: member, error } = await supabase
        .from('cast_members')
        .select('role, home_shop_id')
        .eq('login_id', loginId)
        .single();

      // 権限がない、またはデータが取れない場合は追い出す
      if (error || !member || (member.role !== 'developer' && member.role !== 'admin')) {
        alert('権限がありません');
        router.push('/');
        return;
      }

      // 3. 権限セット
      setRole(member.role);
      setMyShopId(member.home_shop_id);

      // 店長なら、配信先を強制的に自分の店に固定する
      if (member.role === 'admin' && member.home_shop_id) {
        setTargetShopId(member.home_shop_id);
      }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const payload = { 
      content, 
      shop_id: targetShopId, 
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
    // 店長が他店の記事を編集しようとしたらブロック
    if (role === 'admin' && news.shop_id !== myShopId && news.shop_id !== 'all') {
       alert('自店舗の記事以外は編集できません');
       return;
    }
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

  if (loading) return <div className="p-10 text-center font-bold text-pink-400 animate-pulse">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4 font-sans text-gray-800">
      <div className="max-w-md mx-auto space-y-6">
        
        <header className="flex justify-between items-center px-2">
          <h1 className="text-xl font-black tracking-tighter">MANAGER CENTER ⚙️</h1>
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${role === 'developer' ? 'bg-purple-100 text-purple-600' : 'bg-pink-100 text-pink-500'}`}>
            {role === 'developer' ? 'Developer Mode' : `${myShopId} Manager`}
          </span>
        </header>

        {/* 📝 入力・編集フォーム */}
        <section className={`p-6 rounded-[30px] shadow-xl border-2 transition-all bg-white ${editingId ? 'border-amber-200' : 'border-pink-100'}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ✨ 配信先店舗の選択（開発者の場合のみ表示、店長は自動固定） */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 ml-1 uppercase tracking-widest">
                {role === 'developer' ? '配信先を選択' : '配信先店舗'}
              </label>
              
              {role === 'developer' ? (
                // 開発者用：全ボタン表示
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
              ) : (
                // 店長用：自分の店名を表示するだけ
                <div className="w-full bg-pink-50 border border-pink-100 text-pink-500 font-bold text-center py-3 rounded-xl text-sm">
                   📍 {SHOP_LIST.find(s => s.id === myShopId)?.name || `店舗ID: ${myShopId}`}
                </div>
              )}
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

        {/* 📢 配信履歴 */}
        <section className="space-y-3">
          <p className="text-[10px] font-black text-gray-400 ml-2 uppercase tracking-[0.2em]">News Feed Log</p>
          {newsList.map((news) => (
            <div key={news.id} className="bg-white border border-gray-100 rounded-[22px] p-4 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full mr-2 ${news.shop_id === 'all' ? 'bg-pink-100 text-pink-500' : 'bg-blue-100 text-blue-500'}`}>
                    {SHOP_LIST.find(s => s.id === news.shop_id)?.name || news.shop_id}
                  </span>
                  <span className="text-[9px] font-bold text-gray-300">{format(parseISO(news.created_at), 'MM/dd HH:mm')}</span>
                </div>
                {/* 編集・削除ボタン（開発者 または 自分の店の記事のみ） */}
                {(role === 'developer' || news.shop_id === myShopId) && (
                  <div className="flex space-x-1">
                    <button onClick={() => startEdit(news)} className="text-[10px] font-bold text-blue-400 p-1 px-2">修正</button>
                    <button onClick={() => handleDelete(news.id)} className="text-[10px] font-bold text-red-300 p-1 px-2">削除</button>
                  </div>
                )}
              </div>
              <p className="text-sm font-bold text-gray-600 leading-relaxed">{news.content}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}