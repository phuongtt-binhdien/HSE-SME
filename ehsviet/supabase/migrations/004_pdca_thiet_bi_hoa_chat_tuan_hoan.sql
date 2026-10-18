-- ============================================================
-- EHSViet — Migration 004
-- Vận hành theo PDCA: kế hoạch HSE năm – lộ trình 5 năm – Net Zero 2050 (P); tổ chức bộ máy HSE (P);
-- diễn tập theo từng người, thiết bị – sửa chữa – kiểm định, hóa chất nhập – xuất – tồn,
-- EPR bao bì, dòng tuần hoàn (D); chương trình kiểm tra định kỳ (C); hành động khắc phục tập trung (A).
--
-- Chạy sau 003: mở Supabase > SQL Editor, dán toàn bộ file này và Run. Chạy lại nhiều lần không lỗi.
-- Cài mới: chỉ cần schema.sql (đã gồm toàn bộ nội dung dưới đây).
-- ============================================================

-- ---------- Thông số cơ sở dùng để tính bộ máy HSE ----------
-- headcount: tổng số lao động thực tế của cơ sở (gồm cả người chưa nhập vào phần mềm); trống = đếm nhân sự đang làm việc
-- hazardous_sector: ngành nghề thuộc điểm a k1 Điều 36 NĐ 39/2016/NĐ-CP (sản xuất hóa chất – phân bón, khai khoáng, xây dựng…)
-- shifts: số ca làm việc (mỗi ca cần tổ PCCC cơ sở)
alter table public.facilities add column if not exists headcount int;
alter table public.facilities add column if not exists hazardous_sector boolean not null default false;
alter table public.facilities add column if not exists shifts smallint;
alter table public.facilities drop constraint if exists facilities_headcount_check;
alter table public.facilities add constraint facilities_headcount_check check (headcount >= 0);
alter table public.facilities drop constraint if exists facilities_shifts_check;
alter table public.facilities add constraint facilities_shifts_check check (shifts between 1 and 4);

-- ---------- Tổ chức bộ máy HSE: phân công vai trò ----------
create table if not exists public.hse_roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  role text not null check (role in (
    'atvsld_chuyen_trach','atvsld_ban_chuyen_trach','y_te','hoi_dong_atvsld','atvsv',
    'moi_truong','van_hanh_xlmt','pccc_chi_huy','pccc_doi_vien','so_cuu','ung_pho_su_co',
    'hoa_chat','nang_luong')),
  decision_no text,          -- quyết định phân công / thành lập
  decision_date date,
  start_date date,
  end_date date,             -- trống = đang đảm nhiệm
  qualification text,        -- trình độ, chứng chỉ (trung cấp y, chứng chỉ quản lý năng lượng…)
  note text,
  created_at timestamptz not null default now()
);

-- ---------- Diễn tập: kế hoạch, kết quả và danh sách người tham gia ----------
alter table public.drills add column if not exists plan_no text;     -- số kế hoạch / phương án
alter table public.drills add column if not exists location text;
alter table public.drills add column if not exists status text not null default 'done';
alter table public.drills add column if not exists result text;
alter table public.drills drop constraint if exists drills_status_check;
alter table public.drills add constraint drills_status_check check (status in ('planned','done'));
alter table public.drills drop constraint if exists drills_result_check;
alter table public.drills add constraint drills_result_check check (result in ('dat','chua_dat'));
alter table public.drills drop constraint if exists drills_kind_check;
alter table public.drills add constraint drills_kind_check
  check (kind in ('PCCC','su_co_hoa_chat','su_co_moi_truong','tran_dau','cap_cuu_TNLD'));

