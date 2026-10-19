# EHSViet — Nền tảng SaaS quản lý Môi trường · An toàn · ESG

Phần mềm quản lý EHS (Environment – Health/Fire – Safety) cho nhà máy Việt Nam, thiết kế theo
mô hình **SaaS đa tổ chức, đa nhà máy**: mỗi công ty là một tổ chức độc lập, dữ liệu cách ly
hoàn toàn bằng Row Level Security. Ứng dụng là **PWA** — một mã nguồn chạy trên web và cài
được lên màn hình chính điện thoại như app.

> Tên "EHSViet" là tên làm việc — đổi thương hiệu tự do (logo tại `public/favicon.svg`,
> `public/pwa-*.png`, tên trong `vite.config.ts` và `index.html`).

## Tính năng — vận hành theo chu trình PDCA (15 phân hệ)

| Bước | Phân hệ |
|---|---|
| **P · Kế hoạch** | Kế hoạch & lộ trình (kế hoạch HSE năm, lộ trình hồ sơ 2026–2030, Net Zero 2050) · Tổ chức bộ máy HSE · Hồ sơ & nghĩa vụ |
| **D · Thực hiện** | Nhân sự & Huấn luyện · Thiết bị & bảo trì · Hóa chất · Chất thải & CTNH · EPR & Tuần hoàn · Vận hành & Quan trắc · PCCC & An toàn |
| **C · Kiểm tra** | Kiểm tra định kỳ · Sức khỏe nghề nghiệp · ESG · GRI · Khí nhà kính |
| **A · Cải tiến** | Hành động khắc phục · Nội quy & Vi phạm |

**Tổng quan PDCA** gom cảnh báo của mọi phân hệ thành danh sách *Việc cần xử lý* (đỏ: quá hạn, vi phạm
quy định; vàng: sắp đến hạn), xếp ưu tiên an toàn → pháp lý → quản lý, lọc theo P – D – C – A, bấm để mở
đúng phân hệ; 4 khối Kế hoạch – Thực hiện – Kiểm tra – Cải tiến hiển thị chỉ số chính và mức huấn luyện.
Kế hoạch triển khai 3 tháng: [`docs/KE_HOACH_PDCA.md`](docs/KE_HOACH_PDCA.md).


**1. Chất thải & CTNH** — danh mục chất thải theo mã CTNH (TT 02/2022/TT-BTNMT), nhật ký
phát sinh theo ngày/bộ phận, lập đợt chuyển giao kèm số chứng từ CTNH, tự tính **tồn kho
lưu giữ** (phát sinh − đã giao), quản lý đơn vị thu gom và hạn giấy phép xử lý.

**2. Vận hành & Quan trắc** — nhật ký vận hành HTXLNT/khí thải theo ca (lưu lượng, pH, hóa
chất PAC/Polymer/Chlorine, sự cố – khắc phục), nhập kết quả quan trắc với **preset thông số
QCVN 40:2011/BTNMT cột A và QCVN 19:2009/BTNMT** (ngưỡng sửa được theo hệ số Kq/Kf/Kp/Kv của
GPMT), **tự động tạo cảnh báo khi vượt giới hạn**, biểu đồ xu hướng so với đường giới hạn.

**3. PCCC, An toàn & Sự cố** — bộ checklist kiểm tra hiện trường (PCCC, vệ sinh công nghiệp,
ATLĐ) chấm Đạt/Không đạt/N.A và tính điểm %, sổ thiết bị PCCC với hạn kiểm tra, nhật ký diễn
tập, theo dõi **cam kết BVMT–AT–PCCC và huấn luyện đầu vào của nhà thầu**, ghi nhận sự cố với
nguyên nhân gốc và **hành động khắc phục CAPA** có người phụ trách/hạn/trạng thái, danh mục
hóa chất kèm Phiếu an toàn hóa chất (PATHH).

