-- 밥 코딩 공유 노트: 공개 읽기 + 비밀 링크 편집
create extension if not exists pgcrypto;

create table if not exists public.workspace_config (
  id integer primary key default 1 check (id = 1),
  edit_key text not null default encode(gen_random_bytes(24), 'hex')
);

insert into public.workspace_config (id)
values (1)
on conflict (id) do nothing;

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content jsonb,
  owner_email text not null default '링크 사용자',
  updated_at timestamptz not null default now(),
  updated_by_email text,
  sort_key bigint not null default (extract(epoch from now()) * 1000)::bigint
);

alter table public.workspace_config enable row level security;
alter table public.notes enable row level security;

revoke all on public.workspace_config from anon, authenticated;
grant select, insert, update, delete on public.notes to anon, authenticated;

create or replace function public.has_edit_key()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_config
    where id = 1
      and edit_key = coalesce(
        (current_setting('request.headers', true)::json ->> 'x-edit-key'),
        ''
      )
  );
$$;

revoke all on function public.has_edit_key() from public;
grant execute on function public.has_edit_key() to anon, authenticated;

drop policy if exists "누구나 읽기" on public.notes;
create policy "누구나 읽기" on public.notes
  for select to anon, authenticated using (true);

drop policy if exists "편집 링크로 추가" on public.notes;
create policy "편집 링크로 추가" on public.notes
  for insert to anon, authenticated with check (public.has_edit_key());

drop policy if exists "편집 링크로 수정" on public.notes;
create policy "편집 링크로 수정" on public.notes
  for update to anon, authenticated
  using (public.has_edit_key())
  with check (public.has_edit_key());

drop policy if exists "편집 링크로 삭제" on public.notes;
create policy "편집 링크로 삭제" on public.notes
  for delete to anon, authenticated using (public.has_edit_key());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notes'
  ) then
    alter publication supabase_realtime add table public.notes;
  end if;
end
$$;

-- SQL Editor에서만 확인하고 외부에 공개하지 마세요.
select edit_key as "비밀_편집키_복사"
from public.workspace_config
where id = 1;
