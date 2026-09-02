import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Өгөөмж Архад — Сэтгэлд хүрсэн амт",
    short_name: "Өгөөмж Архад",
    description: "Өгөөмж Архад ХХК-ийн бүтээгдэхүүн, үйлдвэр болон онлайн захиалга.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#F00028",
    lang: "mn",
    icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }],
  };
}