**4. Hồ sơ & Tuân thủ** — kho hồ sơ pháp lý (GPMT, sổ đăng ký, hợp đồng, báo cáo) với cảnh
báo hết hiệu lực, **lịch tuân thủ có nhắc hạn**: báo cáo công tác BVMT, quan trắc định kỳ,
phí BVMT nước thải… — việc lặp lại (tháng/quý/năm) **tự tạo kỳ tiếp theo khi hoàn thành**.

**5. Nhân sự & Huấn luyện** — danh sách người lao động (mã NV, bộ phận, chức danh, nhóm huấn
luyện ATVSLĐ 1–6 theo NĐ 44/2016/NĐ-CP); **ma trận huấn luyện** trả lời ngay ai *đã / chưa* được
huấn luyện **an toàn – phòng cháy (PCCC & CNCH) – ứng phó sự cố chất thải**, mỗi loại có cột
**Khóa – Ngày – Quyết định**, tô màu còn hạn / sắp hết hạn (≤ 30 ngày) / hết hạn / chưa huấn
luyện; khóa huấn luyện ghi một lần cho cả danh sách học viên (một quyết định); **nhập từ Excel**
(.xlsx, .csv hoặc dán từ Excel, tiêu đề 1 hoặc 2 tầng) và **xuất ma trận ra Excel**. Còn theo dõi
an toàn hóa chất, sơ cứu, đào tạo khác. **Diễn tập theo người**: danh sách tham gia từng đợt diễn tập
(PCCC & CNCH, sự cố chất thải, tràn dầu, hóa chất, sơ cứu) — có mặt / vắng, nhiệm vụ — và ma trận ai đã
tham gia, ngày nào; **hồ sơ HSE cá nhân** (huấn luyện, diễn tập, sức khỏe, vai trò HSE, vi phạm) in được.

**6. Nội quy & Vi phạm** — danh mục nội quy, quy định nội bộ; biên bản vi phạm theo **đơn vị,
cá nhân người lao động, nhà thầu – khách** (gợi ý hình thức xử lý theo lần tái phạm trong 12
tháng); **xếp loại đơn vị hằng tháng A/B/C/D** theo số lần không đạt (thông số vượt, khu vực /
điểm thu gom không đạt, hành vi sai), **hệ số quỹ lương tham khảo** (+1% … −0,2%/lần … −4% khi
ảnh hưởng khu dân cư) và **thi đua quý**; xuất bảng tổng hợp tháng gửi Phòng TC-HC.

**7. ESG · GRI · Khí nhà kính** — chính sách E – S – G và mục tiêu định lượng có tiến độ tự tính;
**kiểm kê KNK** phạm vi 1 – 2 – 3 (than lò hơi – lò sấy, sinh khối, dầu DO, xăng, LPG, môi chất
lạnh, CO₂ bình chữa cháy, điện lưới…) với hệ số IPCC 2006 / EF lưới điện lưu cố định theo từng
dòng, CO₂ sinh khối báo cáo riêng, quy đổi TOE, cường độ trên tấn thành phẩm, so sánh nhiều năm;
**chỉ mục GRI** tự lấy số liệu từ các module (KNK, chất thải, nước thải, huấn luyện, tai nạn, vi
phạm…), đối chiếu 8 nhóm nội dung bắt buộc **TT 96/2020 PL IV**, đánh dấu chuyển đổi **GRI 102 /
GRI 103 (từ kỳ 2027)**; xuất Excel.

