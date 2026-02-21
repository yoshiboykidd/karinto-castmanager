'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
// 📍 共通クライアントをインポート [cite: 2026-02-20]
import { createClient } from '@/utils/supabase/client';
import { Camera, Send, ChevronLeft, X, Loader2, ImagePlus } from 'lucide-react';

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

  // ログイン情報の取得
  useEffect(() => {
    async function getProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const loginId = session.user.email?.split('@')[0];
      const { data } = await supabase.from('cast_members').select('*').eq('login_id', loginId).single();
      setCastProfile(data);
      setLoading(false);
    }
    getProfile();
  }, [supabase, router]);

  // 写真選択時のプレビュー生成
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
      // 1. Supabase Storage (diary-photos) へアップロード [cite: 2026-02-21]
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${castProfile.login_id}_${Date.now()}.${fileExt}`;
      const filePath = `${castProfile.login_id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('diary-photos') // 📍 指定されたバケット名
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 2. 画像の公開URLを取得 [cite: 2026-02-21]
      const { data: { publicUrl } } = supabase.storage.from('diary-photos').getPublicUrl(filePath);

      // 3. データベース (diary_posts) に保存
      const { error: dbError } = await supabase.from('diary_posts').insert([
        {
          cast_id: castProfile.login_id,
          cast_name: castProfile.display_name,
          content: content.trim(),
          image_url: publicUrl,
          shop_id: castProfile.home_shop_id,
          created_at: new Date().toISOString(),
        }
      ]);

      if (dbError) throw dbError;

      alert('写メ日記をアップロードしました！✨');
      router.push('/'); // 投稿完了後、ホームへ戻る
    } catch (err: any) {
      alert('投稿に失敗しました: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-[#FFF5F7] pb-24 font-sans text-slate-800">
      {/* 🌸 ヘッダー：サクラピンク基調 [cite: 2026-01-29] */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-pink-100 px-6 py-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-pink-400 active:scale-90 transition-all">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[17px] font-black tracking-tighter flex items-center gap-1.5">
          <Camera size={18} className="text-pink-500" />
          写メ日記投稿
        </h1>
        <div className="w-10" />
      </header>

      <main className="p-6 max-w-md mx-auto space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 📸 写真選択エリア：アスペクト比 4:5 固定 [cite: 2026-02-21] */}
          <div className="relative group">
            {previewUrl ? (
              <div className="relative aspect-[4/5] w-full rounded-[40px] overflow-hidden shadow-xl border-4 border-white animate-in zoom-in duration-300">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-md active:scale-90"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-[4/5] w-full rounded-[40px] border-4 border-dashed border-pink-200 bg-white flex flex-col items-center justify-center gap-3 text-pink-300 hover:bg-pink-50 transition-all active:scale-[0.98]"
              >
                <div className="w-16 h-16 rounded-3xl bg-pink-50 flex items-center justify-center">
                  <ImagePlus size={32} />
                </div>
                <p className="font-black text-sm uppercase tracking-widest">Select Photo</p>
              </button>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          {/* 📝 テキスト入力エリア */}
          <div className="bg-white rounded-[32px] p-6 shadow-lg shadow-pink-200/10 border border-pink-50">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="今日の一言メッセージを書いてね 🌸"
              className="w-full h-32 bg-transparent text-gray-700 font-bold leading-relaxed outline-none resize-none placeholder:text-gray-300"
              maxLength={200}
            />
            <div className="flex justify-end text-[10px] font-black text-pink-200 uppercase tracking-widest pt-2 border-t border-pink-50">
              {content.length} / 200
            </div>
          </div>

          {/* 🚀 送信ボタン */}
          <button
            type="submit"
            disabled={isSubmitting || !content.trim() || !imageFile}
            className={`w-full py-5 rounded-[24px] font-black text-lg shadow-lg flex items-center justify-center gap-3 transition-all active:scale-95 ${
              isSubmitting || !content.trim() || !imageFile
                ? 'bg-gray-100 text-gray-400' 
                : 'bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-pink-200'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                <span>UPLOADING...</span>
              </>
            ) : (
              <>
                <span>日記を公開する ✨</span>
                <Send size={20} />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}