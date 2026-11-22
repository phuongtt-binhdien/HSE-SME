-- HSE Bình Điền: tài khoản người dùng, ví credit, nạp tiền (QR chuyển khoản / mã kích hoạt), mở khóa dịch vụ theo phiên,
-- huấn luyện an ninh – an toàn 15 phút trước khi vào nhà máy (mô phỏng 3D).
-- Toàn bộ đối tượng dùng tiền tố hse_ để không đụng tới bảng của ứng dụng khác dùng chung dự án.
-- Đăng nhập dùng Supabase Auth (auth.users). Hồ sơ/ví được tạo lười khi đăng nhập lần đầu bằng hse_ensure_profile() — không tạo trigger trên auth.users.
-- Quản trị viên: thêm thủ công  insert into public.hse_admins(user_id) select id from auth.users where email = '...';

create table if not exists public.hse_settings (key text primary key, value jsonb not null);
create table if not exists public.hse_admins (user_id uuid primary key references auth.users(id) on delete cascade);
create table if not exists public.hse_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '', phone text not null default '', company text not null default '',
  created_at timestamptz not null default now());
create table if not exists public.hse_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  balance integer not null default 0 check (balance >= 0), updated_at timestamptz not null default now());
create table if not exists public.hse_packages (vnd integer primary key check (vnd > 0), credits integer not null check (credits > 0), sort integer not null default 0);
create table if not exists public.hse_services (
  key text primary key, title text not null, price integer not null check (price >= 0), pass_hours integer not null default 24 check (pass_hours > 0),
  needs_induction boolean not null default false, active boolean not null default true, sort integer not null default 0);
create table if not exists public.hse_passes (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade, service_key text not null references public.hse_services(key),
  expires_at timestamptz not null, price_paid integer not null, created_at timestamptz not null default now());
create index if not exists hse_passes_user_idx on public.hse_passes (user_id, service_key, expires_at desc);
create table if not exists public.hse_topups (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade, vnd integer not null, credits integer not null,
  memo text not null unique, status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(), decided_at timestamptz, decided_by uuid);
create index if not exists hse_topups_user_idx on public.hse_topups (user_id, created_at desc);
create table if not exists public.hse_codes (
  code text primary key, credits integer not null check (credits > 0), note text not null default '', created_by uuid, created_at timestamptz not null default now(),
  expires_at timestamptz, used_by uuid, used_at timestamptz);
create table if not exists public.hse_ledger (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade, delta integer not null, balance_after integer not null,
  reason text not null, ref text not null default '', created_at timestamptz not null default now());
create index if not exists hse_ledger_user_idx on public.hse_ledger (user_id, id desc);
create table if not exists public.hse_redeem_attempts (id bigserial primary key, user_id uuid not null, at timestamptz not null default now(), ok boolean not null);
create table if not exists public.hse_induction_questions (id integer primary key, section text not null, prompt text not null, options jsonb not null, sort integer not null default 0);
create table if not exists public.hse_induction_key (question_id integer primary key references public.hse_induction_questions(id) on delete cascade, answer integer not null);
create table if not exists public.hse_induction_attempts (
  id bigserial primary key, user_id uuid not null references auth.users(id) on delete cascade, started_at timestamptz not null default now(),
  finished_at timestamptz, seconds integer, score integer, total integer, passed boolean);
create table if not exists public.hse_inductions (
  user_id uuid primary key references auth.users(id) on delete cascade, passed_at timestamptz not null, expires_at timestamptz not null, score integer not null, total integer not null);

alter table public.hse_settings enable row level security;
alter table public.hse_admins enable row level security;
alter table public.hse_profiles enable row level security;
alter table public.hse_wallets enable row level security;
alter table public.hse_packages enable row level security;
alter table public.hse_services enable row level security;
alter table public.hse_passes enable row level security;
alter table public.hse_topups enable row level security;
alter table public.hse_codes enable row level security;
alter table public.hse_ledger enable row level security;
alter table public.hse_redeem_attempts enable row level security;
alter table public.hse_induction_questions enable row level security;
alter table public.hse_induction_key enable row level security;   -- không có policy: không ai đọc được đáp án qua API
alter table public.hse_induction_attempts enable row level security;
alter table public.hse_inductions enable row level security;