**8. Sức khỏe nghề nghiệp** — **quan trắc môi trường lao động** theo đợt: kết quả theo vị trí × yếu tố
(vi khí hậu, ồn, bụi, bụi silic, hơi khí độc, tâm sinh lý), tự đánh giá theo QCVN 24, 26:2016/BYT và
02, 03:2019/BYT (nhiệt độ theo cường độ lao động; **thời gian tiếp xúc ồn cho phép** – 85 dBA/8 giờ,
tăng 3 dBA giảm một nửa; đánh dấu mẫu từ 80% giới hạn), so sánh với đợt trước, **việc phải làm sau đợt
đo** (công khai kết quả, biện pháp kỹ thuật, khám BNN, bồi dưỡng, PTBVCN, hồ sơ vệ sinh lao động) tạo
thẳng vào Lịch tuân thủ; nhập kết quả từ Excel; **khám sức khỏe định kỳ** (12 tháng, nghề NNĐHNH 06
tháng) và **khám phát hiện BNN** theo yếu tố tiếp xúc của từng người, ghi đợt khám cho nhiều người,
phân loại sức khỏe I–V; **bồi dưỡng bằng hiện vật** mức 1–4 (TT 24/2022) với dự toán tháng/năm.

**9. Kế hoạch & lộ trình (P)** — kế hoạch HSE năm theo lĩnh vực (căn cứ, chỉ tiêu, chủ trì, hạn, tiến độ,
tự báo quá hạn; nạp mẫu, sao chép năm trước, xuất Excel); **lộ trình hồ sơ môi trường – HSE 2026–2030**
(ISO 14001, kiểm kê – giảm nhẹ KNK, kiểm toán năng lượng, rà soát GPMT, QCVN 19:2024, QCVN 40:2025);
**lộ trình Net Zero 2050**: phát thải phạm vi 1 + 2 và tỷ lệ năng lượng tái tạo thực tế so với đường mục
tiêu nội suy giữa các mốc, bảng mục tiêu theo năm, các mốc giải pháp có tiến độ.

**10. Tổ chức bộ máy HSE (P)** — nhập tổng số lao động, ngành nghề nặng nhọc – độc hại, số ca → tự tính
số người tối thiểu (NĐ 39/2016: người làm công tác ATVSLĐ, y tế, Hội đồng ATVSLĐ, an toàn – vệ sinh viên;
đội PCCC cơ sở; người quản lý năng lượng khi ≥ 1.000 TOE) và so với phân công thực tế (quyết định, hiệu
lực huấn luyện của từng người); sơ đồ bộ máy theo nhóm vai trò.

**11. Thiết bị & bảo trì (D)** — danh mục thiết bị (yêu cầu nghiêm ngặt theo TT 36/2019, chu kỳ kiểm
định); **biên bản hư hỏng → sửa chữa (Tổ Cơ điện / thuê ngoài, hạn theo mức ưu tiên) → nghiệm thu an toàn
→ đưa vào vận hành hoặc thanh lý**; cảnh báo quá hạn sửa, quá hạn kiểm định; in biên bản; sổ sửa chữa
Excel; thời gian sửa trung bình.

**12. Hóa chất (D)** — vòng đời mua – nhập kho – sử dụng (sản xuất, phòng thí nghiệm, HTXLNT, cơ điện) –
thải bỏ; phân loại theo Luật Hóa chất 69/2025, PATHH, định mức tồn tối thiểu / tối đa, hạn dùng; lưu hóa
đơn, giấy phép bên bán cho nhóm kiểm soát; chặn xuất vượt tồn và nhập hóa chất cấm; trừ tồn tự động theo
nhật ký HTXLNT, liều dùng g/m³, số ngày còn dùng; báo cáo quý MT-HD02-BM01.

**13. EPR & Tuần hoàn (D)** — trách nhiệm tái chế bao bì **F = V × R × Fs** theo từng loại bao (loại trừ
xuất khẩu), hạn kê khai – nộp và trạng thái từng kỳ; **dòng tuần hoàn** nhập theo tháng (bụi thu hồi, hạt
ngoài cỡ, phế phẩm hồi lưu, nước sau xử lý tái sử dụng…); phương pháp xử lý cuối của từng loại chất thải
→ **bảng công bố GRI 306-4 / 306-5** tách nguy hại – không nguy hại; đối chiếu tiêu chí tuần hoàn
QĐ 46/2026/QĐ-TTg.

