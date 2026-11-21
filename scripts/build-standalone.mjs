// Đóng gói toàn bộ app thành 1 file HTML tự chứa (dist/hse-platform.html):
// mở trực tiếp bằng trình duyệt hoặc đặt lên bất kỳ hosting tĩnh nào, không cần Next.js/Vercel.
import { build } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";

const result = await build({
  entryPoints: ["scripts/standalone-entry.tsx"],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2018",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});

// Chặn chuỗi "</script>" trong bundle làm đóng thẻ script sớm
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const html = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HSE Platform — Bình Điền NPK</title>
<meta name="description" content="Hệ thống quản lý môi trường, an toàn, nhà thầu — Nhà máy Phân bón Bình Điền">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Mono:wght@400;500&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root { --bg: #05080f; color-scheme: dark; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; background: var(--bg); }
</style>
</head>
<body>
<div id="root"></div>
<script>${js}</script>
</body>
</html>
`;

mkdirSync("dist", { recursive: true });
writeFileSync("dist/hse-platform.html", html);
console.log(`dist/hse-platform.html — ${(html.length / 1024).toFixed(0)} kB`);
