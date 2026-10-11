-- =============================================================
-- RuangPulih Next.js — Migrasi 0001: skema + RLS + Storage
-- Cara pakai: Supabase Dashboard → SQL Editor → New query →
-- tempel seluruh file ini → Run.
-- Urutan: tabel dulu, lalu fungsi, lalu RLS (jangan diacak).
-- =============================================================

-- ---------- Tabel ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  nama text,
  role text not null default 'user' check (role in ('user','konselor','admin')),
  status text not null default 'aktif' check (status in ('aktif','diperingatkan','dibanned')),
  banned_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.counselors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references public.profiles(id) on delete cascade,
  spesialisasi text,
  foto_url text,
  bio text,
  aktif boolean not null default true
);

create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skor int not null,
  tanggal timestamptz not null default now(),
  menonton boolean not null default false
);

create table if not exists public.refleksi_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  j1 int not null, j2 int not null, j3 int not null, j4 int not null,
  skor int not null,
  tanggal timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  options jsonb not null,
  answer int not null,
  explanation text not null,
  urutan int not null default 0,
  aktif boolean not null default true
);

create table if not exists public.materi (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  judul text not null,
  intro text,
  isi text not null,
  urutan int not null default 0,
  aktif boolean not null default true
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  tipe text not null check (tipe in ('edukasi','motivasi')),
  kind text not null check (kind in ('file','youtube')),
  src text not null,
  aktif boolean not null default true
);

create table if not exists public.study_materials (
  id uuid primary key default gen_random_uuid(),
  judul text not null,
  deskripsi text,
  link text,
  urutan int not null default 0,
  aktif boolean not null default true
);

create table if not exists public.carousel (
  id uuid primary key default gen_random_uuid(),
  foto_url text not null,
  caption text,
  urutan int not null default 0,
  aktif boolean not null default true
);

create table if not exists public.settings (
  key text primary key,
  value text
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  counselor_id uuid not null references public.counselors(id) on delete cascade,
  keluhan text,
  status text not null default 'menunggu'
    check (status in ('menunggu','diterima','ditolak','selesai')),
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  isi text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid unique not null references public.sessions(id) on delete cascade,
  bintang int not null check (bintang between 1 and 5),
  ulasan text,
  created_at timestamptz not null default now()
);

create table if not exists public.followups (
  id uuid primary key default gen_random_uuid(),
  session_id uuid unique not null references public.sessions(id) on delete cascade,
  materi_custom text,
  plan text,
  focus_minutes int,
  rest_minutes int,
  sudah_diisi boolean not null default false,
  selesai_oleh_user boolean not null default false
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  pelapor_id uuid not null references public.profiles(id) on delete cascade,
  terlapor_id uuid not null references public.profiles(id) on delete cascade,
  session_id uuid references public.sessions(id) on delete set null,
  arah text not null check (arah in ('konselor_ke_user','user_ke_konselor')),
  kategori text not null,
  bukti text,
  status text not null default 'menunggu'
    check (status in ('menunggu','diproses','terbukti','tidak')),
  keputusan text,
  diputus_oleh uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.warnings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  teks text not null,
  report_id uuid references public.reports(id) on delete set null,
  ke_berapa int not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  focus_minutes int not null default 25,
  rest_minutes int not null default 5
);

-- ---------- Trigger: profil otomatis saat signup ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, nama)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- Helper role (SECURITY DEFINER, anti-rekursi) ----------
-- Ditaruh SETELAH tabel dibuat (Postgres memvalidasi isi fungsi saat dibuat).
create or replace function public.my_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.my_status()
returns text language sql stable security definer set search_path = public as $$
  select status from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.counselors enable row level security;
alter table public.quiz_results enable row level security;
alter table public.refleksi_results enable row level security;
alter table public.questions enable row level security;
alter table public.materi enable row level security;
alter table public.videos enable row level security;
alter table public.study_materials enable row level security;
alter table public.carousel enable row level security;
alter table public.settings enable row level security;
alter table public.sessions enable row level security;
alter table public.messages enable row level security;
alter table public.ratings enable row level security;
alter table public.followups enable row level security;
alter table public.reports enable row level security;
alter table public.warnings enable row level security;
alter table public.user_settings enable row level security;

-- profiles
create policy "profiles_select_own_admin" on public.profiles for select
  using (id = auth.uid() or public.is_admin());
create policy "profiles_insert_own" on public.profiles for insert
  with check (id = auth.uid());
create policy "profiles_update_own_locked_role" on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid() and role = public.my_role() and status = public.my_status());
create policy "profiles_admin_all" on public.profiles for all
  using (public.is_admin()) with check (public.is_admin());

-- konten publik (baca yang aktif)
create policy "questions_public" on public.questions for select using (aktif = true);
create policy "materi_public" on public.materi for select using (aktif = true);
create policy "videos_public" on public.videos for select using (aktif = true);
create policy "study_public" on public.study_materials for select using (aktif = true);
create policy "carousel_public" on public.carousel for select using (aktif = true);
create policy "settings_public" on public.settings for select using (true);
create policy "counselors_public" on public.counselors for select using (aktif = true);
create policy "content_admin_all_questions" on public.questions for all
  using (public.is_admin()) with check (public.is_admin());
