import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "@/lib/providers/ReduxProvider";
import { AuthProvider } from "@/lib/contexts/AuthContext";

// 페이지 메타데이터 설정
export const metadata: Metadata = {
  title: "TrendFeed - GitHub Trending as Comics",
  description: "Discover GitHub trending repositories as comic-style visual content",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/blue_star.png", type: "image/png" }
    ],
    apple: "/blue_star.png",
  },
};

// 루트 레이아웃 컴포넌트 - 모든 페이지에 공통적으로 적용되는 레이아웃
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {/* Auth Provider로 Firebase 인증 상태 관리 */}
        <AuthProvider>
          {/* Redux 상태 관리 Provider로 자식 컴포넌트 감싸기 */}
          <ReduxProvider>{children}</ReduxProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
