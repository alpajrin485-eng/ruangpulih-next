-- =============================================================
-- Migrasi 0006: tambah created_at di followups
-- Cara pakai: SQL Editor → New query → tempel → Run.
-- Wajib: halaman Teman Belajar mengurutkan followup terbaru
-- (tanpa kolom ini Blok B konselor gagal dimuat).
-- =============================================================

alter table public.followups
  add column if not exists created_at timestamptz not null default now();
