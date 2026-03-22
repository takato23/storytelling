alter table public.profiles
  alter column free_preview_credits set default 2;

update public.profiles
set free_preview_credits = 2
where free_preview_credits < 2;
