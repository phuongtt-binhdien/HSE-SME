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
  category text not null default 'PCCC' check (category in ('PCCC','VSCN','ATLD','MT')),
  frequency text not null default 'monthly'
    check (frequency in ('daily','weekly','monthly','quarterly')),
  items jsonb not null default '[]'::jsonb,  -- [{"label": "..."}]
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