**14. Kiểm tra định kỳ (C)** — chương trình theo kỳ: **tổng thể HSE 03 tháng/lần, môi trường hằng tuần,
kiểm tra – chạy thử PCCC hằng tuần**, kho hóa chất hằng tuần, VSCN hằng tháng, tự kiểm tra tuân thủ PCCC
và BVMT hằng quý; lịch kỳ (đã kiểm tra / bỏ sót / đến kỳ), chấm checklist, mục không đạt tạo hành động
khắc phục; in phiếu kiểm tra.

**15. Hành động khắc phục (A)** — CAPA tập trung từ sự cố, kiểm tra, thiết bị, QTMTLĐ, đánh giá, khiếu
nại; nguyên nhân gốc, người – hạn, xác nhận hiệu lực; xuất Excel.

**Bộ mẫu nghiệp vụ nhà máy phân bón NPK** (Cài đặt) — nạp 1 lần: 8 chính sách + 11 mục tiêu ESG,
10 nội quy (MT-HD01…07, quy định tuân thủ MT nội bộ…), checklist VSCN hằng tháng 12 khu vực,
**bảng tự kiểm tra tuân thủ 116 mục** theo nghị định xử phạt hiện hành — NĐ 45/2022 (môi trường),
NĐ 106/2025 sửa đổi bởi NĐ 69/2026 (PCCC & CNCH), **NĐ 283/2026 (lao động – ATVSLĐ, thay NĐ 12/2022
từ 10/9/2026)**, Luật Hóa chất 69/2025 — mỗi mục kèm điều – khoản, khung phạt, bằng chứng, gợi ý khắc
phục; nạp lại thì checklist cũ được cập nhật tại chỗ (giữ lịch sử kiểm tra) — và **lịch nghĩa vụ
định kỳ HSE** (24 hạn: báo cáo công tác BVMT 15/01, phí BVMT quý, EPR bao bì theo NĐ 110/2026, kiểm kê
KNK 02 năm/lần theo QĐ 42/2026, báo cáo TNLĐ – ATVSLĐ – y tế lao động, QTMTLĐ, khám sức khỏe, huấn
luyện, thực tập PCCC), **chương trình kiểm tra định kỳ** (7 chương trình kèm checklist) và **kế hoạch &
lộ trình** (kế hoạch năm, lộ trình 2026–2030, Net Zero 2050). Căn cứ pháp lý rà soát **10/2026**.

**Bản dùng thử** — chưa cấu hình Supabase thì ứng dụng tự chạy với dữ liệu mẫu (nhà máy phân bón,
số liệu **minh họa**) lưu trong trình duyệt: `npm install && npm run dev` → *Vào bản dùng thử*.
Khôi phục dữ liệu mẫu tại Cài đặt.

## Kiến trúc & công nghệ

| Lớp | Công nghệ |
|---|---|
| Frontend | React 18 + TypeScript + Vite, Tailwind CSS, TanStack Query, Recharts, lucide-react |
| PWA | vite-plugin-pwa (service worker, cài lên điện thoại, cache tĩnh) |
| Backend | Supabase: PostgreSQL + Auth + **Row Level Security** (không cần server riêng) |
| Đa tổ chức | Mọi bảng có `org_id`; RLS `org_id = current_org_id()`; tự khởi tạo tổ chức khi đăng ký (self-serve) |
| Phân quyền | admin · manager · officer · operator · viewer (viewer chỉ xem) |

