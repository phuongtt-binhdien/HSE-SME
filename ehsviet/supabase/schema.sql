-- ============================================================
-- EHSViet — Schema CSDL đa tổ chức (multi-tenant SaaS)
-- Chạy toàn bộ file này trong Supabase Dashboard > SQL Editor
-- ============================================================

-- ---------- 1. TENANCY ----------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_code text,
  plan text not null default 'trial' check (plan in ('trial','basic','pro','enterprise')),
  created_at timestamptz not null default now()
);

create table public.facilities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  address text,
  gpmt_number text,          -- số Giấy phép môi trường
  gpmt_issuer text,          -- cơ quan cấp
  gpmt_issued_date date,
  gpmt_expiry date,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete set null,
  full_name text not null,
  phone text,
  role text not null default 'officer'
    check (role in ('admin','manager','officer','operator','viewer')),
  created_at timestamptz not null default now()
);

-- Hàm trợ giúp cho RLS
create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as
$$ select org_id from public.profiles where id = auth.uid() $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false) $$;

grant execute on function public.current_org_id() to authenticated, anon;
grant execute on function public.is_admin() to authenticated, anon;

-- ---------- 2. MODULE CHẤT THẢI & CTNH ----------
create table public.waste_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  code text,                 -- mã CTNH theo Thông tư 02/2022/TT-BTNMT, vd: 17 02 03
  name text not null,
  category text not null default 'CTNH' check (category in ('CTNH','CTRCNTT','CTRSH')),
  physical_state text check (physical_state in ('ran','long','bun')),
  unit text not null default 'kg',
  storage_location text,     -- vị trí lưu giữ (kho CTNH...)
  created_at timestamptz not null default now()
);

create table public.waste_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  waste_type_id uuid not null references public.waste_types(id) on delete restrict,
  log_date date not null default current_date,
  quantity numeric not null check (quantity >= 0),
  source text,               -- bộ phận phát sinh
  handler text,              -- người ghi nhận / cân
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.waste_contractors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  license_no text,           -- số giấy phép xử lý CTNH
  license_expiry date,
  scope text,                -- phạm vi thu gom/xử lý
  contact_person text,
  phone text,
  created_at timestamptz not null default now()
);

create table public.waste_transfers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  contractor_id uuid references public.waste_contractors(id) on delete set null,
  transfer_date date not null default current_date,
  manifest_no text,          -- số chứng từ CTNH
  status text not null default 'draft' check (status in ('draft','signed','completed')),
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.waste_transfer_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  transfer_id uuid not null references public.waste_transfers(id) on delete cascade,
  waste_type_id uuid not null references public.waste_types(id) on delete restrict,
  quantity numeric not null check (quantity >= 0)
);
alter table public.waste_transfer_items add column created_at timestamptz not null default now();

-- View tồn kho: phát sinh − đã chuyển giao (bàn giao đã ký/hoàn tất)
create view public.waste_inventory
with (security_invoker = true) as
select
  wt.id as waste_type_id,
  wt.org_id,
  wt.facility_id,
  wt.code,
  wt.name,
  wt.category,
  wt.unit,
  wt.storage_location,
  coalesce(li.total_in, 0)  as total_in,
  coalesce(lo.total_out, 0) as total_out,
  coalesce(li.total_in, 0) - coalesce(lo.total_out, 0) as stock
from public.waste_types wt
left join (
  select waste_type_id, sum(quantity) as total_in
  from public.waste_logs group by waste_type_id
) li on li.waste_type_id = wt.id
left join (
  select i.waste_type_id, sum(i.quantity) as total_out
  from public.waste_transfer_items i
  join public.waste_transfers t on t.id = i.transfer_id
  where t.status in ('signed','completed')
  group by i.waste_type_id
) lo on lo.waste_type_id = wt.id;

-- ---------- 3. MODULE VẬN HÀNH & QUAN TRẮC ----------
create table public.treatment_systems (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  name text not null,
  kind text not null default 'nuoc_thai' check (kind in ('nuoc_thai','khi_thai','khac')),
  capacity text,             -- vd: 120 m3/ngày đêm
  description text,
  created_at timestamptz not null default now()
);

