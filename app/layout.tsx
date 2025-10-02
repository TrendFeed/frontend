import type { Metadata } from "next";
import "./globals.css";
import ReduxProvider from "@/lib/providers/ReduxProvider";

export const metadata: Metadata = {
  title: "TrendFeed - GitHub Trending as Comics",
  description: "Discover GitHub trending repositories as comic-style visual content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}
