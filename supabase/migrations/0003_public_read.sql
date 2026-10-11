-- =============================================================
-- Migrasi 0003: baca publik untuk daftar konselor + rating
-- Cara pakai: SQL Editor → New query → tempel → Run.
-- - Profil role konselor/admin boleh dibaca publik (tanpa email;
--   email tidak tersimpan di tabel profiles).
-- - Rating boleh dibaca publik (tanpa data pribadi, hanya bintang).
-- =============================================================

create policy "profiles_public_staff" on public.profiles for select
  using (role in ('konselor', 'admin'));

create policy "ratings_public_read" on public.ratings for select
  using (true);