create table public.operation_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  system_id uuid not null references public.treatment_systems(id) on delete cascade,
  log_date date not null default current_date,
  shift text not null default 'Ca 1',
  influent_flow numeric,     -- lưu lượng (m3)
  ph numeric,
  chemical_usage jsonb not null default '{}'::jsonb, -- {"PAC": 12, "Polymer": 0.5, ...} kg
  equipment_status text,     -- tình trạng thiết bị
  issues text,               -- sự cố / bất thường
  actions text,              -- biện pháp khắc phục
  operator_name text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.monitoring_points (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  name text not null,        -- vd: NT-01 Đầu ra HTXLNT
  kind text not null default 'nuoc_thai'
    check (kind in ('nuoc_thai','khi_thai','xung_quanh','tieng_on')),
  position text,             -- mô tả vị trí, chiều cao ống khói...
  created_at timestamptz not null default now()
);

create table public.monitoring_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  point_id uuid not null references public.monitoring_points(id) on delete cascade,
  sample_date date not null default current_date,
  parameter text not null,
  unit text,
  value numeric not null,
  threshold numeric,         -- giới hạn trên theo QCVN (đã nhân Kq/Kf/Kp/Kv nếu có)
  threshold_min numeric,     -- giới hạn dưới (vd pH)
  regulation text,           -- vd: QCVN 40:2011/BTNMT cột A
  is_exceeded boolean not null default false,
  lab text,                  -- đơn vị quan trắc
  report_no text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  source text not null,      -- quan_trac | tuan_thu | thiet_bi | khac
  message text not null,
  level text not null default 'warning' check (level in ('info','warning','critical')),
  status text not null default 'open' check (status in ('open','ack','resolved')),
  related_id uuid,
  created_at timestamptz not null default now()
);

-- ---------- 4. MODULE PCCC, AN TOÀN & SỰ CỐ ----------
create table public.checklist_templates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  name text not null,
  category text not null default 'PCCC' check (category in ('PCCC','VSCN','ATLD','MT','HC')),
  frequency text not null default 'monthly'
    check (frequency in ('daily','weekly','monthly','quarterly')),
  items jsonb not null default '[]'::jsonb,  -- [{"label": "...", "hint": "căn cứ, mức phạt…"}]
  created_at timestamptz not null default now()
);

create table public.checklist_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  template_id uuid not null references public.checklist_templates(id) on delete cascade,
  run_date date not null default current_date,
  inspector text,
  results jsonb not null default '[]'::jsonb, -- [{"label","status":"dat|khong_dat|na","note"}]
  score numeric,             -- % đạt
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.fire_equipment (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  name text not null,
  type text not null default 'binh_bot'
    check (type in ('binh_bot','binh_co2','hong_nuoc','may_bom','den_exit','bao_chay','khac')),
  location text,
  quantity int not null default 1,
  last_inspection date,
  next_inspection date,
  status text not null default 'tot' check (status in ('tot','can_bao_tri','hong')),
  note text,
  created_at timestamptz not null default now()
);

create table public.drills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  drill_date date not null default current_date,
  kind text not null default 'PCCC'
    check (kind in ('PCCC','su_co_hoa_chat','su_co_moi_truong','cap_cuu_TNLD')),
  scenario text,
  participants int,
  organizer text,
  evaluation text,
  created_at timestamptz not null default now()
);

create table public.contractor_permits (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  contractor_name text not null,
  work_description text,
  start_date date,
  end_date date,
  commitment_signed boolean not null default false,  -- đã ký cam kết BVMT-AT-PCCC
  safety_briefing boolean not null default false,    -- đã huấn luyện an toàn đầu vào
  note text,
  created_at timestamptz not null default now()
);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  incident_date date not null default current_date,
  kind text not null default 'moi_truong'
    check (kind in ('moi_truong','chay_no','tai_nan_ld','thiet_bi','khac')),
  severity text not null default 'nhe' check (severity in ('nhe','trung_binh','nghiem_trong')),
  title text not null,
  description text,
  immediate_action text,     -- xử lý ban đầu
  root_cause text,           -- nguyên nhân gốc
  status text not null default 'open' check (status in ('open','investigating','closed')),
  reporter text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.capa_actions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  incident_id uuid not null references public.incidents(id) on delete cascade,
  action text not null,
  owner text,
  due_date date,
  status text not null default 'open' check (status in ('open','in_progress','done')),
  completed_date date,
  created_at timestamptz not null default now()
);

