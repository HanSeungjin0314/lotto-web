import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AdBanner } from "@/components/AdBanner";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lotto-web-lac.vercel.app"),
  title: {
    default: "로또 통계형 번호 추첨기",
    template: "%s | 로또 통계형 번호 추첨기",
  },
  description:
    "역대 로또 당첨번호 통계를 기반으로 균형형, 고빈도형, 미출현형, 최근100회형 추천번호를 생성하는 웹앱입니다.",
  applicationName: "로또추첨기",
  manifest: "/manifest.webmanifest",
  keywords: [
    "로또",
    "로또번호",
    "로또번호추첨기",
    "로또통계",
    "로또추천번호",
    "로또당첨번호",
    "로또자동추첨",
    "통계형 로또",
  ],
  openGraph: {
    title: "로또 통계형 번호 추첨기",
    description:
      "역대 로또 당첨번호 통계를 기반으로 추천번호를 생성하는 웹앱입니다.",
    url: "https://lotto-web-lac.vercel.app",
    siteName: "로또 통계형 번호 추첨기",
    locale: "ko_KR",
    type: "website",
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: "로또 통계형 번호 추첨기",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "로또 통계형 번호 추첨기",
    description:
      "역대 로또 당첨번호 통계를 기반으로 추천번호를 생성하는 웹앱입니다.",
    images: ["/og.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <a href="/" className="brand">
            로또 통계형 추첨기
          </a>
          <nav>
            <a href="/stats">번호통계</a>
            <a href="/history">역대번호</a>
          </nav>
        </header>

        {children}

        <AdBanner />

        <footer className="site-footer">
          <div>
            <strong>로또 통계형 번호 추첨기</strong>
            <p>
              본 서비스는 역대 당첨번호 통계를 참고한 번호 추천 도구입니다.
              당첨을 보장하지 않으며, 최종 구매 판단은 이용자 본인의 책임입니다.
            </p>
          </div>

          <div className="footer-links">
            <a href="/stats">번호통계</a>
            <a href="/history">역대번호</a>
          </div>
        </footer>
      </body>

      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}