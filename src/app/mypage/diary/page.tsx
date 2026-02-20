'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, X, UploadCloud, ChevronLeft } from 'lucide-react';
import { createClient } from '@/src/utils/supabase/client';

export default function DiaryPostPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 画像選択時の処理
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // 画像の取り消し
  const clearImage = () => {
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 投稿処理
  const handleSubmit = async () => {
    if (!image || !content.trim()) {
      alert('写真とメッセージを入力してね 🌸');
      return;
    }

    setIsUploading(true);
    try {
      // 1. ログインユーザーの取得
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('ログインが必要です');

      // 2. Storage への画像アップロード
      const fileExt = image.name.split('.').pop();
      const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('diary-photos')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      // 3. Database (diariesテーブル) への保存
      const { error: dbError } = await supabase
        .from('diaries')
        .insert({
          cast_id: user.id,
          content: content,
          image_path: filePath,
        });

      if (dbError) throw dbError;
      
      // 💡 外部サイトへのメール送信等は、DBのTriggerやEdge Functionsで組むのが一般的ですが、
      // プロトタイプとしてはここで成功メッセージを表示します。

      alert('日記をアップしました！');
      router.push('/mypage'); // 投稿後にマイページへ
      router.refresh(); // データを最新に更新
    } catch (error: any) {
      console.error('Error posting diary:', error);
      alert('ごめんね、エラーが出ちゃったみたい：' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* ヘッダー */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-pink-50 px-4 py-3 flex items-center justify-between">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-[18px] font-black text-pink-500 tracking-tighter">写メ日記をかく 🌸</h1>
        <div className="w-10" /> {/* ダミー */}
      </header>

      <main className="p-4 space-y-6 max-w-md mx-auto">
        
        {/* 画像アップロードエリア */}
        <section>
          <p className="text-[12px] font-black text-pink-300 mb-2 ml-1 uppercase tracking-widest">Step 1: Photo</p>
          <div 
            onClick={() => !preview && fileInputRef.current?.click()}
            className={`relative aspect-square rounded-[32px] border-4 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden
              ${preview ? 'border-pink-200' : 'border-pink-100 bg-pink-50/30 hover:bg-pink-50'}`}
          >
            {preview ? (
              <>
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  onClick={(e) => { e.stopPropagation(); clearImage(); }}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </>
            ) : (
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-pink-200">
                  <Camera className="text-white" size={32} />
                </div>
                <p className="text-[14px] font-black text-pink-400">写真をえらぶ</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        </section>

        {/* テキスト入力エリア */}
        <section>
          <p className="text-[12px] font-black text-pink-300 mb-2 ml-1 uppercase tracking-widest">Step 2: Message</p>
          <div className="bg-pink-50/30 rounded-[24px] border-2 border-pink-100 p-4 focus-within:border-pink-300 transition-colors">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="今日のお客様とのエピソードや、今の気分を書いてね 🌸"
              className="w-full min-h-[120px] bg-transparent border-none focus:ring-0 text-[15px] font-bold text-gray-700 placeholder:text-pink-200 resize-none"
            />
          </div>
        </section>

        {/* 投稿ボタン */}
        <button
          onClick={handleSubmit}
          disabled={isUploading || !image || !content.trim()}
          className={`w-full py-5 rounded-[24px] font-black text-[18px] shadow-xl transition-all active:scale-[0.95] flex items-center justify-center gap-2
            ${isUploading || !image || !content.trim() 
              ? 'bg-gray-100 text-gray-300' 
              : 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-pink-200'}`}
        >
          {isUploading ? (
            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UploadCloud size={22} />
              <span>日記を公開する 🌸</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-gray-300 text-center font-bold px-4 leading-relaxed">
          ※公開すると、公式サイトと外部サイトに<br />同時に投稿されます。
        </p>
      </main>
    </div>
  );
}