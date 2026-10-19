-- ============================================================
-- EHSViet — Migration 002
-- Nhân sự & Huấn luyện · ESG – GRI – Khí nhà kính · Nội quy & tuân thủ nội bộ
--
-- Dùng cho CSDL đã tạo từ schema.sql bản trước: mở Supabase > SQL Editor,
-- dán toàn bộ file này và Run. Chạy lại nhiều lần không lỗi.
-- Cài mới: chỉ cần schema.sql (đã gồm toàn bộ nội dung dưới đây).
-- ============================================================

-- ---------- Quyền ghi: mọi vai trò trừ "Chỉ xem" ----------
create or replace function public.can_write()
returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select role <> 'viewer' from public.profiles where id = auth.uid()), false) $$;

grant execute on function public.can_write() to authenticated, anon;

-- ---------- Checklist: thêm nhóm 'HC' (Hóa chất) cho bảng tự kiểm tra tuân thủ ----------
alter table public.checklist_templates drop constraint if exists checklist_templates_category_check;
alter table public.checklist_templates add constraint checklist_templates_category_check
  check (category in ('PCCC','VSCN','ATLD','MT','HC'));

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
