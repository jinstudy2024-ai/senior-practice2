-- ============================================================
-- 시니어 취업 매칭 플랫폼 schema
-- Supabase SQL Editor 에 통째로 붙여넣고 Run 하세요.
-- ============================================================

-- 0) 확장
create extension if not exists "pgcrypto";

-- 1) profiles (auth.users 1:1, role 보관)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('senior','admin')),
  created_at timestamptz not null default now()
);

-- auth.users 가입 시 profiles 자동 생성 (role 은 기본 senior, signup 직후 업데이트)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'senior')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) seniors (시니어 이력서)
create table if not exists public.seniors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null,
  age int not null check (age between 40 and 100),
  region text not null,
  job_category text not null,
  years_experience int not null check (years_experience >= 0),
  resume_url text,
  created_at timestamptz not null default now()
);

create index if not exists seniors_region_idx on public.seniors(region);
create index if not exists seniors_category_idx on public.seniors(job_category);

-- 3) jobs (담당자가 등록하는 일자리)
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  region text not null,
  job_category text not null,
  required_experience int not null default 0 check (required_experience >= 0),
  salary text,
  deadline date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists jobs_region_idx on public.jobs(region);
create index if not exists jobs_category_idx on public.jobs(job_category);

-- 4) matches (자동 매칭 결과)
create table if not exists public.matches (
  senior_id uuid not null references public.seniors(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  score int not null,
  created_at timestamptz not null default now(),
  primary key (senior_id, job_id)
);

create index if not exists matches_score_idx on public.matches(senior_id, score desc);

-- 5) applications (시니어가 지원)
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  senior_id uuid not null references public.seniors(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  status text not null default 'submitted' check (status in ('submitted','reviewing','accepted','rejected')),
  applied_at timestamptz not null default now(),
  unique (senior_id, job_id)
);

create index if not exists applications_senior_idx on public.applications(senior_id);
create index if not exists applications_job_idx on public.applications(job_id);

-- 6) 매칭 RPC : 지역+3 / 직종+2 / 경력 충족+1
create or replace function public.run_matching(p_senior_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_region text;
  v_category text;
  v_years int;
begin
  select region, job_category, years_experience
    into v_region, v_category, v_years
    from public.seniors
    where id = p_senior_id;

  if v_region is null then
    raise exception 'senior not found: %', p_senior_id;
  end if;

  delete from public.matches where senior_id = p_senior_id;

  insert into public.matches (senior_id, job_id, score)
  select
    p_senior_id,
    j.id,
    (case when j.region = v_region then 3 else 0 end)
    + (case when j.job_category = v_category then 2 else 0 end)
    + (case when v_years >= j.required_experience then 1 else 0 end) as score
  from public.jobs j
  where (case when j.region = v_region then 3 else 0 end)
      + (case when j.job_category = v_category then 2 else 0 end)
      + (case when v_years >= j.required_experience then 1 else 0 end) > 0;
end;
$$;

-- 7) 관리자 KPI 뷰
create or replace view public.admin_kpi as
select
  (select count(*) from public.seniors)              as senior_count,
  (select count(*) from public.jobs)                 as job_count,
  (select count(*) from public.applications)         as application_count;

-- ============================================================
-- 8) RLS 정책
-- ============================================================
alter table public.profiles     enable row level security;
alter table public.seniors      enable row level security;
alter table public.jobs         enable row level security;
alter table public.matches      enable row level security;
alter table public.applications enable row level security;

-- helper
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable
as $$ select exists(select 1 from public.profiles where id = uid and role = 'admin') $$;

-- profiles: 본인 read/update, admin 전체 read
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
  for select using (auth.uid() = id or public.is_admin(auth.uid()));

drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id);

-- seniors: 본인 CRUD + admin read
drop policy if exists seniors_owner_all on public.seniors;
create policy seniors_owner_all on public.seniors
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists seniors_admin_read on public.seniors;
create policy seniors_admin_read on public.seniors
  for select using (public.is_admin(auth.uid()));

-- jobs: 모두 read, admin 만 write
drop policy if exists jobs_public_read on public.jobs;
create policy jobs_public_read on public.jobs
  for select using (true);

drop policy if exists jobs_admin_write on public.jobs;
create policy jobs_admin_write on public.jobs
  for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- matches: 본인 read + admin read, 본인 write (RPC 가 본인 것만 만듦)
drop policy if exists matches_owner_read on public.matches;
create policy matches_owner_read on public.matches
  for select using (
    exists(select 1 from public.seniors s where s.id = senior_id and s.user_id = auth.uid())
    or public.is_admin(auth.uid())
  );

drop policy if exists matches_owner_write on public.matches;
create policy matches_owner_write on public.matches
  for all using (
    exists(select 1 from public.seniors s where s.id = senior_id and s.user_id = auth.uid())
  ) with check (
    exists(select 1 from public.seniors s where s.id = senior_id and s.user_id = auth.uid())
  );

-- applications: 본인 CRUD + admin read
drop policy if exists applications_owner_all on public.applications;
create policy applications_owner_all on public.applications
  for all using (
    exists(select 1 from public.seniors s where s.id = senior_id and s.user_id = auth.uid())
  ) with check (
    exists(select 1 from public.seniors s where s.id = senior_id and s.user_id = auth.uid())
  );

drop policy if exists applications_admin_read on public.applications;
create policy applications_admin_read on public.applications
  for select using (public.is_admin(auth.uid()));

-- ============================================================
-- 9) Storage : resumes 버킷 (PDF, 5MB)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', true)
on conflict (id) do nothing;

drop policy if exists "resumes_owner_write" on storage.objects;
create policy "resumes_owner_write" on storage.objects
  for insert with check (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes_owner_update" on storage.objects;
create policy "resumes_owner_update" on storage.objects
  for update using (
    bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "resumes_public_read" on storage.objects;
create policy "resumes_public_read" on storage.objects
  for select using (bucket_id = 'resumes');

-- ============================================================
-- 10) 샘플 일자리 10건 (지역 / 직종 골고루)
-- ============================================================
insert into public.jobs (company, region, job_category, required_experience, salary, deadline)
values
  ('서울시 어르신 일자리센터', '서울', '경비',     2, '월 220만원', current_date + 30),
  ('한강공원 환경관리단',     '서울', '환경미화', 0, '월 180만원', current_date + 30),
  ('경기도 시니어클럽',       '경기', '사무보조', 1, '월 200만원', current_date + 25),
  ('수원시청 민원안내',       '경기', '민원안내', 1, '월 195만원', current_date + 20),
  ('부산항만공사',            '부산', '경비',     3, '월 250만원', current_date + 30),
  ('인천공항 카트관리',       '인천', '환경미화', 0, '월 200만원', current_date + 15),
  ('대전 시니어 컨설팅',     '대전', '컨설팅',   10,'월 350만원', current_date + 40),
  ('대구 도서관 사서보조',   '대구', '사무보조', 0, '월 175만원', current_date + 20),
  ('광주 어린이도서관',       '광주', '교육보조', 2, '월 190만원', current_date + 25),
  ('울산 산업단지 안전관리', '울산', '안전관리', 5, '월 280만원', current_date + 35)
on conflict do nothing;
