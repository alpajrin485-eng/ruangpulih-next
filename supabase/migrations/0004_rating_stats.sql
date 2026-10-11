-- =============================================================
-- Migrasi 0004: statistik rating per konselor (agregat aman)
-- Cara pakai: SQL Editor → New query → tempel → Run.
-- Fungsi SECURITY DEFINER: mengembalikan rata-rata + jumlah rating
-- per konselor TANPA membuka isi sesi/pesan (tetap terkunci RLS).
-- =============================================================

create or replace function public.counselor_rating_stats()
returns table (counselor_id uuid, avg numeric, n bigint)
language sql stable security definer set search_path = public as $$
  select s.counselor_id, round(avg(r.bintang)::numeric, 1), count(*)
  from public.ratings r
  join public.sessions s on s.id = r.session_id
  group by s.counselor_id;
$$;

grant execute on function public.counselor_rating_stats() to anon, authenticated;