create table public.chemicals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  name text not null,
  cas_no text,
  supplier text,
  storage_location text,
  quantity numeric,
  unit text default 'kg',
  pathh_available boolean not null default false,  -- có Phiếu an toàn hóa chất (PATHH)
  pathh_url text,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- 5. MODULE HỒ SƠ PHÁP LÝ & TUÂN THỦ ----------
create table public.legal_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  doc_no text,
  title text not null,
  category text not null default 'GPMT'
    check (category in ('GPMT','giay_phep','so_dang_ky','hop_dong','bao_cao','khac')),
  issuer text,
  issued_date date,
  expiry_date date,
  file_url text,
  note text,
  created_at timestamptz not null default now()
);

create table public.compliance_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'bao_cao'
    check (category in ('bao_cao','quan_trac','phi_le_phi','giay_phep','dao_tao','khac')),
  due_date date not null,
  recurrence text not null default 'none' check (recurrence in ('none','monthly','quarterly','yearly','biennial')),
  remind_days int not null default 14,
  assigned_to text,
  status text not null default 'pending' check (status in ('pending','in_progress','done')),
  completed_date date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- 6. CHỈ MỤC ----------
create index on public.facilities (org_id);
create index on public.profiles (org_id);
create index on public.waste_types (org_id, facility_id);
create index on public.waste_logs (org_id, facility_id, log_date);
create index on public.waste_transfers (org_id, facility_id, transfer_date);
create index on public.waste_transfer_items (org_id, transfer_id);
create index on public.operation_logs (org_id, facility_id, log_date);
create index on public.monitoring_results (org_id, facility_id, sample_date);
create index on public.alerts (org_id, facility_id, status);
create index on public.checklist_runs (org_id, facility_id, run_date);
create index on public.incidents (org_id, facility_id, status);
create index on public.compliance_tasks (org_id, facility_id, due_date, status);

-- ---------- 7. ROW LEVEL SECURITY ----------
-- organizations: cho phép người dùng đã đăng nhập tạo tổ chức (bootstrap SaaS tự phục vụ)
alter table public.organizations enable row level security;
create policy org_select on public.organizations for select
  using (id = public.current_org_id());
create policy org_insert on public.organizations for insert to authenticated
  with check (true);
create policy org_update on public.organizations for update
  using (id = public.current_org_id() and public.is_admin());

-- profiles
alter table public.profiles enable row level security;
create policy profile_select on public.profiles for select
  using (id = auth.uid() or org_id = public.current_org_id());
create policy profile_insert on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy profile_update on public.profiles for update
  using (id = auth.uid() or (org_id = public.current_org_id() and public.is_admin()));

-- Các bảng nghiệp vụ: chính sách chuẩn theo org_id
do $$
declare t text;
begin
  foreach t in array array[
    'facilities','waste_types','waste_logs','waste_contractors','waste_transfers',
    'waste_transfer_items','treatment_systems','operation_logs','monitoring_points',
    'monitoring_results','alerts','checklist_templates','checklist_runs','fire_equipment',
    'drills','contractor_permits','incidents','capa_actions','chemicals',
    'legal_documents','compliance_tasks'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (org_id = public.current_org_id())', t || '_select', t);
    execute format('create policy %I on public.%I for insert with check (org_id = public.current_org_id())', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (org_id = public.current_org_id())', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (org_id = public.current_org_id())', t || '_delete', t);
  end loop;
end $$;

-- ============================================================
-- 8. MỞ RỘNG: NHÂN SỰ & HUẤN LUYỆN · ESG – GRI – KHÍ NHÀ KÍNH · NỘI QUY NỘI BỘ
-- (trùng nội dung supabase/migrations/002_nhan_su_esg_noi_quy.sql — sửa cả hai nơi)
-- ============================================================

-- ---------- Quyền ghi: mọi vai trò trừ "Chỉ xem" ----------
create or replace function public.can_write()
returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select role <> 'viewer' from public.profiles where id = auth.uid()), false) $$;

grant execute on function public.can_write() to authenticated, anon;

