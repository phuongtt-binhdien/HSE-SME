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

Tab **Mô Phỏng 3D Nhà Máy** (`src/sim/`) — trình mô phỏng vận hành dây chuyền NPK 20 t/h theo kiểu phòng điều khiển: cảnh 3D three.js (phân xưởng dây chuyền tạo hạt số 2 dựng theo mặt bằng thiết bị và bản vẽ CN-04: lò đốt sinh khối → cyclone chùm → quạt thổi → thùng sấy Ø2,2×22 m → cyclone đơn → túi vải 432 túi → quạt hút → ống khói 22 m; 24 thiết bị, ống khói có khói, nhãn, camera theo khu vực, chế độ xuyên thấu, gợi ý), sơ đồ công nghệ bấm đóng/cắt có khóa liên động (có thể bỏ khóa), khởi động/dừng tự động theo trình tự chuẩn, dừng khẩn cấp, báo động + nhật ký, gây sự cố (bết/thủng túi lọc, cạn dung dịch hấp thụ NH₃, hỏng máy thổi khí, mất mồi bơm định lượng), 5 bài tập có chấm bước, và lớp nồng độ mặt đất từ mô hình Gauss ISC3 theo thiết bị đang chạy. Logic thuần ở `plantSim.ts`/`plume.ts` (có kiểm thử `tests/plantSim.test.ts`), đồ họa ở `scene3d.ts`, giao diện ở `PlantSim.tsx`. Bố trí mặt bằng là sơ đồ minh họa, chưa phải bản vẽ đo đạc; ngưỡng trong mô phỏng lấy từ MT-QP.01, QCVN 21:2009, QCVN 40:2011 (K_q=1,2; K_f=1,1) và cần đối chiếu bản gốc.

Tab **Mô Phỏng Dòng Nước Thải** (`src/sim/wwtp.ts`, `WwtpSim.tsx`) — mô phỏng dòng chảy từ đầu vào qua HTXLNT 120 m³/ngày.đêm (sơ đồ sau cải tạo B01–B15 hoặc hiện hữu theo báo cáo khảo sát Global Green) tới cống xả sông Vàm Cỏ Đông: chuỗi bể khuấy trộn hoàn toàn có thủy lực (bơm WP, mực nước, tràn), hóa lý (PAC/polymer, hiệu chỉnh pH), sinh học (DO, nitrat hóa theo tải), lắng, lọc, khử trùng, bể sinh thái, van xả tự đóng/hồ sự cố, chất chỉ thị, so sánh QCVN 40:2011 (Kq, Kf) hoặc QCVN 14:2025, pha loãng sông (minh họa). Thể tích bể suy từ thời gian lưu giả định và hệ số xử lý là chỉ thị, chưa hiệu chuẩn — chỉ dùng huấn luyện/so sánh định tính. Kiểm thử: `tests/wwtp.test.ts`.

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


## Tài khoản người dùng, ví credit và huấn luyện vào nhà máy

App yêu cầu đăng nhập (Supabase Auth: email + mật khẩu). Sau đăng nhập, các tab dữ liệu nội bộ (hồ sơ nhà máy, hóa chất, nước thải, năng lượng, chất thải, nhà thầu, an toàn, huấn luyện ATVSLĐ) miễn phí; **mô phỏng 3D, mô phỏng nước thải, các mô hình Gauss (lan truyền, GPMT 01, nguồn thấp), biểu mẫu ISO 14001 và báo cáo GRI** mở khóa theo phiên (mặc định 24 giờ) bằng credit. 1 credit = 1.000đ; gói nạp 100k→100, 200k→220 (+10 %), 300k→345 (+15 %), 400k→480 (+20 %), 500k→625 (+25 %). Giá từng dịch vụ chỉnh trong tab **Quản Trị**.

- **Nạp credit**: người dùng chọn gói → app tạo nội dung chuyển khoản duy nhất (HSE + 6 ký tự) và mã VietQR vẽ ngay trên trình duyệt (`src/auth/vietqr.ts`, không gọi dịch vụ ngoài) → quản trị đối chiếu sao kê rồi **Duyệt** (credit cộng ngay) hoặc cấp **mã kích hoạt** dùng một lần (nhập sai 5 lần bị khóa 1 giờ).
- **Huấn luyện an ninh – an toàn trước khi vào nhà máy (15 phút)**: 6 phần nội dung + 10 câu hỏi, đạt ≥ 80 %. Thời gian tối thiểu do **máy chủ** đo (không tin đồng hồ trình duyệt), đáp án nằm trong bảng không ai đọc được qua API. Bắt buộc trước khi mở Mô phỏng 3D; có giấy xác nhận để in; hiệu lực 365 ngày. Nội dung là bản mẫu — cán bộ ATVSLĐ/PCCC cần rà soát, bổ sung điểm tập kết, số khẩn cấp trước khi áp dụng chính thức.
- **Quản trị**: duyệt nạp tiền, danh sách người dùng + điều chỉnh credit (bắt buộc lý do, có sổ cái), tạo mã nạp, giá dịch vụ, tài khoản nhận tiền, tham số huấn luyện.

