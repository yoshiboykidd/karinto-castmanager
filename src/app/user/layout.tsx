import React from 'react';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="min-h-screen bg-white">
      {/* お客様用ページの共通レイアウト（背景色など）をここで管理できます */}
      {children}
    </section>
  );
}