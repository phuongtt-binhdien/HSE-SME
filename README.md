# HSE-SME

Nền tảng quản lý Môi trường – An toàn (HSE) cho doanh nghiệp SME — bản mẫu cho Nhà máy Phân bón Bình Điền · Long An (GPMT 2986/GPMT-STNMT).

**Module:** Dashboard tổng hợp · Hóa chất · Nước thải (QCVN 40) · Lan truyền khí thải (mô hình Gauss) · Năng lượng & CO₂e · Chất thải/CTNH · Báo cáo GRI · Quản lý nhà thầu (PTW, QR check-in, induction) · Kiểm soát nội bộ (checklist) · Sự cố & vi phạm.

> Dữ liệu hiện là dữ liệu mẫu (seed) trong `src/app/HSEApp.tsx`, lưu trong bộ nhớ trình duyệt — tải lại trang sẽ về trạng thái ban đầu.

## Chạy local

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build      # xuất web tĩnh vào thư mục out/
npm run build:standalone   # đóng gói thành 1 file dist/hse-platform.html
```

Yêu cầu Node.js ≥ 18.17.

## Mô hình lan truyền khí thải (Gauss)

Tab **Lan Truyền Khí Thải** tính nồng độ chất ô nhiễm trong không khí xung quanh từ một ống khói theo mô hình Gauss: σy, σz theo Briggs (1973) nông thôn/đô thị, độ nâng luồng khói Briggs (dạng EPA ISC3), quy đổi gió theo độ cao, nồng độ cực đại mặt đất, bản đồ mặt bằng và so sánh với giới hạn 1 giờ QCVN 05:2023/BTNMT (có cộng nồng độ nền).

- Công thức: `src/lib/gaussPlume.ts` · tài liệu cơ sở: `docs/mo-hinh-gauss-lan-truyen-o-nhiem.md`
- Kiểm thử (bảo toàn khối lượng, công thức mặt đất, độ nâng Briggs…): `npm test`
- Phạm vi: nguồn điểm liên tục, địa hình phẳng, 100 m – 10 km; dùng để đánh giá nhanh, không thay thế AERMOD/CALPUFF trong hồ sơ ĐTM/GPMT.

## Deploy

App xuất ra web tĩnh (`output: "export"`), không cần Next.js server khi chạy.

- **Vercel (khuyến nghị):** vercel.com → New Project → Import repo `HSE-SME` → Deploy. Mỗi lần push lên `main` tự deploy lại. Cấu hình sẵn trong `vercel.json` (region `sin1`).
- **Vercel CLI:** `./deploy.sh`
- **1 file HTML:** `npm run build:standalone` → mở `dist/hse-platform.html` bằng trình duyệt (cần Internet chỉ để tải font), hoặc gửi/đặt file này lên bất kỳ hosting tĩnh nào.
- **Netlify / hosting tĩnh bất kỳ:** `npm run build` rồi upload thư mục `out/` (Netlify: `netlify deploy --prod --dir=out`).

## Cấu trúc

```
src/app/
├── layout.tsx   ← khung HTML, font
├── page.tsx     ← entry, render HSEApp phía client
├── icon.svg     ← favicon
└── HSEApp.tsx   ← toàn bộ ứng dụng
```
