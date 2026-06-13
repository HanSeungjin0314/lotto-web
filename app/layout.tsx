import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata = {
  title: "로또 통계형 번호 추첨기",
  description: "역대 로또 당첨번호 통계를 기반으로 번호를 추천하는 웹앱",
  applicationName: "로또추첨기",
  themeColor: "#2563eb",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <a href="/" className="brand">로또 통계형 추첨기</a>
          <nav>
            <a href="/stats">번호통계</a>
            <a href="/history">역대번호</a>
            <a href="/admin">관리자</a>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