create or replace function public.hse_is_admin() returns boolean language sql stable security definer set search_path = public, auth as
$$ select exists (select 1 from public.hse_admins a where a.user_id = auth.uid()) $$;

-- Chính sách: người dùng chỉ đọc dữ liệu của mình; mọi thay đổi số dư đi qua hàm security definer bên dưới.
create policy hse_settings_read on public.hse_settings for select to authenticated using (true);
create policy hse_settings_admin on public.hse_settings for all to authenticated using (public.hse_is_admin()) with check (public.hse_is_admin());
create policy hse_admins_self on public.hse_admins for select to authenticated using (user_id = auth.uid());
create policy hse_profiles_read on public.hse_profiles for select to authenticated using (user_id = auth.uid() or public.hse_is_admin());
create policy hse_profiles_update on public.hse_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy hse_wallets_read on public.hse_wallets for select to authenticated using (user_id = auth.uid() or public.hse_is_admin());
create policy hse_packages_read on public.hse_packages for select to authenticated using (true);
create policy hse_packages_admin on public.hse_packages for all to authenticated using (public.hse_is_admin()) with check (public.hse_is_admin());
create policy hse_services_read on public.hse_services for select to authenticated using (true);
create policy hse_services_admin on public.hse_services for all to authenticated using (public.hse_is_admin()) with check (public.hse_is_admin());
create policy hse_passes_read on public.hse_passes for select to authenticated using (user_id = auth.uid() or public.hse_is_admin());
create policy hse_topups_read on public.hse_topups for select to authenticated using (user_id = auth.uid() or public.hse_is_admin());
create policy hse_codes_admin on public.hse_codes for all to authenticated using (public.hse_is_admin()) with check (public.hse_is_admin());
create policy hse_ledger_read on public.hse_ledger for select to authenticated using (user_id = auth.uid() or public.hse_is_admin());
create policy hse_questions_read on public.hse_induction_questions for select to authenticated using (true);
create policy hse_attempts_read on public.hse_induction_attempts for select to authenticated using (user_id = auth.uid() or public.hse_is_admin());
create policy hse_inductions_read on public.hse_inductions for select to authenticated using (user_id = auth.uid() or public.hse_is_admin());

-- ── Hàm nghiệp vụ ──────────────────────────────────────────────────────────────
create or replace function public.hse_setting(p_key text, p_default jsonb) returns jsonb language sql stable security definer set search_path = public as
$$ select coalesce((select value from public.hse_settings where key = p_key), p_default) $$;

create or replace function public.hse_ensure_profile(p_name text default '', p_phone text default '', p_company text default '') returns jsonb
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  insert into public.hse_profiles (user_id, full_name, phone, company) values (uid, left(coalesce(p_name, ''), 120), left(coalesce(p_phone, ''), 30), left(coalesce(p_company, ''), 160))
    on conflict (user_id) do update set
      full_name = case when public.hse_profiles.full_name = '' then excluded.full_name else public.hse_profiles.full_name end,
      phone = case when public.hse_profiles.phone = '' then excluded.phone else public.hse_profiles.phone end,
      company = case when public.hse_profiles.company = '' then excluded.company else public.hse_profiles.company end;
  insert into public.hse_wallets (user_id) values (uid) on conflict do nothing;
  return public.hse_me();
end $$;

create or replace function public.hse_me() returns jsonb language plpgsql stable security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); r jsonb;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select jsonb_build_object(
    'user_id', uid,
    'email', (select email from auth.users where id = uid),
    'profile', (select to_jsonb(p) from public.hse_profiles p where p.user_id = uid),
    'balance', coalesce((select balance from public.hse_wallets where user_id = uid), 0),
    'is_admin', exists (select 1 from public.hse_admins where user_id = uid),
    'passes', coalesce((select jsonb_agg(jsonb_build_object('service_key', service_key, 'expires_at', expires_at)) from
                (select distinct on (service_key) service_key, expires_at from public.hse_passes where user_id = uid and expires_at > now() order by service_key, expires_at desc) q), '[]'::jsonb),
    'induction', (select to_jsonb(i) from public.hse_inductions i where i.user_id = uid and i.expires_at > now())
  ) into r;
  return r;
end $$;

