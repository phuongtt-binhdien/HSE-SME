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

## Nguồn thấp, nguồn đường, nguồn mặt

Tab **Nguồn Thấp · Đường · Mặt** (`src/lib/lowSources.ts`) theo Giáo trình Kiểm soát ô nhiễm không khí, mục 1.2.3: nguồn thấp cạnh nhà rộng đứng độc lập (Bảng 1.3, PT 1.21–1.27, hệ số S PT 1.40–1.44, k số hóa từ Hình 1.6), nguồn đường (PT 1.48–1.50, σ Pasquill–Gifford), đường phố hẻm (PT 1.52–1.53), nguồn mặt Gifford–Hanna (PT 1.55, Bảng 1.5) và mô hình hộp cố định (PT 1.57).

Tab **Mô Phỏng 3D Nhà Máy** (`src/sim/`) — trình mô phỏng vận hành dây chuyền NPK 20 t/h theo kiểu phòng điều khiển: cảnh 3D three.js (22 thiết bị, ống khói có khói, nhãn, camera theo khu vực, chế độ xuyên thấu, gợi ý), sơ đồ công nghệ bấm đóng/cắt có khóa liên động (có thể bỏ khóa), khởi động/dừng tự động theo trình tự chuẩn, dừng khẩn cấp, báo động + nhật ký, gây sự cố (bết/thủng túi lọc, cạn dung dịch hấp thụ NH₃, hỏng máy thổi khí, mất mồi bơm định lượng), 5 bài tập có chấm bước, và lớp nồng độ mặt đất từ mô hình Gauss ISC3 theo thiết bị đang chạy. Logic thuần ở `plantSim.ts`/`plume.ts` (có kiểm thử `tests/plantSim.test.ts`), đồ họa ở `scene3d.ts`, giao diện ở `PlantSim.tsx`. Bố trí mặt bằng là sơ đồ minh họa, chưa phải bản vẽ đo đạc; ngưỡng trong mô phỏng lấy từ MT-QP.01, QCVN 21:2009, QCVN 40:2011 (K_q=1,2; K_f=1,1) và cần đối chiếu bản gốc.

## Hồ sơ nhà máy và huấn luyện ATVSLĐ

- Tab **Hồ Sơ Nhà Máy** (`src/data/facility.ts`): thông tin, tiếp giáp, quy mô, hóa chất cần kiểm soát, văn bản nội bộ (QĐ 385/2026, 759, 199…), nội quy an toàn, căn cứ pháp lý và các điểm số liệu chưa thống nhất giữa tài liệu. Nguồn: `docs/tong-hop-tai-lieu-nha-may.md`.
- Tab **Huấn Luyện ATVSLĐ** (`src/data/training2026.ts`): 328 lượt học viên nhóm 4, 5, 6 năm 2026 — lọc, tìm kiếm, hạn huấn luyện lại, đánh dấu đã ký (lưu trên trình duyệt), chép danh sách sang Excel. Chỉ lưu họ tên, năm sinh, bộ phận; không lưu số CCCD.

## Biểu mẫu ISO 14001

Tab **Biểu Mẫu ISO 14001** (`src/data/isoForms.ts`): biểu mẫu điện tử MT-HD04-BM02 (nhật ký nước thải), MT-HD04-BM06 (biên bản dừng xả), MT-HD05-BM03/04 (nhật ký nồi hơi, lò đốt), MT-HD07-06/05 (sổ nhà thầu, cam kết), MT-HD07-02 (phiếu giám sát nhà thầu), MT-QT04-BM01 (phiếu MOC, có sẵn 5 thay đổi đang mở); tự cảnh báo giá trị vượt giới hạn; danh mục tài liệu cấp 2, biểu mẫu, bộ Fxxx; 10 tồn tại có chế tài (Sổ tay Phụ lục 4). Bản ghi lưu trên trình duyệt, chép sang Excel.

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
