# HSE-SME
quản lý môi trường cho doanh nghiệp SME

| Thư mục / tệp | Nội dung |
|---|---|
| `ehsviet/` | **Ứng dụng chính** — React + TypeScript + Supabase (PWA, đa tổ chức), vận hành theo **PDCA**: **P** Kế hoạch & lộ trình (năm, 5 năm, Net Zero 2050), Tổ chức bộ máy HSE, Hồ sơ & nghĩa vụ · **D** Nhân sự & Huấn luyện, Thiết bị & bảo trì, Hóa chất, Chất thải & CTNH, EPR & Tuần hoàn, Vận hành & Quan trắc, PCCC & An toàn · **C** Kiểm tra định kỳ, Sức khỏe nghề nghiệp, ESG · GRI · Khí nhà kính · **A** Hành động khắc phục, Nội quy & Vi phạm (căn cứ pháp lý rà soát 10/2026). Hướng dẫn cài đặt: [`ehsviet/README.md`](ehsviet/README.md); kế hoạch 3 tháng: [`ehsviet/docs/KE_HOACH_PDCA.md`](ehsviet/docs/KE_HOACH_PDCA.md) |
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