create policy "content_admin_all_materi" on public.materi for all
  using (public.is_admin()) with check (public.is_admin());
create policy "content_admin_all_videos" on public.videos for all
  using (public.is_admin()) with check (public.is_admin());
create policy "content_admin_all_study" on public.study_materials for all
  using (public.is_admin()) with check (public.is_admin());
create policy "content_admin_all_carousel" on public.carousel for all
  using (public.is_admin()) with check (public.is_admin());
create policy "content_admin_all_settings" on public.settings for all
  using (public.is_admin()) with check (public.is_admin());
create policy "content_admin_all_counselors" on public.counselors for all
  using (public.is_admin()) with check (public.is_admin());

-- hasil milik sendiri
create policy "quiz_own" on public.quiz_results for select
  using (user_id = auth.uid() or public.is_admin());
create policy "quiz_insert_own" on public.quiz_results for insert
  with check (user_id = auth.uid());
create policy "quiz_update_own" on public.quiz_results for update
  using (user_id = auth.uid() or public.is_admin());
create policy "refleksi_own" on public.refleksi_results for select
  using (user_id = auth.uid() or public.is_admin());
create policy "refleksi_insert_own" on public.refleksi_results for insert
  with check (user_id = auth.uid());
create policy "usettings_own" on public.user_settings for select
  using (user_id = auth.uid() or public.is_admin());
create policy "usettings_upsert_own" on public.user_settings for insert
  with check (user_id = auth.uid());
create policy "usettings_update_own" on public.user_settings for update
  using (user_id = auth.uid() or public.is_admin());

-- sesi konsultasi (peserta + admin)
create policy "sessions_participant" on public.sessions for select
  using (user_id = auth.uid()
    or exists (select 1 from public.counselors c where c.id = sessions.counselor_id and c.user_id = auth.uid())
    or public.is_admin());
create policy "sessions_insert_user" on public.sessions for insert
  with check (user_id = auth.uid());
create policy "sessions_update_participant" on public.sessions for update
  using (user_id = auth.uid()
    or exists (select 1 from public.counselors c where c.id = sessions.counselor_id and c.user_id = auth.uid())
    or public.is_admin());

create policy "messages_participant" on public.messages for select
  using (exists (select 1 from public.sessions s where s.id = messages.session_id
    and (s.user_id = auth.uid()
      or exists (select 1 from public.counselors c where c.id = s.counselor_id and c.user_id = auth.uid())))
    or public.is_admin());
create policy "messages_insert_participant" on public.messages for insert
  with check (sender_id = auth.uid() and exists (
    select 1 from public.sessions s where s.id = messages.session_id
    and (s.user_id = auth.uid()
      or exists (select 1 from public.counselors c where c.id = s.counselor_id and c.user_id = auth.uid()))));

create policy "ratings_read" on public.ratings for select
  using (exists (select 1 from public.sessions s where s.id = ratings.session_id
    and (s.user_id = auth.uid()
      or exists (select 1 from public.counselors c where c.id = s.counselor_id and c.user_id = auth.uid())))
    or public.is_admin());
create policy "ratings_insert_owner" on public.ratings for insert
  with check (exists (select 1 from public.sessions s where s.id = ratings.session_id
    and s.user_id = auth.uid() and s.status = 'selesai'));

create policy "followups_read" on public.followups for select
  using (exists (select 1 from public.sessions s where s.id = followups.session_id
    and (s.user_id = auth.uid()
      or exists (select 1 from public.counselors c where c.id = s.counselor_id and c.user_id = auth.uid())))
    or public.is_admin());
create policy "followups_write_counselor" on public.followups for insert
  with check (exists (select 1 from public.sessions s where s.id = followups.session_id
    and exists (select 1 from public.counselors c where c.id = s.counselor_id and c.user_id = auth.uid())));
create policy "followups_update_both" on public.followups for update
  using (exists (select 1 from public.sessions s where s.id = followups.session_id
    and (s.user_id = auth.uid()
      or exists (select 1 from public.counselors c where c.id = s.counselor_id and c.user_id = auth.uid())))
    or public.is_admin());

-- report & peringatan
create policy "reports_insert_auth" on public.reports for insert
  with check (pelapor_id = auth.uid());
create policy "reports_read_own_admin" on public.reports for select
  using (pelapor_id = auth.uid() or public.is_admin());
create policy "reports_admin_update" on public.reports for update
  using (public.is_admin());
create policy "warnings_read_own_admin" on public.warnings for select
  using (user_id = auth.uid() or public.is_admin());
create policy "warnings_admin_write" on public.warnings for insert
  with check (public.is_admin());

-- ---------- Storage buckets ----------
insert into storage.buckets (id, name, public)
values ('carousel', 'carousel', true),
       ('media', 'media', true),
       ('video', 'video', true)
on conflict (id) do nothing;

create policy "storage_public_read" on storage.objects for select
  using (bucket_id in ('carousel','media','video'));
create policy "storage_admin_write" on storage.objects for insert
  with check (bucket_id in ('carousel','media','video') and public.is_admin());
create policy "storage_admin_update" on storage.objects for update
  using (bucket_id in ('carousel','media','video') and public.is_admin());
create policy "storage_admin_delete" on storage.objects for delete
  using (bucket_id in ('carousel','media','video') and public.is_admin());