create table if not exists public.drill_participants (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  drill_id uuid not null references public.drills(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  attended boolean not null default true,   -- false = có tên trong kế hoạch nhưng vắng
  role text,                 -- nhiệm vụ: chỉ huy, chữa cháy, cứu nạn, sơ cứu, hậu cần, quan sát
  note text,
  created_at timestamptz not null default now(),
  unique (drill_id, employee_id)
);

-- ---------- Thiết bị ----------
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  code text,                 -- mã thiết bị
  name text not null,
  category text not null default 'san_xuat' check (category in (
    'san_xuat','moi_truong','ap_luc','dien','nang_ha','phuong_tien','pccc','phong_thi_nghiem','khac')),
  strict_safety boolean not null default false, -- có yêu cầu nghiêm ngặt về ATVSLĐ (TT 36/2019/TT-BLĐTBXH) → kiểm định
  department text,           -- bộ phận quản lý, sử dụng
  location text,
  manufacturer text,
  model text,
  serial_no text,
  year_made int,
  commissioned_date date,    -- ngày đưa vào sử dụng
  inspection_cycle_months int check (inspection_cycle_months > 0), -- chu kỳ kiểm định / kiểm tra định kỳ
  last_inspection date,
  next_inspection date,      -- hạn kiểm định ghi trên giấy chứng nhận
  inspection_org text,       -- tổ chức kiểm định
  maintainer text not null default 'to_co_dien' check (maintainer in ('to_co_dien','thue_ngoai')),
  status text not null default 'van_hanh' check (status in ('van_hanh','hu_hong','sua_chua','cho_nghiem_thu','ngung','thanh_ly')),
  note text,
  created_at timestamptz not null default now()
);

-- Kiểm định, bảo dưỡng, kiểm tra định kỳ
create table if not exists public.equipment_inspections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  inspection_date date not null,
  kind text not null default 'kiem_dinh' check (kind in ('kiem_dinh','bao_duong','kiem_tra')),
  organization text,         -- tổ chức kiểm định / đơn vị bảo dưỡng
  certificate_no text,       -- số giấy chứng nhận kết quả kiểm định / biên bản
  result text not null default 'dat' check (result in ('dat','khong_dat')),
  next_due date,
  note text,
  created_at timestamptz not null default now()
);

-- Biên bản hư hỏng → sửa chữa → nghiệm thu → đưa vào vận hành / thanh lý
create table if not exists public.equipment_work_orders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  report_no text,            -- số biên bản hư hỏng
  report_date date not null default current_date,
  reported_by text,
  description text not null, -- hiện tượng hư hỏng
  cause text,
  priority text not null default 'trung_binh' check (priority in ('khan_cap','cao','trung_binh','thap')),
  env_impact boolean not null default false,    -- ảnh hưởng công trình BVMT, phát thải
  safety_impact boolean not null default false, -- nguy cơ mất an toàn
  assignee text not null default 'to_co_dien' check (assignee in ('to_co_dien','thue_ngoai')),
  contractor_name text,      -- đơn vị thuê ngoài
  due_date date,             -- hạn hoàn thành sửa chữa
  repair_start_date date,
  repair_done_date date,     -- ngày hoàn thành sửa chữa
  repair_content text,       -- nội dung sửa chữa, vật tư thay thế
  cost numeric check (cost >= 0),
  acceptance_date date,      -- ngày nghiệm thu
  acceptance_no text,        -- số biên bản nghiệm thu
  safety_result text check (safety_result in ('dat','khong_dat')), -- kiểm tra an toàn khi nghiệm thu
  outcome text check (outcome in ('van_hanh','thanh_ly')),          -- đưa vào vận hành / thanh lý
  outcome_date date,
  outcome_no text,           -- số lệnh đưa vào vận hành / quyết định, biên bản thanh lý
  status text not null default 'moi' check (status in ('moi','dang_sua','cho_nghiem_thu','hoan_thanh','thanh_ly','huy')),
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- Chương trình kiểm tra định kỳ ----------
alter table public.checklist_templates drop constraint if exists checklist_templates_category_check;
alter table public.checklist_templates add constraint checklist_templates_category_check
  check (category in ('PCCC','VSCN','ATLD','MT','HC','TB','HSE'));
alter table public.checklist_templates drop constraint if exists checklist_templates_frequency_check;
alter table public.checklist_templates add constraint checklist_templates_frequency_check
  check (frequency in ('daily','weekly','monthly','quarterly','semiannual','yearly'));

create table if not exists public.inspection_plans (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  name text not null,
  scope text not null default 'tong_the' check (scope in ('tong_the','moi_truong','atvsld','pccc','hoa_chat','vscn','thiet_bi')),
  frequency text not null default 'weekly' check (frequency in ('daily','weekly','monthly','quarterly','semiannual','yearly')),
  template_id uuid references public.checklist_templates(id) on delete set null,
  team text,                 -- thành phần đoàn kiểm tra
  owner text,                -- đơn vị chủ trì
  basis text,                -- căn cứ: quy định nội bộ, văn bản pháp luật
  start_date date not null default current_date,
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);