-- ---------- NHÂN SỰ & HUẤN LUYỆN ----------
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  code text,                 -- mã nhân viên
  full_name text not null,
  gender text check (gender in ('nam','nu')),
  department text,           -- bộ phận / phân xưởng / tổ
  position text,             -- chức danh, công việc
  atvsld_group smallint check (atvsld_group between 1 and 6), -- nhóm huấn luyện ATVSLĐ (NĐ 44/2016/NĐ-CP)
  hire_date date,
  status text not null default 'active' check (status in ('active','inactive')),
  note text,
  hazardous boolean not null default false, -- nghề, công việc NNĐHNH (TT 11/2020, TT 19/2023) → khám 06 tháng/lần
  exposures text[] not null default '{}',   -- yếu tố có hại tiếp xúc: on, bui_silic, bui, hoa_chat, nhiet, rung
  allowance_level smallint constraint employees_allowance_level_check check (allowance_level between 1 and 4), -- bồi dưỡng hiện vật (TT 24/2022)
  created_at timestamptz not null default now()
);

-- Khóa / lớp huấn luyện: một quyết định thường áp dụng cho cả danh sách học viên
create table if not exists public.training_courses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  category text not null default 'atvsld'
    check (category in ('atvsld','pccc','su_co_chat_thai','hoa_chat','so_cap_cuu','khac')),
  name text not null,        -- tên khóa huấn luyện
  start_date date not null,  -- ngày huấn luyện
  end_date date,
  decision_no text,          -- số quyết định (tổ chức / công nhận kết quả huấn luyện)
  decision_date date,
  provider text,             -- đơn vị huấn luyện, giảng viên
  hours numeric check (hours >= 0),                  -- số giờ huấn luyện (GRI 404-1)
  validity_months int check (validity_months >= 0),  -- hiệu lực; trống = mặc định theo loại/nhóm
  note text,
  created_at timestamptz not null default now()
);

-- Lượt huấn luyện của từng người lao động
create table if not exists public.training_records (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  course_id uuid not null references public.training_courses(id) on delete cascade,
  result text not null default 'dat' check (result in ('dat','khong_dat')),
  certificate_no text,       -- số giấy chứng nhận / thẻ an toàn
  expiry_date date,          -- hạn ghi trên chứng nhận (ghi đè hạn tính tự động)
  note text,
  created_at timestamptz not null default now(),
  unique (employee_id, course_id)
);

-- ---------- ESG · GRI · KHÍ NHÀ KÍNH ----------
create table if not exists public.esg_policies (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  pillar text not null default 'E' check (pillar in ('E','S','G')),
  title text not null,
  doc_no text,               -- số hiệu văn bản ban hành
  issued_date date,
  review_date date,          -- hạn soát xét tiếp theo
  owner text,                -- đơn vị chủ trì
  status text not null default 'draft' check (status in ('draft','active','review','retired')),
  commitments text,          -- cam kết chính, mỗi dòng một cam kết
  frameworks text,           -- chuẩn mực liên quan: GRI, ISO 14001, TT 96/2020, QĐ 46/2026…
  file_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.esg_targets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  pillar text not null default 'E' check (pillar in ('E','S','G')),
  title text not null,
  metric_key text,           -- chỉ số ứng dụng tự tính (vd: ghg_intensity); trống = nhập tay
  unit text,
  direction text not null default 'decrease' check (direction in ('decrease','increase')),
  baseline_year int,
  baseline_value numeric,
  target_year int,
  target_value numeric,
  target_pct numeric,        -- mục tiêu tương đối so với năm gốc (%, vd -10) khi chưa có giá trị tuyệt đối
  current_value numeric,     -- giá trị hiện tại khi nhập tay
  gri_code text,
  note text,
  created_at timestamptz not null default now()
);

-- Số liệu nhập tay theo năm cho chỉ mục GRI / TT 96/2020 (sản lượng, nước, vật liệu…)
create table if not exists public.esg_metrics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  year int not null check (year between 2000 and 2100),
  code text not null,        -- mã chỉ số: 'GRI 303-3', 'production_t'…
  value numeric,
  text_value text,           -- nội dung định tính
  unit text,
  source text,               -- nguồn số liệu (sổ, hóa đơn, báo cáo…)
  note text,
  created_at timestamptz not null default now(),
  unique (facility_id, year, code)
);