create or replace function public.hse_create_topup(p_vnd integer) returns public.hse_topups language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); pk public.hse_packages; t public.hse_topups; m text; n integer := 0;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into pk from public.hse_packages where vnd = p_vnd;
  if not found then raise exception 'INVALID_PACKAGE'; end if;
  if (select count(*) from public.hse_topups where user_id = uid and status = 'pending') >= 5 then raise exception 'TOO_MANY_PENDING'; end if;
  loop
    m := 'HSE' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into public.hse_topups (user_id, vnd, credits, memo) values (uid, pk.vnd, pk.credits, m) returning * into t;
      return t;
    exception when unique_violation then n := n + 1; if n > 5 then raise; end if;
    end;
  end loop;
end $$;

create or replace function public.hse_cancel_topup(p_id bigint) returns void language plpgsql security definer set search_path = public, auth as $$
begin
  update public.hse_topups set status = 'cancelled', decided_at = now() where id = p_id and user_id = auth.uid() and status = 'pending';
  if not found then raise exception 'NOT_FOUND_OR_NOT_PENDING'; end if;
end $$;

-- Cộng/trừ ví và ghi sổ trong một giao dịch (nội bộ; không cấp quyền gọi từ API)
create or replace function public.hse_wallet_apply(p_user uuid, p_delta integer, p_reason text, p_ref text) returns integer language plpgsql security definer set search_path = public as $$
declare nb integer;
begin
  insert into public.hse_wallets (user_id) values (p_user) on conflict do nothing;
  update public.hse_wallets set balance = balance + p_delta, updated_at = now() where user_id = p_user returning balance into nb;  -- check (balance >= 0) chặn số dư âm
  insert into public.hse_ledger (user_id, delta, balance_after, reason, ref) values (p_user, p_delta, nb, p_reason, coalesce(p_ref, ''));
  return nb;
end $$;

create or replace function public.hse_admin_decide_topup(p_id bigint, p_approve boolean) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare t public.hse_topups; nb integer;
begin
  if not public.hse_is_admin() then raise exception 'FORBIDDEN'; end if;
  select * into t from public.hse_topups where id = p_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if t.status <> 'pending' then raise exception 'ALREADY_DECIDED'; end if;
  if p_approve then
    nb := public.hse_wallet_apply(t.user_id, t.credits, 'Nạp tiền ' || t.vnd || 'đ', t.memo);
    update public.hse_topups set status = 'approved', decided_at = now(), decided_by = auth.uid() where id = p_id;
  else
    update public.hse_topups set status = 'rejected', decided_at = now(), decided_by = auth.uid() where id = p_id;
  end if;
  return jsonb_build_object('id', p_id, 'status', case when p_approve then 'approved' else 'rejected' end, 'balance', nb);
end $$;

create or replace function public.hse_admin_adjust(p_user uuid, p_delta integer, p_reason text) returns integer language plpgsql security definer set search_path = public, auth as $$
begin
  if not public.hse_is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_delta = 0 or abs(p_delta) > 100000 then raise exception 'INVALID_AMOUNT'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'REASON_REQUIRED'; end if;
  return public.hse_wallet_apply(p_user, p_delta, 'Quản trị điều chỉnh: ' || left(p_reason, 200), 'admin:' || auth.uid());
end $$;

create or replace function public.hse_admin_create_codes(p_n integer, p_credits integer, p_note text default '', p_days integer default null) returns setof text
language plpgsql security definer set search_path = public, auth as $$
declare i integer := 0; c text;
begin
  if not public.hse_is_admin() then raise exception 'FORBIDDEN'; end if;
  if p_n < 1 or p_n > 200 or p_credits < 1 or p_credits > 10000 then raise exception 'INVALID_AMOUNT'; end if;
  while i < p_n loop
    c := 'HSE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)) || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)) || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
    begin
      insert into public.hse_codes (code, credits, note, created_by, expires_at) values (c, p_credits, left(coalesce(p_note, ''), 200), auth.uid(), case when p_days is null then null else now() + make_interval(days => p_days) end);
      i := i + 1; return next c;
    exception when unique_violation then null;
    end;
  end loop;
end $$;

