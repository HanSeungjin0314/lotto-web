import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "로또스탯픽 - 로또 통계형 번호 추첨기",
    short_name: "로또스탯픽",
    description:
      "역대 로또 당첨번호 통계를 기반으로 추천번호를 생성하는 통계형 로또 번호 추첨기입니다.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef5ff",
    theme_color: "#2563eb",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}