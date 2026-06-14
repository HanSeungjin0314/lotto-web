"use client";

import { usePathname } from "next/navigation";

export function AdBanner() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <section className="ad-banner" aria-label="광고 영역">
      <div>
        <span>AD</span>
        <strong>광고 배너 영역</strong>
        <p>추후 Google AdSense 승인 후 광고 코드가 들어갈 위치입니다.</p>
      </div>
    </section>
  );
}