create or replace function public.hse_redeem_code(p_code text) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); k text := upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g')); rec public.hse_codes; nb integer;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if (select count(*) from public.hse_redeem_attempts where user_id = uid and ok = false and at > now() - interval '1 hour') >= 5 then raise exception 'TOO_MANY_ATTEMPTS'; end if;
  select * into rec from public.hse_codes where code = k for update;
  if not found or rec.used_by is not null or (rec.expires_at is not null and rec.expires_at < now()) then
    insert into public.hse_redeem_attempts (user_id, ok) values (uid, false);
    return jsonb_build_object('ok', false, 'error', 'INVALID_CODE');   -- không raise: giao dịch phải commit để đếm số lần sai
  end if;
  nb := public.hse_wallet_apply(uid, rec.credits, 'Mã nạp credit', rec.code);
  update public.hse_codes set used_by = uid, used_at = now() where code = k;
  insert into public.hse_redeem_attempts (user_id, ok) values (uid, true);
  return jsonb_build_object('ok', true, 'credits', rec.credits, 'balance', nb);
end $$;

create or replace function public.hse_unlock_service(p_key text) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); s public.hse_services; pass_exp timestamptz; nb integer; ind boolean;
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into s from public.hse_services where key = p_key and active;
  if not found then raise exception 'SERVICE_NOT_FOUND'; end if;
  insert into public.hse_wallets (user_id) values (uid) on conflict do nothing;
  perform 1 from public.hse_wallets where user_id = uid for update;     -- tuần tự hóa các lần mở khóa của cùng một người dùng
  select max(expires_at) into pass_exp from public.hse_passes where user_id = uid and service_key = p_key and expires_at > now();
  if pass_exp is not null then
    return jsonb_build_object('charged', false, 'expires_at', pass_exp, 'balance', (select balance from public.hse_wallets where user_id = uid));
  end if;
  if s.needs_induction then
    select exists (select 1 from public.hse_inductions where user_id = uid and expires_at > now()) into ind;
    if not ind then raise exception 'INDUCTION_REQUIRED'; end if;
  end if;
  if (select balance from public.hse_wallets where user_id = uid) < s.price then raise exception 'INSUFFICIENT_CREDIT'; end if;
  nb := public.hse_wallet_apply(uid, -s.price, 'Mở khóa: ' || s.title, s.key);
  pass_exp := now() + make_interval(hours => s.pass_hours);
  insert into public.hse_passes (user_id, service_key, expires_at, price_paid) values (uid, s.key, pass_exp, s.price);
  return jsonb_build_object('charged', true, 'expires_at', pass_exp, 'balance', nb);
end $$;

create or replace function public.hse_induction_start() returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); a public.hse_induction_attempts; mins integer := coalesce((public.hse_setting('induction_minutes', '15'::jsonb))::text::integer, 15);
begin
  if uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into a from public.hse_induction_attempts where user_id = uid and finished_at is null and started_at > now() - interval '6 hours' order by id desc limit 1;
  if not found then insert into public.hse_induction_attempts (user_id) values (uid) returning * into a; end if;
  return jsonb_build_object('attempt_id', a.id, 'started_at', a.started_at, 'now', now(), 'required_seconds', mins * 60);
end $$;

create or replace function public.hse_induction_submit(p_attempt bigint, p_answers jsonb) returns jsonb language plpgsql security definer set search_path = public, auth as $$
declare uid uuid := auth.uid(); a public.hse_induction_attempts; mins integer := coalesce((public.hse_setting('induction_minutes', '15'::jsonb))::text::integer, 15);
  pct integer := coalesce((public.hse_setting('induction_pass_pct', '80'::jsonb))::text::integer, 80); days integer := coalesce((public.hse_setting('induction_valid_days', '365'::jsonb))::text::integer, 365);
  v_secs integer; v_total integer; v_score integer; v_ok boolean; v_wrong jsonb;
