# HSE-SME
quản lý môi trường cho doanh nghiệp SME

| Thư mục / tệp | Nội dung |
|---|---|
| `ehsviet/` | **Ứng dụng chính** — React + TypeScript + Supabase (PWA, đa tổ chức): Chất thải & CTNH, Vận hành & Quan trắc, PCCC & An toàn, **Nhân sự & Huấn luyện**, **Nội quy & Vi phạm**, **ESG · GRI · Khí nhà kính**, Hồ sơ & Tuân thủ. Hướng dẫn cài đặt: [`ehsviet/README.md`](ehsviet/README.md) |
| `hse_integrated_platform.jsx`, `hse_deploy_ready.tar_2.gz` | Bản mẫu giao diện trước đây (dữ liệu tĩnh) |

Dùng thử nhanh (không cần máy chủ):

```bash
cd ehsviet
npm install
npm run dev        # mở http://localhost:5173 → "Vào bản dùng thử"
```

Triển khai Vercel: `vercel.json` ở thư mục gốc tự build `ehsviet/` (đặt Root Directory = `ehsviet`
cũng được). Khai báo `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` trong Environment Variables
(không khai báo thì trang chạy ở chế độ dùng thử).
