-- =============================================================
-- Migrasi 0007: lacak perubahan manual timer user
-- Cara pakai: SQL Editor → New query → tempel → Run.
-- Aturan "terbaru menang": preset konselor dipakai bila
-- followups.created_at lebih baru dari user_settings.updated_at.
-- =============================================================

alter table public.user_settings
  add column if not exists updated_at timestamptz not null default now();