begin
  select * into a from public.hse_induction_attempts where id = p_attempt and user_id = uid for update;
  if not found or a.finished_at is not null then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  v_secs := extract(epoch from (now() - a.started_at))::integer;
  if v_secs < mins * 60 then raise exception 'TOO_FAST'; end if;            -- thời gian học tối thiểu do máy chủ đo, không tin đồng hồ trình duyệt
  select count(*) into v_total from public.hse_induction_key;
  select count(*) filter (where (p_answers ->> k.question_id::text) is not null and (p_answers ->> k.question_id::text)::integer = k.answer),
         coalesce(jsonb_agg(k.question_id order by k.question_id) filter (where (p_answers ->> k.question_id::text) is null or (p_answers ->> k.question_id::text)::integer <> k.answer), '[]'::jsonb)
    into v_score, v_wrong from public.hse_induction_key k;
  v_ok := v_total > 0 and (v_score * 100 / v_total) >= pct;
  update public.hse_induction_attempts t set finished_at = now(), seconds = v_secs, score = v_score, total = v_total, passed = v_ok where t.id = a.id;
  if v_ok then
    insert into public.hse_inductions (user_id, passed_at, expires_at, score, total) values (uid, now(), now() + make_interval(days => days), v_score, v_total)
      on conflict (user_id) do update set passed_at = excluded.passed_at, expires_at = excluded.expires_at, score = excluded.score, total = excluded.total;
  end if;
  return jsonb_build_object('passed', v_ok, 'score', v_score, 'total', v_total, 'seconds', v_secs, 'wrong', v_wrong, 'pass_pct', pct);
end $$;

create or replace function public.hse_admin_users(p_search text default '') returns table (user_id uuid, email text, full_name text, phone text, company text, balance integer, created_at timestamptz, induction_until timestamptz, is_admin boolean)
language plpgsql stable security definer set search_path = public, auth as $$
begin
  if not public.hse_is_admin() then raise exception 'FORBIDDEN'; end if;
  return query select p.user_id, u.email::text, p.full_name, p.phone, p.company, coalesce(w.balance, 0), p.created_at, i.expires_at, exists (select 1 from public.hse_admins a where a.user_id = p.user_id)
    from public.hse_profiles p join auth.users u on u.id = p.user_id left join public.hse_wallets w on w.user_id = p.user_id left join public.hse_inductions i on i.user_id = p.user_id
    where coalesce(p_search, '') = '' or u.email ilike '%' || p_search || '%' or p.full_name ilike '%' || p_search || '%' or p.phone ilike '%' || p_search || '%'
    order by p.created_at desc limit 500;
end $$;