-- Số liệu hoạt động kiểm kê KNK; hệ số được lưu cố định tại thời điểm nhập
create table if not exists public.ghg_activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  year int not null check (year between 2000 and 2100),
  month int check (month between 1 and 12),   -- trống = số liệu cả năm
  scope smallint not null check (scope in (1,2,3)),
  source_key text,           -- mã nguồn mẫu (than_lo_hoi, dien_luoi…); 'khac' = tự nhập
  source_name text not null,
  scope3_category smallint check (scope3_category between 1 and 15),
  activity_value numeric not null check (activity_value >= 0),
  activity_unit text not null,
  ef_value numeric not null check (ef_value >= 0),  -- kgCO2e / đơn vị hoạt động
  ef_source text,            -- nguồn hệ số phát thải
  biogenic_co2_t numeric,    -- CO2 sinh khối (tấn), báo cáo riêng, không cộng vào phạm vi 1
  energy_gj numeric,         -- năng lượng quy đổi (GJ) – GRI 302-1
  toe numeric,               -- năng lượng quy đổi (TOE) – sử dụng năng lượng tiết kiệm, hiệu quả
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- NỘI QUY & TUÂN THỦ NỘI BỘ ----------
create table if not exists public.internal_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  code text,                 -- mã hiệu tài liệu (MT-HD03-NQ…)
  title text not null,
  category text not null default 'moi_truong'
    check (category in ('moi_truong','vscn','atvsld','pccc','hoa_chat','nha_thau','lao_dong','khac')),
  decision_no text,
  issued_date date,
  status text not null default 'active' check (status in ('draft','active','retired')),
  summary text,
  file_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.rule_violations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  violation_date date not null default current_date,
  rule_id uuid references public.internal_rules(id) on delete set null,
  category text not null default 'moi_truong'
    check (category in ('moi_truong','vscn','atvsld','pccc','hoa_chat','nha_thau','lao_dong','khac')),
  kind text not null default 'hanh_vi'
    check (kind in ('thong_so','khu_vuc','diem_thu_gom','hanh_vi')),
  subject_type text not null default 'don_vi'
    check (subject_type in ('don_vi','ca_nhan','nha_thau')),
  department text,           -- đơn vị chịu trách nhiệm
  employee_id uuid references public.employees(id) on delete set null,
  person_name text,          -- người vi phạm khi không có trong danh sách nhân sự
  contractor_name text,
  location text,
  description text not null,
  record_no text,            -- số biên bản (MT-QT03-BM02)
  evidence_url text,         -- ảnh, biên bản scan
  severity text not null default 'nhe' check (severity in ('nhe','trung_binh','nghiem_trong')),
  community_impact boolean not null default false, -- ảnh hưởng khu dân cư
  counts_for_unit boolean not null default true,   -- tính vào xếp loại tháng của đơn vị
  measure text,              -- hình thức xử lý (kỷ luật theo BLLĐ / điều khoản HĐ nhà thầu)
  corrective_action text,
  responsible text,
  due_date date,
  status text not null default 'open' check (status in ('open','fixing','closed')),
  closed_date date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- ---------- CHỈ MỤC ----------
create index if not exists employees_org_facility_idx on public.employees (org_id, facility_id);
create unique index if not exists employees_facility_code_key
  on public.employees (facility_id, code) where code is not null;
create index if not exists training_courses_org_facility_idx on public.training_courses (org_id, facility_id, start_date);
create index if not exists training_records_employee_idx on public.training_records (org_id, employee_id);
create index if not exists training_records_course_idx on public.training_records (course_id);
create index if not exists esg_policies_org_facility_idx on public.esg_policies (org_id, facility_id);
create index if not exists esg_targets_org_facility_idx on public.esg_targets (org_id, facility_id);
create index if not exists esg_metrics_org_facility_idx on public.esg_metrics (org_id, facility_id, year);
create index if not exists ghg_activities_org_facility_idx on public.ghg_activities (org_id, facility_id, year);
create index if not exists internal_rules_org_facility_idx on public.internal_rules (org_id, facility_id);
create index if not exists rule_violations_org_facility_idx on public.rule_violations (org_id, facility_id, violation_date);

