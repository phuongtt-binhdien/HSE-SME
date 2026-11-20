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

Tab **Lan Truyền Khí Thải** tính nồng độ chất ô nhiễm trong không khí xung quanh từ một ống khói theo thuật toán EPA ISC3: σy, σz Pasquill–Gifford (nông thôn) hoặc Briggs/McElroy–Pooler (đô thị), quy đổi gió theo độ cao, cuốn xuống đỉnh ống khói, độ nâng Briggs do lực nổi hoặc động lượng, lớp xáo trộn, phân hủy, ước tính phát thải theo hệ số AP-42, nồng độ cực đại mặt đất, bản đồ mặt bằng và so sánh với giới hạn 1 giờ QCVN 05:2023/BTNMT (có cộng nồng độ nền).

- Công thức: `src/lib/gaussPlume.ts` · tài liệu cơ sở: `docs/mo-hinh-gauss-lan-truyen-o-nhiem.md`, `docs/tong-hop-NH3-va-mo-hinh-gauss-ISC3.md`
- Kiểm thử (bảo toàn khối lượng, công thức mặt đất, độ nâng Briggs…): `npm test`
- Phạm vi: nguồn điểm liên tục, địa hình phẳng, 100 m – 10 km; dùng để đánh giá nhanh, không thay thế AERMOD/CALPUFF trong hồ sơ ĐTM/GPMT.

## Đánh giá phát tán cho hồ sơ điều chỉnh GPMT — nguồn số 01 (lò hơi)

Tab **GPMT Nguồn 01 — Lò Hơi**: 4 kịch bản vận hành của ống khói chung (lò sinh khối T2–T6 / lò than luân phiên T7–CN; số liệu thiết kế, xả bằng giới hạn GPMT, kết quả quan trắc), sàng lọc 54 tổ hợp lớp ổn định × tốc độ gió theo SCREEN3 để tìm điều kiện khí tượng bất lợi nhất, so sánh QCVN 05:2023 (1 giờ, cộng nền) và QCVN 19:2009 cột B (Kp 0,8; Kv 1,0), kiểm tra chiều cao GEP, nồng độ tại khu dân cư, xuất bảng và đoạn văn cho mục 2.2.2.c của hồ sơ. Số liệu nhập được lưu trên trình duyệt.

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
