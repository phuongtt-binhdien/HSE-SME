import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "HSE Platform — Bình Điền NPK",
  description: "Hệ thống quản lý môi trường, an toàn, nhà thầu — Nhà máy Phân bón Bình Điền",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { height: 100%; background: #05080f; }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0, background: "#05080f" }}>
        {children}
      </body>
    </html>
  );
}
