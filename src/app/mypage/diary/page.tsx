'use client';


import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client'; // 📍 共通クライアント [cite: 2026-02-20]
// 📍 Sparkles を追加しました
import { Camera, Send, ChevronLeft, X, Loader2, ImagePlus, Trash2, History, Sparkles } from 'lucide-react';

export default function DiaryPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [castProfile, setCastProfile] = useState<any>(null);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myPosts, setMyPosts] = useState<any[]>([]); // 📍 自分の投稿履歴

  // 1. プロフィールと履歴の取得
  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }
    const loginId = session.user.email?.split('@')[0];
    
    // キャスト情報取得
    const { data: profile } = await supabase.from('cast_members').select('*').eq('login_id', loginId).single();
    setCastProfile(profile);

    // 自分の投稿履歴を取得（最新順）
    const { data: posts } = await supabase
      .from('diary_posts')
      .select('*')
      .eq('cast_id', loginId)
      .order('created_at', { ascending: false });
    
    setMyPosts(posts || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // 写真選択
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // 投稿処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !imageFile || !castProfile) return;

    setIsSubmitting(true);
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${castProfile.login_id}_${Date.now()}.${fileExt}`;
      const filePath = `${castProfile.login_id}/${fileName}`;

      // Storageへアップロード
      const { error: uploadError } = await supabase.storage.from('diary-photos').upload(filePath, imageFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('diary-photos').getPublicUrl(filePath);

      // DBへ保存 [cite: 2026-02-21]
      const { error: dbError } = await supabase.from('diary_posts').insert([{
        cast_id: castProfile.login_id,
        cast_name: castProfile.display_name,
        content: content.trim(),
        image_url: publicUrl,
        shop_id: castProfile.home_shop_id,
        created_at: new Date().toISOString(),
      }]);

      if (dbError) throw dbError;

      alert('写メ日記をアップロードしました！✨');
      setContent('');
      setImageFile(null);
      setPreviewUrl(null);
      fetchData(); // 履歴を更新
    } catch (err: any) {
      alert('失敗しました: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 削除処理（任意で追加）
  const handleDelete = async (postId: string) => {
    if (!confirm('この日記を削除しますか？')) return;
    await supabase.from('diary_posts').delete().eq('id', postId);
    fetchData();
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#FFF5F7] pb-32 font-sans text-slate-800">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-pink-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/')} className="p-2 -ml-2 text-pink-400 active:scale-90 transition-all"><ChevronLeft size={24} /></button>
        <h1 className="text-[17px] font-black tracking-tighter flex items-center gap-1.5"><Camera size={18} className="text-pink-500" />写メ日記</h1>
        <div className="w-10" />
      </header>

      <main className="p-6 max-w-md mx-auto space-y-10">
        {/* 📝 新規投稿フォームエリア */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Sparkles size={16} className="text-pink-400" />
            <h2 className="text-xs font-black text-pink-400 uppercase tracking-[0.2em]">New Post</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group">
              {previewUrl ? (
                <div className="relative aspect-[4/5] w-full rounded-[40px] overflow-hidden shadow-xl border-4 border-white animate-in zoom-in duration-300">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setImageFile(null); setPreviewUrl(null); }} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full active:scale-90"><X size={20} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-[4/5] w-full rounded-[40px] border-4 border-dashed border-pink-200 bg-white flex flex-col items-center justify-center gap-3 text-pink-300 hover:bg-pink-50 transition-all active:scale-[0.98]">
                  <div className="w-16 h-16 rounded-3xl bg-pink-50 flex items-center justify-center"><ImagePlus size={32} /></div>
                  <p className="font-black text-sm uppercase tracking-widest">Select Photo</p>
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-lg shadow-pink-200/10 border border-pink-50">
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="メッセージを書いてね 🌸" className="w-full h-24 bg-transparent text-gray-700 font-bold leading-relaxed outline-none resize-none placeholder:text-gray-300" maxLength={200} />
              <div className="flex justify-end text-[10px] font-black text-pink-200 pt-2 border-t border-pink-50">{content.length} / 200</div>
            </div>

            <button type="submit" disabled={isSubmitting || !content.trim() || !imageFile} className={`w-full py-5 rounded-[24px] font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 ${isSubmitting || !content.trim() || !imageFile ? 'bg-gray-100 text-gray-400' : 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-pink-200'}`}>
              {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : '日記をアップする ✨'}
            </button>
          </form> section
        </section>

        <hr className="border-pink-100" />

        {/* 📜 履歴エリア */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <History size={16} className="text-gray-400" />
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Your History</h2>
          </div>

          <div className="grid gap-4">
            {myPosts.length === 0 ? (
              <p className="text-center py-10 text-gray-300 font-bold text-sm italic">まだ投稿がありません 🧊</p>
            ) : (
              myPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-[32px] p-4 shadow-sm border border-gray-100 flex gap-4 items-center">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                    <img src={post.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-bold mb-1">{new Date(post.created_at).toLocaleDateString()}</p>
                    <p className="text-[13px] font-bold text-gray-700 truncate">{post.content}</p>
                  </div>
                  <button onClick={() => handleDelete(post.id)} className="p-3 text-gray-300 hover:text-red-400 active:scale-90 transition-all"><Trash2 size={18} /></button>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}