-- =============================================================
-- Migrasi 0002: kunci peran saat signup (anti-forgery metadata)
-- Cara pakai: SQL Editor → New query → tempel → Run.
-- Trigger handle_new_user SELALU membuat role='user', status='aktif'
-- apa pun isi user_metadata (role admin/konselor hanya via dashboard/seed).
-- =============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, nama, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'nama', split_part(new.email, '@', 1)),
    'user',
    'aktif'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