alter table public.checklist_runs add column if not exists plan_id uuid references public.inspection_plans(id) on delete set null;
alter table public.checklist_runs add column if not exists period text; -- kỳ: 2026-W42 · 2026-10 · 2026-Q4 · 2026-H2 · 2026 · 2026-10-18

-- ---------- Hành động khắc phục – phòng ngừa (CAPA) dùng chung cho mọi nguồn ----------
alter table public.capa_actions alter column incident_id drop not null;
alter table public.capa_actions add column if not exists facility_id uuid references public.facilities(id) on delete cascade;
alter table public.capa_actions add column if not exists source text not null default 'su_co';
alter table public.capa_actions add column if not exists source_ref uuid;    -- id bản ghi nguồn (lượt kiểm tra, phiếu sửa chữa…)
alter table public.capa_actions add column if not exists source_label text;  -- mô tả nguồn hiển thị
alter table public.capa_actions add column if not exists kind text not null default 'khac_phuc';
alter table public.capa_actions add column if not exists department text;    -- đơn vị thực hiện
alter table public.capa_actions add column if not exists root_cause text;
alter table public.capa_actions add column if not exists verified_date date; -- ngày kiểm tra xác nhận hiệu lực
alter table public.capa_actions add column if not exists verified_by text;
alter table public.capa_actions add column if not exists effective boolean;  -- hành động có hiệu lực
alter table public.capa_actions add column if not exists note text;
alter table public.capa_actions drop constraint if exists capa_actions_source_check;
alter table public.capa_actions add constraint capa_actions_source_check
  check (source in ('su_co','kiem_tra','thiet_bi','qtmtld','danh_gia','vi_pham','khieu_nai','khac'));
alter table public.capa_actions drop constraint if exists capa_actions_kind_check;
alter table public.capa_actions add constraint capa_actions_kind_check check (kind in ('khac_phuc','phong_ngua','cai_tien'));
update public.capa_actions c set facility_id = i.facility_id
  from public.incidents i where c.incident_id = i.id and c.facility_id is null;

-- ---------- Hóa chất: phân loại, khu sử dụng, định mức; sổ nhập – xuất ----------
alter table public.chemicals add column if not exists code text;
alter table public.chemicals add column if not exists formula text;          -- công thức / thành phần chính
alter table public.chemicals add column if not exists hazard_classes text[] not null default '{}'; -- an_mon, doc, doc_man, oxi_hoa, de_chay, kich_ung, moi_truong, ap_suat
alter table public.chemicals add column if not exists legal_group text not null default 'thong_thuong';
alter table public.chemicals add column if not exists use_area text not null default 'san_xuat';
alter table public.chemicals add column if not exists min_stock numeric;      -- tồn tối thiểu → đặt mua
alter table public.chemicals add column if not exists max_stock numeric;      -- lượng tồn trữ tối đa tại khu vực
alter table public.chemicals add column if not exists sds_date date;          -- ngày ban hành / cập nhật PATHH
alter table public.chemicals add column if not exists expiry_date date;       -- hạn sử dụng (thuốc thử PTN)
alter table public.chemicals add column if not exists log_key text;           -- tên trong nhật ký vận hành HTXLNT (PAC, Polymer…) → tự trừ tồn
alter table public.chemicals add column if not exists active boolean not null default true;
alter table public.chemicals drop constraint if exists chemicals_legal_group_check;
alter table public.chemicals add constraint chemicals_legal_group_check
  check (legal_group in ('thong_thuong','nguy_hiem','co_dieu_kien','kiem_soat_dac_biet','tien_chat','cam'));
alter table public.chemicals drop constraint if exists chemicals_use_area_check;
alter table public.chemicals add constraint chemicals_use_area_check
  check (use_area in ('san_xuat','phong_thi_nghiem','htxlnt','co_dien','kho','khac'));
alter table public.chemicals drop constraint if exists chemicals_stock_check;
alter table public.chemicals add constraint chemicals_stock_check check (min_stock >= 0 and max_stock >= 0);