-- ---------- ROW LEVEL SECURITY ----------
-- Đọc: cùng tổ chức. Ghi: cùng tổ chức và không phải vai trò "Chỉ xem".
do $$
declare t text;
begin
  foreach t in array array[
    'employees','training_courses','training_records','esg_policies','esg_targets',
    'esg_metrics','ghg_activities','internal_rules','rule_violations'
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

-- ============================================================
-- 9. SỨC KHỎE NGHỀ NGHIỆP: QTMTLĐ, KHÁM SỨC KHỎE – BỆNH NGHỀ NGHIỆP
--    (cùng nội dung migrations/003_suc_khoe_nghe_nghiep.sql – sửa cả hai nơi)
-- ============================================================

-- ---------- Quan trắc môi trường lao động ----------
create table if not exists public.wem_campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  sample_date date not null,     -- ngày đo
  provider text,                 -- tổ chức QTMTLĐ đủ điều kiện
  report_no text,
  report_date date,
  published_date date,           -- ngày công khai kết quả cho NLĐ (NĐ 283/2026/NĐ-CP Điều 38 k2)
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.wem_results (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  campaign_id uuid not null references public.wem_campaigns(id) on delete cascade,
  department text,               -- bộ phận, phân xưởng
  position text not null,        -- vị trí đo
  factor text not null check (factor in (
    'nhiet_do','do_am','toc_do_gio','anh_sang','on','rung',
    'bui_toan_phan','bui_ho_hap','bui_silic','hoi_khi_doc','tam_sinh_ly','khac')),
  parameter text,                -- vd NH₃, CO, bụi hô hấp chứa silic
  unit text,
  value numeric,                 -- trống: không phân loại / chỉ mô tả
  limit_min numeric,             -- giới hạn dưới (nhiệt độ, độ ẩm, ánh sáng…)
  limit_max numeric,             -- giới hạn trên theo QCVN (BYT)
  work_intensity text check (work_intensity in ('nhe','vua','nang')), -- cường độ lao động (vi khí hậu)
  exposed_count int check (exposed_count >= 0),                       -- số NLĐ tiếp xúc
  note text,
  created_at timestamptz not null default now()
);

-- ---------- Khám sức khỏe định kỳ, khám phát hiện bệnh nghề nghiệp ----------
create table if not exists public.health_checks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  facility_id uuid references public.facilities(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  exam_date date not null,
  kind text not null default 'dinh_ky' check (kind in ('dinh_ky','bnn','truoc_bo_tri','khac')),
  provider text,                 -- cơ sở khám
  health_class text check (health_class in ('I','II','III','IV','V')), -- phân loại sức khỏe
  conclusion text,
  disease text,                  -- BNN phát hiện / nghi ngờ (danh mục TT 60/2025/TT-BYT)
  follow_up text,                -- theo dõi, điều trị, giám định, bố trí công việc
  note text,
  created_at timestamptz not null default now()
);

-- ---------- CHỈ MỤC ----------
create index if not exists wem_campaigns_org_facility_idx on public.wem_campaigns (org_id, facility_id, sample_date);
create index if not exists wem_results_campaign_idx on public.wem_results (campaign_id);
create index if not exists health_checks_employee_idx on public.health_checks (org_id, employee_id, exam_date);

-- ---------- ROW LEVEL SECURITY ----------
-- Đọc: cùng tổ chức. Ghi: cùng tổ chức và không phải vai trò "Chỉ xem".
do $$
declare t text;
begin
  foreach t in array array['wem_campaigns','wem_results','health_checks']
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

-- ============================================================
-- 10. VẬN HÀNH THEO PDCA: KẾ HOẠCH – LỘ TRÌNH NET ZERO, TỔ CHỨC BỘ MÁY, DIỄN TẬP THEO NGƯỜI,
--     THIẾT BỊ – SỬA CHỮA – KIỂM ĐỊNH, HÓA CHẤT NHẬP – XUẤT – TỒN, EPR – TUẦN HOÀN,
--     CHƯƠNG TRÌNH KIỂM TRA ĐỊNH KỲ, HÀNH ĐỘNG KHẮC PHỤC TẬP TRUNG
--    (cùng nội dung migrations/004_pdca_thiet_bi_hoa_chat_tuan_hoan.sql – sửa cả hai nơi)
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