### Cài đặt backend (một lần)
1. Trong Supabase (SQL Editor) chạy `supabase/migrations/20261121000000_hse_accounts_credits.sql` — mọi đối tượng mang tiền tố `hse_`, không đụng bảng của ứng dụng khác dùng chung dự án; không tạo trigger trên `auth.users`.
2. Cấp quyền quản trị: `insert into public.hse_admins(user_id) select id from auth.users where email = 'email-quan-tri@...';`
3. Đăng nhập bằng tài khoản quản trị → tab **Quản Trị → Cấu hình**: nhập BIN, số tài khoản, tên chủ tài khoản nhận tiền (và Zalo liên hệ nếu có).
4. Supabase → Authentication: quyết định có bắt xác nhận email hay không; URL/khóa lấy từ `src/auth/config.ts` hoặc biến `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY` (khóa publishable là khóa công khai).

Kiểm thử: `tests/hseCredits.test.ts` chạy migration trên PGlite (Postgres WASM) và kiểm tra gói nạp, duyệt nạp, mã kích hoạt, mở khóa dịch vụ, huấn luyện 15 phút, phân quyền; `tests/vietqr.test.ts` kiểm tra CRC và chuỗi VietQR. `?backend=local` (thêm `&fast=1` để rút thời gian huấn luyện còn 5 giây) chạy bản thử lưu trong trình duyệt để demo giao diện — **không an toàn, không dùng thu tiền thật**.

**Giới hạn cần biết:** app là web tĩnh, toàn bộ mã tính toán nằm trong gói JavaScript gửi cho trình duyệt; khóa credit hiện chặn giao diện chứ chưa ngăn người rành kỹ thuật đọc mã. Muốn bảo vệ thật sự cần chuyển phần tính toán trả phí sang hàm máy chủ (Edge Function).

## Kiểm kê khí nhà kính
Tab **Kiểm Kê Khí Nhà Kính** (`src/data/ghg.ts`, `src/lib/ghg.ts`, `src/ghg/GhgModule.tsx`) nạp hai báo cáo kiểm kê KNK của Nhà máy do ECC Bách Khoa lập: ký 22/02/2025 (**kiểm kê năm 2024: 17.655,89 tCO₂e**, Phạm vi 1 11.422,63; Phạm vi 2 6.233,26; 42,9 kg CO₂e/tấn NPK; độ chính xác 1,65) và ký 29/07/2024 — **số liệu kiểm kê là năm 2023** (tổng 15.260,14 tCO₂e: Phạm vi 1 9.637,5; Phạm vi 2 5.622,6; cường độ ≈ 33,6 kg CO₂e/tấn NPK; độ chính xác B). Có biểu đồ theo tháng, cơ cấu nguồn, bảng kết quả, bảng nhập số liệu năm 2024 và 2025 tính theo cùng phương pháp (TT 38/2023/TT-BCT, hệ số QĐ 2626/QĐ-BTNMT, GWP IPCC AR6) kèm danh sách điểm cần rà soát trong báo cáo. `tests/ghg.test.ts` tái tạo kết quả báo cáo từ số liệu hoạt động (sai lệch < 0,01 %). Báo cáo 2024 và 2025 chưa có: cần số liệu hoạt động của hai năm.

## Màn hình DCS nước thải (từ P&ID đến bài đào tạo vận hành)
Tab **Màn Hình DCS Nước Thải** (`src/sim/dcs.ts`, `DcsScreen.tsx`) dựng màn hình vận hành cho HTXLNT sau cải tạo theo quy trình “sơ đồ → JSON → kỹ sư duyệt → mô phỏng → mimic”: mô hình thiết bị/đo lường/vòng điều khiển (`PID_MODEL`, `INSTRUMENTS`, `LOOPS`), hai vòng PID thật trong mô hình nước thải (AIC-901 giữ DO bể hiếu khí bằng tốc độ máy thổi khí; AIC-501 giữ pH bể keo tụ bằng châm NaOH/axit; chế độ AUTO/MAN, SP, OUT), faceplate bơm/máy thổi khí/châm hóa chất/van xả, báo động ISA-18.2 (HH/LL = P1, H/L = P2, ghi nhận, nhật ký, trở về bình thường), xu hướng và 4 bài thử thách có chấm đạt/không đạt (sốc pH 12, máy thổi khí A hỏng, bơm WP04 dừng, mất châm PAC). `tests/dcs.test.ts` kiểm tra PID bám SP, báo động và rằng mỗi thử thách vừa giải được vừa thất bại nếu không xử lý. **Mã tag do mô hình đề xuất — bản vẽ gốc chưa có danh mục thiết bị đo; kỹ sư tự động hóa/vận hành cần duyệt.**