create table if not exists public.chemical_transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  chemical_id uuid not null references public.chemicals(id) on delete cascade,
  txn_date date not null default current_date,
  kind text not null default 'xuat' check (kind in ('nhap','xuat','dieu_chinh','thai_bo')),
  quantity numeric not null, -- theo đơn vị của hóa chất; 'dieu_chinh' được âm (kiểm kê)
  area text check (area in ('san_xuat','phong_thi_nghiem','htxlnt','co_dien','kho','khac')), -- nơi sử dụng
  purpose text,              -- mục đích: phân tích COD, chỉnh pH, khử trùng…
  supplier text,             -- bên bán (nhập)
  supplier_license text,     -- giấy chứng nhận đủ điều kiện / giấy phép của bên bán
  invoice_no text,           -- hóa đơn, chứng từ
  batch_no text,
  person text,               -- người giao / nhận
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint chemical_transactions_quantity_check check (kind = 'dieu_chinh' or quantity > 0)
);

-- ---------- EPR: trách nhiệm tái chế bao bì ----------
create table if not exists public.packaging_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  year int not null check (year between 2000 and 2100), -- năm phát sinh số liệu
  packaging text not null,   -- loại bao bì: bao PP dệt 50 kg lót PE…
  material_group text,       -- nhóm trong danh mục EPR: bao bì nhựa mềm đơn vật liệu…
  units_domestic numeric check (units_domestic >= 0), -- số bao đưa ra thị trường trong nước
  units_export numeric check (units_export >= 0),     -- số bao xuất khẩu (loại trừ)
  unit_weight_kg numeric check (unit_weight_kg >= 0), -- khối lượng 01 bao (cân mẫu)
  recycling_rate numeric check (recycling_rate between 0 and 100), -- tỷ lệ tái chế bắt buộc R (%)
  fs_vnd_per_kg numeric check (fs_vnd_per_kg >= 0),   -- định mức chi phí tái chế Fs
  method text not null default 'dong_quy' check (method in ('dong_quy','tu_tai_che','uy_quyen')),
  recycled_kg numeric check (recycled_kg >= 0),       -- khối lượng đã tái chế (tự thực hiện / ủy quyền, có chứng từ)
  declared_date date,        -- ngày kê khai
  paid_date date,            -- ngày nộp Quỹ BVMT Việt Nam
  paid_amount numeric check (paid_amount >= 0),
  note text,
  created_at timestamptz not null default now()
);

-- ---------- Kinh tế tuần hoàn: dòng vật chất được tái sử dụng, tái chế ----------
create table if not exists public.circular_flows (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  year int not null check (year between 2000 and 2100),
  month int check (month between 1 and 12),
  stream text not null check (stream in (
    'bui_hoi_luu','hat_ngoai_co','phe_pham','nuoc_tuan_hoan','nuoc_mua','bao_bi_tai_su_dung',
    'xi_than','bun_htxlnt','dau_thai','khac')),
  quantity numeric not null check (quantity >= 0),
  unit text not null default 't',
  route text not null default 'tai_su_dung_tai_cho'
    check (route in ('tai_su_dung_tai_cho','tai_che_ben_ngoai','dong_xu_ly','thu_hoi_nang_luong')),
  destination text,          -- công đoạn tái sử dụng / đơn vị tiếp nhận
  note text,
  created_at timestamptz not null default now()
);

-- Phương pháp xử lý cuối của từng loại chất thải → GRI 306-4 (chuyển hướng) / 306-5 (thải bỏ)
alter table public.waste_types add column if not exists treatment_method text;
alter table public.waste_types drop constraint if exists waste_types_treatment_method_check;
alter table public.waste_types add constraint waste_types_treatment_method_check
  check (treatment_method in ('tai_che','tai_su_dung','dong_xu_ly','thu_hoi_nang_luong','dot','chon_lap','xu_ly_khac'));

