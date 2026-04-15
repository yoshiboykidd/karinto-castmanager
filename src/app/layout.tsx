import type { Metadata, Viewport } from "next";
import "./globals.css";
import RootLayoutClient from "./RootLayoutClient";

// 📍 titleを「KCM」のみに統一
export const metadata: Metadata = {
  title: "KCM", 
  description: "KCM Portal Site", // 万が一検索に引っかかっても分からないように
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffc0cb", 
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}