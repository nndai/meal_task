## Meal Task

Ung dung quan ly viec nha theo ngay:

- Muc Quan ly tao danh sach task mau.
- Moi ngay tu dong co day du tat ca task mau.
- Moi lan tick se luu theo bo ba: `ngay + task + thanh vien`.

## Chay local

```bash
npm install
npm run dev
```

## Cau hinh Supabase

Tao file `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## SQL can chay trong Supabase

Chay toan bo script duoi day trong SQL Editor:

```sql
create extension if not exists pgcrypto;

create table if not exists public.members (
	id bigint generated always as identity primary key,
	name text not null,
	color_class text not null,
	created_at timestamptz not null default now()
);

create table if not exists public.task_templates (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	created_at timestamptz not null default now()
);

create table if not exists public.task_completions (
	id bigint generated always as identity primary key,
	task_id uuid not null references public.task_templates(id) on delete cascade,
	member_id bigint not null references public.members(id) on delete cascade,
	date_key date not null,
	created_at timestamptz not null default now(),
	constraint task_completions_unique unique (task_id, member_id, date_key)
);

alter table public.members enable row level security;
alter table public.task_templates enable row level security;
alter table public.task_completions enable row level security;

drop policy if exists "members_all" on public.members;
create policy "members_all" on public.members
for all using (true) with check (true);

drop policy if exists "task_templates_all" on public.task_templates;
create policy "task_templates_all" on public.task_templates
for all using (true) with check (true);

drop policy if exists "task_completions_all" on public.task_completions;
create policy "task_completions_all" on public.task_completions
for all using (true) with check (true);
```

Luu y:

- Policy tren de mo de dev nhanh voi anon key.
- Khi deploy production, nen bo sung auth va viet policy chat hon.
