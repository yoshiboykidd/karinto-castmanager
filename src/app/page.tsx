'use client';

import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <main className="min-h-screen bg-[#FFFDFE] p-10">
        <h1 className="text-2xl font-black text-pink-400">
          TEST: これが表示されたら page.tsx は生きています
        </h1>
        <p className="text-gray-500 mt-4">
          外部コンポーネントをすべて非表示にしました。
        </p>
      </main>
    </Suspense>
  );
}