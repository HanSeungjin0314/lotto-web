import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "로또 통계형 번호 추첨기",
    short_name: "로또추첨기",
    description: "역대 로또 당첨번호 통계를 기반으로 번호를 추천하는 웹앱",
    start_url: "/",
    display: "standalone",
    background_color: "#eef5ff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}