'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client'; // 📍 共通クライアント [cite: 2026-02-20]
import { Send, X, Loader2, ImagePlus, Sparkles } from 'lucide-react';

interface DiaryFormProps {
  castProfile: any;
  onPostSuccess: () => void;
}

export default function DiaryForm({ castProfile, onPostSuccess }: DiaryFormProps) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 📸 写真選択 ＋ 自動圧縮ロジック [cite: 2026-02-21]
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 長辺を1200pxにリサイズ [cite: 2026-02-21]
        const maxSide = 1200;
        if (width > height) {
          if (width > maxSide) {
            height *= maxSide / width;
            width = maxSide;
          }
        } else {
          if (height > maxSide) {
            width *= maxSide / height;
            height = maxSide;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // 画質 0.7 の JPEG に変換 [cite: 2026-02-21]
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            setImageFile(compressedFile);
            setPreviewUrl(URL.createObjectURL(compressedFile));
          }
        }, 'image/jpeg', 0.7);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 🚀 投稿処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !imageFile || !castProfile) return;

    setIsSubmitting(true);
    try {
      const fileName = `${castProfile.login_id}_${Date.now()}.jpg`;
      const filePath = `${castProfile.login_id}/${fileName}`;

      // 1. Storageへアップロード [cite: 2026-02-21]
      const { error: uploadError } = await supabase.storage
        .from('diary-photos')
        .upload(filePath, imageFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('diary-photos').getPublicUrl(filePath);

      // 2. DBへ保存 [cite: 2026-02-21]
      const { error: dbError } = await supabase.from('diary_posts').insert([{
        cast_id: castProfile.login_id,
        cast_name: castProfile.display_name,
        content: content.trim(),
        image_url: publicUrl,
        shop_id: castProfile.home_shop_id,
        created_at: new Date().toISOString(),
      }]);

      if (dbError) throw dbError;

      // 成功時のリセット処理
      setContent('');
      setImageFile(null);
      setPreviewUrl(null);
      onPostSuccess(); // 親コンポーネントに通知してリストを更新
      alert('日記をアップしました！✨');
    } catch (err: any) {
      alert('投稿エラー: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 px-2">
        <Sparkles size={16} className="text-pink-400" />
        <h2 className="text-xs font-black text-pink-400 uppercase tracking-[0.2em]">New Post</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 写真選択エリア */}
        <div className="relative group">
          {previewUrl ? (
            <div className="relative aspect-[4/5] w-full rounded-[40px] overflow-hidden shadow-xl border-4 border-white">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => { setImageFile(null); setPreviewUrl(null); }} 
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full active:scale-90"
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

        {/* テキスト入力エリア */}
        <div className="bg-white rounded-[32px] p-6 shadow-lg shadow-pink-200/10 border border-pink-50">
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            placeholder="今日の一言メッセージを書いてね 🌸" 
            className="w-full h-24 bg-transparent text-gray-700 font-bold leading-relaxed outline-none resize-none placeholder:text-gray-300" 
            maxLength={200} 
          />
          <div className="flex justify-end text-[10px] font-black text-pink-200 pt-2 border-t border-pink-50">
            {content.length} / 200
          </div>
        </div>

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
            <Loader2 className="animate-spin" size={24} />
          ) : (
            <>
              <span>日記をアップする ✨</span>
              <Send size={20} />
            </>
          )}
        </button>
      </form>
    </section>
  );
}