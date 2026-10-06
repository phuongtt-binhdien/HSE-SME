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
  recurrence text not null default 'none' check (recurrence in ('none','monthly','quarterly','yearly')),
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