-- Quyền gọi: chỉ người dùng đã đăng nhập; hàm nội bộ không mở ra API.
revoke all on function public.hse_wallet_apply(uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.hse_setting(text, jsonb) from public, anon, authenticated;
do $$ declare f text; begin
  foreach f in array array[
    'hse_is_admin()', 'hse_ensure_profile(text, text, text)', 'hse_me()', 'hse_create_topup(integer)', 'hse_cancel_topup(bigint)', 'hse_admin_decide_topup(bigint, boolean)',
    'hse_admin_adjust(uuid, integer, text)', 'hse_admin_create_codes(integer, integer, text, integer)', 'hse_redeem_code(text)', 'hse_unlock_service(text)',
    'hse_induction_start()', 'hse_induction_submit(bigint, jsonb)', 'hse_admin_users(text)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- ── Dữ liệu ban đầu ──────────────────────────────────────────────────────────
insert into public.hse_packages (vnd, credits, sort) values (100000, 100, 1), (200000, 220, 2), (300000, 345, 3), (400000, 480, 4), (500000, 625, 5) on conflict do nothing;
insert into public.hse_services (key, title, price, pass_hours, needs_induction, sort) values
  ('sim3d', 'Mô phỏng 3D nhà máy', 15, 24, true, 1),
  ('wwsim', 'Mô phỏng dòng nước thải', 10, 24, false, 2),
  ('dcs', 'Màn hình DCS nước thải', 10, 24, false, 8),
  ('dcsplant', 'Màn hình DCS dây chuyền sản xuất', 15, 24, false, 9),
  ('dispersion', 'Lan truyền khí thải (Gauss ISC3)', 20, 24, false, 3),
  ('gpmt01', 'GPMT Nguồn 01 — lò hơi', 20, 24, false, 4),
  ('lowsrc', 'Nguồn thấp · Đường · Mặt', 15, 24, false, 5),
  ('isoforms', 'Biểu mẫu ISO 14001', 10, 24, false, 6),
  ('gri', 'Báo cáo GRI', 10, 24, false, 7) on conflict do nothing;
insert into public.hse_settings (key, value) values
  ('induction_minutes', '15'), ('induction_pass_pct', '80'), ('induction_valid_days', '365'),
  ('credit_vnd', '1000'), ('contact_zalo_name', '""'), ('contact_zalo_phone', '""'),
  ('bank_bin', '""'), ('bank_name', '""'), ('bank_account', '""'), ('bank_account_name', '""') on conflict do nothing;

insert into public.hse_induction_questions (id, section, prompt, options, sort) values
  (1, 'an_ninh', 'Khi đến nhà máy lần đầu với tư cách khách, việc đầu tiên phải làm là gì?', '["Đi thẳng vào khu sản xuất nếu có người quen","Đăng ký tại cổng/bảo vệ, xuất trình giấy tờ cần thiết và nhận thẻ khách","Chụp ảnh khu vực để báo cáo","Đỗ xe trong khu sản xuất"]', 1),
  (2, 'an_ninh', 'Quay phim, chụp ảnh trong nhà máy:', '["Được phép tự do","Chỉ khi được người quản lý khu vực cho phép","Chỉ ở khu kho","Chỉ vào ban đêm"]', 2),
  (3, 'ppe', 'Trang bị bảo hộ tối thiểu khi vào khu sản xuất gồm:', '["Chỉ cần khẩu trang","Mũ bảo hộ, giày bảo hộ, và thêm kính/găng/nút tai theo biển báo khu vực","Dép và áo khoác","Không cần nếu chỉ đi nhanh"]', 3),
  (4, 'ppe', 'Khi đi trong nhà xưởng, bạn phải:', '["Đi theo lối dành cho người đi bộ, nhường xe nâng","Đi tắt qua dưới băng tải","Đứng gần thùng quay để quan sát","Chạy để ra nhanh"]', 4),
  (5, 'pccc', 'Việc hàn, cắt hoặc sinh lửa trong khu vực sản xuất:', '["Tự làm nếu nhanh","Chỉ được thực hiện khi có phép/giám sát an toàn và kiểm tra sau khi kết thúc","Được phép nếu có bình chữa cháy","Được phép vào giờ nghỉ"]', 5),
  (6, 'pccc', 'Khi nghe chuông báo cháy hoặc phát hiện cháy, bạn:', '["Tiếp tục tham quan","Báo ngay cho người phụ trách/bộ phận PCCC, rời khu vực theo lối thoát hiểm đến điểm tập kết","Dùng thang máy","Quay lại lấy đồ cá nhân"]', 6),
  (7, 'hoa_chat', 'Khi ngửi thấy mùi khai (NH₃) nồng, bạn nên:', '["Lại gần xem nguồn rò","Báo ngay, di chuyển ra ngoài khu vực theo hướng ngược gió/ra nơi thoáng và không tự xử lý nếu chưa được huấn luyện","Ở lại và che mũi bằng tay","Đóng cửa và ở trong phòng kín"]', 7),
  (8, 'hoa_chat', 'Hóa chất đổ, tràn (axit, dầu, dung dịch hấp thụ):', '["Lau bằng giẻ và bỏ vào thùng rác thường","Báo ngay cho bộ phận phụ trách; không tự xử lý khi chưa được hướng dẫn; tránh xa và cảnh báo người khác","Đổ nước thật nhiều ra cống","Bỏ qua nếu ít"]', 8),
  (9, 'thiet_bi', 'Với thiết bị đang quay hoặc nóng (thùng sấy, thùng tạo hạt, quạt, băng tải, lò đốt):', '["Có thể chạm vào khi đang chạy nếu đeo găng","Giữ khoảng cách, không chạm, không đứng gần bộ phận quay/bề mặt nóng, không mở nắp che chắn","Leo lên băng tải để đi tắt","Lau chùi khi máy đang chạy"]', 9),
  (10, 'thiet_bi', 'Khi thấy tình huống nguy hiểm hoặc sự cố, bạn nên:', '["Im lặng vì không phải việc của mình","Báo ngay cho người phụ trách và dùng nút dừng khẩn cấp nếu được hướng dẫn và an toàn để thực hiện","Tự sửa chữa","Chụp ảnh gửi mạng xã hội"]', 10)
  on conflict do nothing;
insert into public.hse_induction_key (question_id, answer) values (1, 1), (2, 1), (3, 1), (4, 0), (5, 1), (6, 1), (7, 1), (8, 1), (9, 1), (10, 1) on conflict do nothing;
