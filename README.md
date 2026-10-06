# HSE-SME

Nền tảng quản lý Môi trường – An toàn (HSE) cho doanh nghiệp SME — bản mẫu cho Nhà máy Phân bón Bình Điền · Long An (GPMT 2986/GPMT-STNMT).

**Module:** Dashboard tổng hợp · Hóa chất · Nước thải (QCVN 40) · Năng lượng & CO₂e · Chất thải/CTNH · Báo cáo GRI · Quản lý nhà thầu (PTW, QR check-in, induction) · Kiểm soát nội bộ (checklist) · Sự cố & vi phạm.

> Dữ liệu hiện là dữ liệu mẫu (seed) trong `src/app/HSEApp.tsx`, lưu trong bộ nhớ trình duyệt — tải lại trang sẽ về trạng thái ban đầu.

## Chạy local

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # xuất web tĩnh vào thư mục out/
```

Yêu cầu Node.js ≥ 18.17.

## Deploy

App xuất ra web tĩnh (`output: "export"`), không cần Next.js server khi chạy.

- **Vercel (khuyến nghị):** vercel.com → New Project → Import repo `HSE-SME` → Deploy. Mỗi lần push lên `main` tự deploy lại. Cấu hình sẵn trong `vercel.json` (region `sin1`).
- **Vercel CLI:** `./deploy.sh`
- **Netlify / hosting tĩnh bất kỳ:** `npm run build` rồi upload thư mục `out/` (Netlify: `netlify deploy --prod --dir=out`).

## Cấu trúc

```
src/app/
├── layout.tsx   ← khung HTML, font
├── page.tsx     ← entry, render HSEApp phía client
├── icon.svg     ← favicon
└── HSEApp.tsx   ← toàn bộ ứng dụng
```