-- ---------- Kế hoạch HSE năm, lộ trình 5 năm, Net Zero 2050 ----------
create table if not exists public.hse_plan_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  horizon text not null default 'nam' check (horizon in ('nam','5_nam','net_zero')),
  year int not null check (year between 2000 and 2100), -- năm kế hoạch / năm mốc
  area text not null default 'moi_truong' check (area in (
    'moi_truong','atvsld','pccc','hoa_chat','suc_khoe','nang_luong_knk','chat_thai_tuan_hoan','esg','khac')),
  title text not null,
  description text,
  basis text,                -- căn cứ pháp lý / yêu cầu
  kpi text,                  -- chỉ tiêu đo lường
  target_value numeric,
  actual_value numeric,
  unit text,
  owner text,                -- đơn vị, người chủ trì
  start_date date,
  due_date date,
  budget_mvnd numeric check (budget_mvnd >= 0), -- kinh phí dự kiến (triệu đồng)
  status text not null default 'ke_hoach' check (status in ('ke_hoach','dang_thuc_hien','hoan_thanh','cham','huy')),
  progress int not null default 0 check (progress between 0 and 100),
  note text,
  created_at timestamptz not null default now()
);

-- Mục tiêu theo năm của lộ trình (đường giảm phát thải, tỷ lệ năng lượng tái tạo…)
create table if not exists public.roadmap_targets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  metric text not null check (metric in ('ghg_total','ghg_intensity','renewable_pct','waste_diverted_pct','water_reuse_pct')),
  year int not null check (year between 2000 and 2100),
  value numeric not null,
  note text,
  created_at timestamptz not null default now(),
  unique (facility_id, metric, year)
);

-- ---------- CHỈ MỤC ----------
create index if not exists hse_roles_org_facility_idx on public.hse_roles (org_id, facility_id, role);
create index if not exists hse_roles_employee_idx on public.hse_roles (employee_id);
create index if not exists drill_participants_drill_idx on public.drill_participants (drill_id);
create index if not exists drill_participants_employee_idx on public.drill_participants (org_id, employee_id);
create index if not exists equipment_org_facility_idx on public.equipment (org_id, facility_id);
create unique index if not exists equipment_facility_code_key on public.equipment (facility_id, code) where code is not null;
create index if not exists equipment_inspections_equipment_idx on public.equipment_inspections (equipment_id, inspection_date);
create index if not exists equipment_work_orders_org_facility_idx on public.equipment_work_orders (org_id, facility_id, status, due_date);
create index if not exists equipment_work_orders_equipment_idx on public.equipment_work_orders (equipment_id);
create index if not exists inspection_plans_org_facility_idx on public.inspection_plans (org_id, facility_id);
create index if not exists checklist_runs_plan_idx on public.checklist_runs (plan_id, period);
create index if not exists capa_actions_org_facility_idx on public.capa_actions (org_id, facility_id, status, due_date);
create index if not exists chemical_transactions_chemical_idx on public.chemical_transactions (chemical_id, txn_date);
create index if not exists chemical_transactions_org_facility_idx on public.chemical_transactions (org_id, facility_id, txn_date);
create index if not exists packaging_records_org_facility_idx on public.packaging_records (org_id, facility_id, year);
create index if not exists circular_flows_org_facility_idx on public.circular_flows (org_id, facility_id, year);
create index if not exists hse_plan_items_org_facility_idx on public.hse_plan_items (org_id, facility_id, horizon, year);

-- ---------- ROW LEVEL SECURITY ----------
-- Đọc: cùng tổ chức. Ghi: cùng tổ chức và không phải vai trò "Chỉ xem".
do $$
declare t text;
begin
  foreach t in array array[
    'hse_roles','drill_participants','equipment','equipment_inspections','equipment_work_orders',
    'inspection_plans','chemical_transactions','packaging_records','circular_flows','hse_plan_items','roadmap_targets'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_select', t);
    execute format('drop policy if exists %I on public.%I', t || '_insert', t);
    execute format('drop policy if exists %I on public.%I', t || '_update', t);
    execute format('drop policy if exists %I on public.%I', t || '_delete', t);
    execute format('create policy %I on public.%I for select using (org_id = public.current_org_id())', t || '_select', t);
    execute format('create policy %I on public.%I for insert with check (org_id = public.current_org_id() and public.can_write())', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (org_id = public.current_org_id() and public.can_write())', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (org_id = public.current_org_id() and public.can_write())', t || '_delete', t);
  end loop;
end $$;