**DCS dây chuyền sản xuất** (`src/sim/PlantDcs.tsx`): tab **Màn Hình DCS Dây Chuyền** đưa dây chuyền tạo hạt số 2 – Nguồn 04 (24 thiết bị, đường vật liệu/khí nóng/khí thải) lên mimic kiểu DCS với bong bóng đo (TT-301/302, PDT-501, AT-601/602, PT-801, WT-901), hai vòng PID mới trong `plantSim.ts` — **TIC-301** (nhiệt độ ra thùng sấy → cấp nhiên liệu lò đốt) và **PDIC-501** (rũ bụi túi lọc theo yêu cầu; khi bết túi xung tự động không đủ, phải rũ/thay thủ công) —, khóa liên động, báo động P1/P2, nhật ký, xu hướng, bảng gây sự cố cho giảng viên và 5 bài tập chấm điểm sẵn có (khởi động, dừng đúng thứ tự, ΔP cao, NH₃ vượt, HTXLNT). Mã tag và vòng điều khiển do mô hình đề xuất, cần kỹ sư duyệt.

## Màn hình DCS xử lý khí thải (tab "Màn Hình DCS Khí Thải")

`src/sim/gas.ts` (mô hình thuần, có test `tests/gas.test.ts`) + `src/sim/GasDcs.tsx` (giao diện). Dựng theo **Phụ lục 2 GPMT 2986/GPMT-STNMT**: 7 dòng thải có hệ thống xử lý
(lò hơi than 8 t/h: lọc bụi ướt → tháp kiềm NaOH; 5 hệ lò sấy: cyclone chùm → lọc bụi túi vải; phối trộn hữu cơ: lọc bụi túi vải), giới hạn QCVN 19/21:2009 cột B (Kp 0,8).
Gồm: mimic 7 dòng, faceplate (tải, quạt hút, rũ bụi/PDIC, thay túi, khí nén, bơm tuần hoàn, vòng pH AIC), báo động P1/P2 có ACK, nhật ký, xu hướng, và 4 bài thử thách tự chấm
(rách túi lọc, NaOH mất mồi, quạt hút trip, mất khí nén). Số liệu chưa có trong hồ sơ (khí thô, hiệu suất, mã tag) là giả định — xem `DATA_GAPS` và `EMISSION_SOURCES` trong `src/data/facility.ts`.

Trạng thái nền của mô hình khí thải được hiệu chỉnh theo 6 phiếu quan trắc 2026 (`MONITORING_2026`, `src/data/facility.ts`) và hồ sơ đề nghị điều chỉnh GPMT 10/11/2026 (`GPMT_ADJUSTMENT`): bụi ống khói 13–19 mg/Nm³, NH₃ < 2 mg/Nm³, lưu lượng thực ≈ 56–85 % thiết kế; ống khói nguồn 04 dùng D2 1,5 m theo hồ sơ điều chỉnh (chưa được cấp phép).

## Tab "Phí BVMT Khí & Nước Thải"

`src/fees/FeesModule.tsx`, `src/lib/fees.ts`, `src/data/fees.ts`, `tests/fees.test.ts`. Nạp 2 thông báo của Sở NN&MT Tây Ninh (khí thải 25439/TB-SNNMT 16/11/2026: 1.536.858 đ; nước thải 24989/TB-SNNMT 11/11/2026: 407.600 đ, Quý I+II/2026), trạng thái nộp (đã nộp đến hết Quý II/2026, lưu trong trình duyệt) và bảng ước tính các quý sau. Các mức phí được suy ra bằng cách khớp ngược thông báo (sai số ≤ 2 đồng) — cần đối chiếu NĐ 153/2024 và NĐ 346/2025 trước khi dùng cho tờ khai.

## Tab "EPR Bao Bì · Đóng Quỹ"

`src/epr/EprModule.tsx`, `src/lib/epr.ts`, `src/data/epr.ts`, `tests/epr.test.ts`. Từ Tờ trình Phòng KT-SX (11/2026) theo Nghị định 110/2026/NĐ-CP: 2 kỳ đã kê khai (F = V×R×Fs: 840.707.206 đ và 944.283.656 đ), bảng số lượng bao bì theo quy cách → V, so sánh đóng Quỹ BVMT Việt Nam với thuê đơn vị tái chế (báo giá Eco Revive), mốc thời gian, danh sách việc cần làm rõ. Khối lượng 1 bao mặc định là giả định.
