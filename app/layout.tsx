import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Өгөөмж Архад ХХК — Сэтгэлд хүрсэн амт",
  description:
    "Өгөөмж Архад ХХК — Монголын нарийн боов, хүнсний үйлдвэрлэгч. Уламжлалт жор, орчин үеийн үйлдвэрлэл.",
  icons: {
    icon: "/legacy/favicon.svg",
    shortcut: "/legacy/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/legacy/assets/index-CC0e9Jox.css" />
        <style>{`
          @font-face {
            font-family: "Uguumj Noto Serif";
            src: url("/fonts/NotoSerif-Uguumj.ttf") format("truetype");
            font-style: normal;
            font-weight: 100 900;
            font-display: swap;
          }
          @font-face {
            font-family: "Uguumj Manrope";
            src: url("/fonts/Manrope-Uguumj.ttf") format("truetype");
            font-style: normal;
            font-weight: 200 800;
            font-display: swap;
          }
          html[lang="mn"] {
            --app-font-serif: "Uguumj Noto Serif", serif;
            --app-font-sans: "Uguumj Manrope", sans-serif;
          }
          html[lang="en"] {
            --app-font-serif: "Playfair Display", serif;
            --app-font-sans: "Noto Sans", sans-serif;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
