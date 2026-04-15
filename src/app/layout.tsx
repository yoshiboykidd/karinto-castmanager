import type { Metadata, Viewport } from "next";
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";

// 📍 アイコンとタイトルの設定（ここでホーム画面のアイコンを指定）
export const metadata: Metadata = {
  title: "Karinto Cast Manager",
  description: "かりんとキャスト専用アプリ",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffc0cb", // サクラピンク
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {/* ロジック部分はクライアントコンポーネントに任せる */}
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}