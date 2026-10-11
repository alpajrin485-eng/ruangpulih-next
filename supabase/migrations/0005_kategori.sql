-- =============================================================
-- Migrasi 0005: kategori soal kuis + backfill
-- Cara pakai: SQL Editor → New query → tempel → Run.
-- Kategori dipakai statistik 4 kategori di overview admin:
-- prokrastinasi / burnout / stres / istirahat.
-- =============================================================

alter table public.questions
  add column if not exists kategori text not null default 'prokrastinasi'
  check (kategori in ('prokrastinasi','burnout','stres','istirahat'));

-- Backfill 5 soal bawaan berdasar urutan awal
with ranked as (
  select id, row_number() over (order by urutan) as rn
  from public.questions
)
update public.questions q
set kategori = case r.rn
  when 1 then 'prokrastinasi'
  when 2 then 'burnout'
  when 3 then 'stres'
  when 4 then 'prokrastinasi'
  when 5 then 'istirahat'
  else 'prokrastinasi'
end
from ranked r where r.id = q.id and r.rn <= 5;
