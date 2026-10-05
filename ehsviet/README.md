# EHSViet — Nền tảng SaaS quản lý Môi trường · PCCC · An toàn

Phần mềm quản lý EHS (Environment – Health/Fire – Safety) cho nhà máy Việt Nam, thiết kế theo
mô hình **SaaS đa tổ chức, đa nhà máy**: mỗi công ty là một tổ chức độc lập, dữ liệu cách ly
hoàn toàn bằng Row Level Security. Ứng dụng là **PWA** — một mã nguồn chạy trên web và cài
được lên màn hình chính điện thoại như app.

> Tên "EHSViet" là tên làm việc — đổi thương hiệu tự do (logo tại `public/favicon.svg`,
> `public/pwa-*.png`, tên trong `vite.config.ts` và `index.html`).

## Tính năng (4 module)

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

**Tổng quan** — bảng trạng thái tuân thủ (quan trắc, hạn việc, tồn CTNH, sự cố mở, thiết bị
PCCC) + biểu đồ CTNH phát sinh 6 tháng.

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
  seed.sql          ← dữ liệu mẫu theo bối cảnh nhà máy phân bón (tùy chọn)
src/
  lib/              supabase client, hằng số QCVN & nhãn tiếng Việt, utils
  contexts/         AuthContext (phiên, hồ sơ, tổ chức, chuyển nhà máy)
  hooks/useCrud.ts  useList / useSave / useRemove (react-query)
  components/       UI primitives + Layout (sidebar desktop, bottom-nav mobile)
  pages/            Login, Onboarding, Dashboard, Settings
  modules/          waste / operations / safety / compliance
```

## Triển khai (≈ 15 phút)

**Bước 1 — Tạo dự án Supabase.** Vào [supabase.com](https://supabase.com) → New project.
Lấy `Project URL` và `anon public key` tại **Settings → API**.

**Bước 2 — Tạo CSDL.** Mở **SQL Editor**, dán toàn bộ `supabase/schema.sql`, Run.

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
trường ở bước 4. Cấu hình SPA đã kèm sẵn (`vercel.json`, `public/_redirects`).

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

## Bảo mật

- RLS bật trên **mọi bảng**; mọi truy vấn từ client chỉ thấy dữ liệu `org_id` của mình.
- `anon key` an toàn để nhúng phía client; **tuyệt đối không** đưa `service_role key` vào
  frontend.
- Hàm `current_org_id()` / `is_admin()` dạng `security definer` cố định `search_path`.

## Ghi chú nghiệp vụ

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
