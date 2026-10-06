# EHSViet — Nền tảng SaaS quản lý Môi trường · An toàn · ESG

Phần mềm quản lý EHS (Environment – Health/Fire – Safety) cho nhà máy Việt Nam, thiết kế theo
mô hình **SaaS đa tổ chức, đa nhà máy**: mỗi công ty là một tổ chức độc lập, dữ liệu cách ly
hoàn toàn bằng Row Level Security. Ứng dụng là **PWA** — một mã nguồn chạy trên web và cài
được lên màn hình chính điện thoại như app.

> Tên "EHSViet" là tên làm việc — đổi thương hiệu tự do (logo tại `public/favicon.svg`,
> `public/pwa-*.png`, tên trong `vite.config.ts` và `index.html`).

## Tính năng (7 module)

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
an toàn hóa chất, sơ cứu, đào tạo khác.

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

**Bộ mẫu nghiệp vụ nhà máy phân bón NPK** (Cài đặt) — nạp 1 lần: 8 chính sách + 11 mục tiêu ESG,
10 nội quy (MT-HD01…07, quy định tuân thủ MT nội bộ…), checklist VSCN hằng tháng 12 khu vực và
**bảng tự kiểm tra tuân thủ 73 mục** theo NĐ 45/2022 (môi trường), NĐ 106/2025 (PCCC & CNCH),
NĐ 12/2022 (ATVSLĐ), hóa chất — mỗi mục kèm căn cứ, khung xử phạt, bằng chứng, gợi ý khắc phục.

**Tổng quan** — bảng trạng thái tuân thủ (quan trắc, hạn việc, tồn CTNH, sự cố mở, thiết bị
PCCC, **huấn luyện, vi phạm nội quy, KNK năm**), tiến độ huấn luyện 3 loại, xếp loại đơn vị tháng,
biểu đồ CTNH phát sinh 6 tháng.

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
  migrations/       ← nâng cấp CSDL đã cài (002: nhân sự, ESG – KNK, nội quy)
  seed.sql          ← dữ liệu mẫu theo bối cảnh nhà máy phân bón (tùy chọn)
src/
  lib/              supabase client, hằng số QCVN & nhãn tiếng Việt, utils;
                    training.ts (hạn huấn luyện), ghg.ts (hệ số KNK), gri.ts (chỉ mục GRI),
                    rules.ts (xếp loại, thi đua), templates.ts (bộ mẫu), demo/ (bản dùng thử)
  contexts/         AuthContext (phiên, hồ sơ, tổ chức, chuyển nhà máy)
  hooks/useCrud.ts  useList / useSave / useRemove (react-query)
  components/       UI primitives + Layout (sidebar desktop, bottom-nav mobile)
  pages/            Login, Onboarding, Dashboard, Settings
  modules/          waste / operations / safety / compliance / personnel / rules / esg
```

## Triển khai (≈ 15 phút)

**Bước 1 — Tạo dự án Supabase.** Vào [supabase.com](https://supabase.com) → New project.
Lấy `Project URL` và `anon public key` tại **Settings → API**.

**Bước 2 — Tạo CSDL.** Mở **SQL Editor**, dán toàn bộ `supabase/schema.sql`, Run.
*Đã cài bản trước (chỉ 4 module)?* Chạy thêm `supabase/migrations/002_nhan_su_esg_noi_quy.sql`
(thêm 9 bảng Nhân sự – Huấn luyện, ESG – KNK, Nội quy – Vi phạm; chạy lại nhiều lần không lỗi).

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
- 9 bảng mới (nhân sự, huấn luyện, ESG, KNK, nội quy, vi phạm) chặn ghi ở tầng CSDL với vai trò
  **Chỉ xem** (`can_write()`), không chỉ ẩn nút trên giao diện.
- Dữ liệu cá nhân tối thiểu: chỉ lưu thông tin cần cho quản lý an toàn (không CCCD, địa chỉ…).

## Ghi chú nghiệp vụ

- **Chu kỳ huấn luyện mặc định** (sửa được theo từng khóa / nhập "Hạn" trên chứng nhận):
  ATVSLĐ nhóm 4 – 12 tháng, nhóm 1, 2, 3, 5, 6 – 24 tháng (NĐ 44/2016/NĐ-CP); PCCC & CNCH,
  ứng phó sự cố chất thải, an toàn hóa chất, sơ cứu – 12 tháng (bồi dưỡng / tập huấn lại hằng
  năm). Đối chiếu văn bản hiện hành trước khi dùng làm căn cứ chính thức.
- **Kiểm kê KNK**: phát thải = số liệu hoạt động × hệ số (CO₂ + CH₄ × 27 + N₂O × 273, GWP IPCC
  AR6); nhiên liệu theo IPCC 2006 (than NCV 26,7 GJ/t; DO ρ 0,83, 43 TJ/Gg; xe nâng theo hệ số
  di động ngoài đường bộ); điện lưới dùng EF công bố gần nhất trước năm kiểm kê (0,6766 – năm 2022;
  0,6592 – năm 2023). Hệ số lưu theo từng dòng nên đổi hệ số mẫu (`src/lib/ghg.ts`) không làm đổi
  số đã kiểm kê. Cường độ ghi rõ mẫu số là **tấn thành phẩm**.
- **Xử lý vi phạm**: hệ số % quỹ lương chỉ là căn cứ đánh giá **tập thể đơn vị** trong Quy chế
  trả lương, thưởng; không phạt tiền, cắt lương người lao động (BLLĐ 2019 Điều 127) — cá nhân xử
  lý kỷ luật theo Nội quy lao động (Điều 124); nhà thầu theo điều khoản hợp đồng.
- **Bộ mẫu** (chính sách, nội quy, checklist) là dự thảo — rà soát, ban hành theo thẩm quyền.

- Ngưỡng preset là **giá trị C cơ sở** của QCVN — khi nhập kết quả hãy điều chỉnh theo hệ số
  Kq, Kf (nước thải) hoặc Kp, Kv (khí thải) quy định tại GPMT của cơ sở.
- Thời hạn nộp báo cáo/phí trong seed chỉ là gợi ý — **đối chiếu văn bản hiện hành**
  (TT 02/2022/TT-BTNMT và các văn bản sửa đổi, NĐ 53/2020/NĐ-CP…) rồi chỉnh trong
  *Lịch tuân thủ*.
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
8. Tối ưu bundle: `manualChunks` tách recharts/supabase (hiện ~264 KB gzip).

## Lệnh

```bash
npm run dev        # phát triển
npm run typecheck  # kiểm tra TypeScript
npm run build      # build production (đã kiểm chứng: tsc + vite + PWA OK)
npm run preview    # xem thử bản build
```