```
supabase/
  schema.sql        ← toàn bộ bảng + hàm + RLS (chạy 1 lần)
  migrations/       ← nâng cấp CSDL đã cài (002: nhân sự, ESG – KNK, nội quy; 003: sức khỏe nghề nghiệp;
                       004: PDCA – thiết bị, kiểm tra định kỳ, CAPA, hóa chất, EPR – tuần hoàn, kế hoạch, bộ máy)
  seed.sql          ← dữ liệu mẫu theo bối cảnh nhà máy phân bón (tùy chọn)
src/
  lib/              supabase client, hằng số QCVN & nhãn tiếng Việt, utils;
                    training.ts (hạn huấn luyện), ghg.ts (hệ số KNK), gri.ts (chỉ mục GRI),
                    rules.ts (xếp loại, thi đua), templates.ts (bộ mẫu), demo/ (bản dùng thử);
                    PDCA: plan.ts, org.ts, equipment.ts, chemicals.ts, circular.ts, inspection.ts,
                    inspectionTemplates.ts, capa.ts, drills.ts, print.ts
  contexts/         AuthContext (phiên, hồ sơ, tổ chức, chuyển nhà máy)
  hooks/useCrud.ts  useList / useSave / useRemove (react-query)
  components/       UI primitives + Layout (sidebar desktop, bottom-nav mobile)
  pages/            Login, Onboarding, Dashboard, Settings
  modules/          waste / operations / safety / compliance / personnel / health / rules / esg /
                    plan / org / equipment / chemicals / circular / inspection / actions / drills / dashboard
```

## Triển khai (≈ 15 phút)

