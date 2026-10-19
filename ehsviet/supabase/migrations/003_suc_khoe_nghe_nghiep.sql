-- ============================================================
-- EHSViet — Migration 003
-- Sức khỏe nghề nghiệp: quan trắc môi trường lao động (QTMTLĐ), khám sức khỏe định kỳ –
-- khám phát hiện bệnh nghề nghiệp, bồi dưỡng bằng hiện vật; lịch nghĩa vụ lặp 02 năm/lần.
--
-- Chạy sau 002: mở Supabase > SQL Editor, dán toàn bộ file này và Run. Chạy lại nhiều lần không lỗi.
-- Cài mới: chỉ cần schema.sql (đã gồm toàn bộ nội dung dưới đây).
-- ============================================================

-- ---------- Lịch tuân thủ: chu kỳ 02 năm/lần (kiểm kê KNK, huấn luyện nhóm 1, 2, 3, 5, 6) ----------
alter table public.compliance_tasks drop constraint if exists compliance_tasks_recurrence_check;
alter table public.compliance_tasks add constraint compliance_tasks_recurrence_check
  check (recurrence in ('none','monthly','quarterly','yearly','biennial'));

-- ---------- Hồ sơ sức khỏe nghề nghiệp của người lao động ----------
-- hazardous: nghề, công việc nặng nhọc, độc hại, nguy hiểm (TT 11/2020, TT 19/2023) → khám sức khỏe 06 tháng/lần
-- exposures: yếu tố có hại tiếp xúc (on, bui_silic, bui, hoa_chat, nhiet, rung) → khám phát hiện BNN
-- allowance_level: mức bồi dưỡng bằng hiện vật 1–4 (TT 24/2022/TT-BLĐTBXH)
alter table public.employees add column if not exists hazardous boolean not null default false;
alter table public.employees add column if not exists exposures text[] not null default '{}';
alter table public.employees add column if not exists allowance_level smallint;
alter table public.employees drop constraint if exists employees_allowance_level_check;
alter table public.employees add constraint employees_allowance_level_check check (allowance_level between 1 and 4);

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
