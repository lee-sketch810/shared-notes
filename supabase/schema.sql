-- ============================================================
-- 우리 노트 (shared-notes) Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 Run 하세요.
-- ============================================================

-- 1) 테이블
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  content jsonb,
  owner_id uuid not null references auth.users (id) on delete cascade,
  owner_email text not null,
  updated_at timestamptz not null default now(),
  updated_by_email text,
  -- 사이드바 고정 순서 (작을수록 위). 새 노트는 생성 시각(ms)으로 맨 아래에 붙는다
  sort_key bigint not null default (extract(epoch from now()) * 1000)::bigint
);

create table if not exists public.note_shares (
  note_id uuid not null references public.notes (id) on delete cascade,
  email text not null,
  primary key (note_id, email)
);

-- 2) RLS 활성화
alter table public.notes enable row level security;
alter table public.note_shares enable row level security;

-- 3) 헬퍼 함수 (security definer — RLS 순환 참조 방지)
create or replace function public.is_note_owner(nid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from notes n
    where n.id = nid and n.owner_id = auth.uid()
  );
$$;

create or replace function public.current_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

-- 4) notes 정책: 소유자 또는 공유받은 사람만 접근
drop policy if exists "notes_select" on public.notes;
create policy "notes_select" on public.notes
  for select using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.note_shares s
      where s.note_id = id and s.email = public.current_email()
    )
  );

drop policy if exists "notes_insert" on public.notes;
create policy "notes_insert" on public.notes
  for insert with check (owner_id = auth.uid());

drop policy if exists "notes_update" on public.notes;
create policy "notes_update" on public.notes
  for update using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.note_shares s
      where s.note_id = id and s.email = public.current_email()
    )
  );

drop policy if exists "notes_delete" on public.notes;
create policy "notes_delete" on public.notes
  for delete using (owner_id = auth.uid());

-- 5) note_shares 정책: 소유자는 관리, 공유받은 사람은 조회
--    (notes 참조는 security definer 함수를 거쳐 RLS 순환을 끊는다)
drop policy if exists "shares_select" on public.note_shares;
create policy "shares_select" on public.note_shares
  for select using (
    email = public.current_email() or public.is_note_owner(note_id)
  );

drop policy if exists "shares_insert" on public.note_shares;
create policy "shares_insert" on public.note_shares
  for insert with check (public.is_note_owner(note_id));

drop policy if exists "shares_delete" on public.note_shares;
create policy "shares_delete" on public.note_shares
  for delete using (public.is_note_owner(note_id));

-- 6) Realtime 발행 (다른 사람의 저장을 실시간 감지)
alter publication supabase_realtime add table public.notes;
alter publication supabase_realtime add table public.note_shares;