**Bước 1 — Tạo dự án Supabase.** Vào [supabase.com](https://supabase.com) → New project.
Lấy `Project URL` và `anon public key` tại **Settings → API**.

**Bước 2 — Tạo CSDL.** Mở **SQL Editor**, dán toàn bộ `supabase/schema.sql`, Run.
*Đã cài bản trước?* Chạy lần lượt các file còn thiếu trong `supabase/migrations/` (chạy lại nhiều lần không lỗi):
`002_nhan_su_esg_noi_quy.sql` (9 bảng Nhân sự – Huấn luyện, ESG – KNK, Nội quy – Vi phạm) và
`003_suc_khoe_nghe_nghiep.sql` (quan trắc môi trường lao động, khám sức khỏe – BNN, hồ sơ sức khỏe nhân sự,
lịch lặp 02 năm/lần) và `004_pdca_thiet_bi_hoa_chat_tuan_hoan.sql` (11 bảng: vai trò HSE, danh sách diễn
tập, thiết bị – kiểm định – phiếu sửa chữa, chương trình kiểm tra, sổ nhập xuất hóa chất, EPR bao bì, dòng
tuần hoàn, kế hoạch – lộ trình; mở rộng CAPA, hóa chất, diễn tập, thông số nhà máy).

**Bước 3 — (Tùy chọn) Dữ liệu mẫu.** Chạy tiếp `supabase/seed.sql` để có tổ chức demo
(danh mục CTNH, hệ thống xử lý, điểm quan trắc, checklist PCCC/VSCN, lịch tuân thủ…).
Sau đó tạo tài khoản tại **Authentication → Users → Add user** (bật *Auto Confirm*), lấy
UUID của user và chạy lệnh gán ở cuối file seed.
*Nếu bỏ qua bước này:* đăng ký trực tiếp từ app — màn hình khởi tạo sẽ tự tạo tổ chức +
nhà máy và gán bạn quyền Quản trị.

**Bước 4 — Cấu hình môi trường.**
```bash
cp .env.example .env    # điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
```

**Bước 5 — Chạy thử.**
```bash
npm install
npm run dev             # http://localhost:5173
```

**Bước 6 — Đưa lên Internet.** Push mã nguồn lên GitHub → import vào **Vercel** hoặc
**Netlify** (framework: Vite, build `npm run build`, output `dist`), khai báo 2 biến môi
trường ở bước 4. Cấu hình SPA đã kèm sẵn (`vercel.json`, `public/_redirects`). Với Vercel,
`vercel.json` ở thư mục gốc repo đã trỏ build vào `ehsviet/`, không cần đổi Root Directory.

**Bước 7 — Cài lên điện thoại.** Mở trang web bằng Chrome/Safari → *Thêm vào màn hình
chính*. Ứng dụng chạy toàn màn hình như app, có icon riêng.

> Lưu ý Auth: trong **Authentication → Providers → Email**, có thể tắt "Confirm email"
> giai đoạn thử nghiệm để đăng ký dùng ngay.

## Thêm thành viên vào tổ chức (v1)

Thành viên tự đăng ký tài khoản; quản trị viên gán họ vào tổ chức bằng SQL Editor:

```sql
-- Nếu user CHƯA bấm "Khởi tạo" trong app:
insert into public.profiles (id, org_id, facility_id, full_name, role)
values ('<UUID-USER>', '<UUID-TỔ-CHỨC>', '<UUID-NHÀ-MÁY>', 'Họ tên', 'officer');

-- Nếu user đã lỡ tự tạo tổ chức riêng:
update public.profiles
set org_id = '<UUID-TỔ-CHỨC>', facility_id = '<UUID-NHÀ-MÁY>', role = 'officer'
where id = '<UUID-USER>';
```

Sau khi gán, đổi vai trò trực tiếp trong app tại **Cài đặt → Thành viên** (quyền admin).
Luồng mời tự động qua email nằm trong lộ trình (Edge Function + service key).

## Nhập nhân sự & huấn luyện từ Excel

Một dòng một người. Cột được nhận tự động (có dấu / không dấu, hoa / thường):

| Nhóm | Tiêu đề cột chấp nhận (ví dụ) |
|---|---|
| Nhân sự | `Mã NV` · `Họ và tên` (bắt buộc) · `Giới tính` · `Bộ phận` · `Chức danh` · `Nhóm` (1–6) · `Ngày vào làm` |
| Huấn luyện (mỗi loại) | `ATVSLĐ` / `PCCC` / `Sự cố chất thải` (cả `An toàn hóa chất`, `Sơ cứu`) + `Khóa`, `Ngày`, `Quyết định` (tùy chọn `Ngày QĐ`, `Số chứng nhận`, `Hạn`) |

Tiêu đề 2 tầng (ô gộp "ATVSLĐ" phía trên "Khóa | Ngày | QĐ") hoặc 1 tầng ("ATVSLĐ - Ngày") đều
được; ngày dạng `dd/mm/yyyy` hoặc ô ngày của Excel. Người đã có được nhận theo **Mã NV** (không có
mã thì theo họ tên duy nhất); khóa trùng *loại – tên – ngày – số QĐ* được gộp làm một khóa. Có
**file mẫu** tải trong thẻ *Nhập từ Excel*; file *Xuất Excel* của ma trận nhập lại được.

## Bảo mật

- RLS bật trên **mọi bảng**; mọi truy vấn từ client chỉ thấy dữ liệu `org_id` của mình.
- `anon key` an toàn để nhúng phía client; **tuyệt đối không** đưa `service_role key` vào
  frontend.
- Hàm `current_org_id()` / `is_admin()` dạng `security definer` cố định `search_path`.
- Các bảng thêm từ migration 002 – 004 (nhân sự, huấn luyện, ESG, KNK, nội quy, sức khỏe, thiết bị,
  kiểm tra, hóa chất, EPR, kế hoạch…) chặn ghi ở tầng CSDL với vai trò **Chỉ xem** (`can_write()`),
  không chỉ ẩn nút trên giao diện. Đã kiểm thử RLS 11 bảng của 004 trên PostgreSQL 16 (118/118 ca):
  cùng tổ chức đọc – ghi đúng quyền; tổ chức khác không đọc, không sửa, không chèn dữ liệu mang
  `org_id` của tổ chức khác; không chuyển bản ghi sang tổ chức khác; khách ẩn danh không thấy gì.
- Dữ liệu cá nhân tối thiểu: chỉ lưu thông tin cần cho quản lý an toàn (không CCCD, địa chỉ…).

## Ghi chú nghiệp vụ

- **Chu kỳ huấn luyện mặc định** (sửa được theo từng khóa / nhập "Hạn" trên chứng nhận):
  ATVSLĐ nhóm 4 – 12 tháng, nhóm 1, 2, 3, 5, 6 – 24 tháng (NĐ 44/2016/NĐ-CP); PCCC & CNCH,
  ứng phó sự cố chất thải, an toàn hóa chất, sơ cứu – 12 tháng (bồi dưỡng / tập huấn lại hằng
  năm). Đối chiếu văn bản hiện hành trước khi dùng làm căn cứ chính thức.
- **Kiểm kê KNK**: phát thải = số liệu hoạt động × hệ số (CO₂ + CH₄ × 27 + N₂O × 273, GWP IPCC
  AR6); nhiên liệu theo IPCC 2006 (than NCV 26,7 GJ/t; DO ρ 0,83, 43 TJ/Gg; xe nâng theo hệ số
  di động ngoài đường bộ); điện lưới dùng EF công bố gần nhất trước năm kiểm kê (0,6766 – năm 2022;
  0,6592 – năm 2023; giá trị 2024 mới ở dạng nghiên cứu, chưa dùng). Hệ số lưu theo từng dòng nên đổi
  hệ số mẫu (`src/lib/ghg.ts`) không làm đổi số đã kiểm kê. Cường độ ghi rõ mẫu số là **tấn thành
  phẩm**. Nghĩa vụ: NĐ 06/2022 sửa đổi bởi NĐ 119/2025, NĐ 83/2026; danh mục QĐ 42/2026/QĐ-TTg; báo
  cáo kiểm kê 02 năm/lần trước 31/3 (kỳ tới: số liệu 2025–2026, trước 31/3/2027).
- **Xử lý vi phạm**: hệ số % quỹ lương chỉ là căn cứ đánh giá **tập thể đơn vị** trong Quy chế
  trả lương, thưởng; không phạt tiền, cắt lương người lao động (BLLĐ 2019 Điều 127) — cá nhân xử
  lý kỷ luật theo Nội quy lao động (Điều 124); nhà thầu theo điều khoản hợp đồng. Phạt tiền, cắt
  lương thay xử lý kỷ luật bị xử phạt theo NĐ 283/2026/NĐ-CP Điều 25 k3.
- **Sức khỏe nghề nghiệp**: giới hạn mặc định khi nhập/nhập Excel — nhiệt độ theo cường độ lao động
  (QCVN 26:2016/BYT: nhẹ 20–34, vừa 18–32, nặng 16–30 °C), ồn 85 dBA (QCVN 24:2016/BYT), NH₃ 17,
  CO 20, SO₂ 5, NO₂ 5 mg/m³ (TWA, QCVN 03:2019/BYT); giới hạn bụi chứa silic phụ thuộc hàm lượng SiO₂ —
  nhập theo phiếu kết quả. Khám sức khỏe 12 tháng/lần, nghề NNĐHNH 06 tháng/lần; khám BNN hằng năm
  theo yếu tố tiếp xúc; bồi dưỡng hiện vật 13.000 – 20.000 – 26.000 – 32.000 đ/ngày (TT 24/2022).
- **Căn cứ pháp lý** của checklist, lịch nghĩa vụ, ghi chú trong ứng dụng rà soát **10/2026**: Luật
  BVMT sửa đổi đến Luật 146/2025; NĐ 08/2022 sửa bởi NĐ 05/2025, NĐ 48/2026; TT 02/2022 (VBHN
  55/VBHN-BNNMT); NĐ 45/2022 (còn hiệu lực, có dự thảo thay thế); QCVN 19:2024, 40:2025 theo lộ trình;
  NĐ 106/2025 sửa bởi NĐ 69/2026; NĐ 283/2026; Luật Hóa chất 69/2025; EPR theo NĐ 110/2026.
- **Bộ mẫu** (chính sách, nội quy, checklist) là dự thảo — rà soát, ban hành theo thẩm quyền.
- **Kiểm tra PCCC "1 tuần/lần"**: không có văn bản quy định tần suất 1 tuần/lần cho toàn hệ thống; Luật
  PCCC & CNCH 2024, NĐ 105/2025 yêu cầu tự kiểm tra, bảo dưỡng phương tiện; tần suất kỹ thuật theo
  TCVN 3890:2023 và hướng dẫn nhà sản xuất. Mặc định của phần mềm (sửa được): kiểm tra – chạy thử
  hằng tuần, tự kiểm tra tuân thủ hằng quý, thực tập phương án chữa cháy ít nhất 01 lần/năm.
- **Bộ máy HSE**: số người tối thiểu theo NĐ 39/2016 (Điều 36, 37, 38) và quy mô lao động, ngành nghề;
  môi trường và PCCC không có định mức chuyên trách — phần mềm theo dõi người được phân công và hiệu
  lực huấn luyện.
- **GRI 306**: bụi, hạt ngoài cỡ, phế phẩm hồi lưu trong công nghệ là vật liệu chưa bị thải bỏ nên không
  cộng vào 306-4; 306-4/306-5 tính từ khối lượng phát sinh × phương pháp xử lý cuối của từng loại chất thải
  (đối chiếu chứng từ chuyển giao trước khi công bố).
- **Tiêu chí tuần hoàn QĐ 46/2026**: nhà máy NPK phối trộn – tạo hạt có tiêu hao nguyên liệu/tấn sát cân
  bằng vật chất; chỉ tiêu giảm ≥ 10% thường cần thay đổi công thức, nguyên liệu, công nghệ.
- **Net Zero**: đường mục tiêu là tham chiếu; chỉ công bố "trung hòa carbon", "Net Zero" khi có kiểm kê
  được thẩm định và bù trừ bằng tín chỉ hợp lệ.

- Ngưỡng preset là **giá trị C cơ sở** của QCVN — khi nhập kết quả hãy điều chỉnh theo hệ số
  Kq, Kf (nước thải) hoặc Kp, Kv (khí thải) quy định tại GPMT của cơ sở.
- Hạn nộp trong lịch nghĩa vụ mẫu (`src/lib/obligations.ts`) theo văn bản rà soát 10/2026 —
  **đối chiếu văn bản hợp nhất mới nhất** trước khi nộp, tần suất quan trắc luôn theo GPMT;
  chỉnh trực tiếp trong *Lịch tuân thủ*.
- Trường "Liên kết file" nhận URL Google Drive/Supabase Storage; upload trực tiếp nằm trong
  lộ trình.

## Lộ trình phát triển (gợi ý bán hàng theo gói)

1. **Offline thực địa**: hàng đợi IndexedDB + đồng bộ nền cho checklist/nhật ký khi mất sóng.
2. **Nhắc hạn chủ động**: Supabase Edge Function + cron gửi email/Zalo OA trước hạn `remind_days`.
3. **Upload hồ sơ**: bucket Storage riêng theo tổ chức, ký URL có hạn.
4. **Mời thành viên tự động** + SSO Google Workspace.
5. **Xuất báo cáo** DOCX/PDF theo mẫu phụ lục TT 02/2022 từ dữ liệu đã nhập.
6. **Kết nối quan trắc tự động (CEMS)** đổ dữ liệu vào `monitoring_results` qua API.
7. **Thanh toán gói** (VNPay/Stripe) gắn với cột `organizations.plan`.
8. Tách dữ liệu mẫu khỏi gói chính (chỉ tải ở bản dùng thử). Đã tách gói theo trang: gói chính
   ~216 KB gzip, biểu đồ tải riêng khi mở trang có biểu đồ.

## Lệnh

```bash
npm run dev        # phát triển
npm run typecheck  # kiểm tra TypeScript
npm run build      # build production (đã kiểm chứng: tsc + vite + PWA OK)
npm run preview    # xem thử bản build
```
