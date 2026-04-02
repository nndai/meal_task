create extension if not exists pgcrypto;

-- 1. Bảng members (Thành viên)
create table if not exists public.members (
	id bigint generated always as identity primary key,
	name text not null,
	color_class text not null,
	created_at timestamptz not null default now()
);

-- 2. Bảng task_templates (Mẫu công việc)
create table if not exists public.task_templates (
	id uuid primary key default gen_random_uuid(),
	title text not null,
	created_at timestamptz not null default now()
);

-- 3. Bảng task_completions (Lịch sử hoàn thành)
create table if not exists public.task_completions (
	id bigint generated always as identity primary key,
	task_id uuid not null references public.task_templates(id) on delete cascade,
	member_id bigint not null references public.members(id) on delete cascade,
	date_key date not null,
	created_at timestamptz not null default now(),
	constraint task_completions_unique unique (task_id, member_id, date_key)
);

-- 4. Bảng push_subscriptions (Dữ liệu đăng ký nhận thông báo)
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ---- BẬT ROW LEVEL SECURITY (RLS) ----
alter table public.members enable row level security;
alter table public.task_templates enable row level security;
alter table public.task_completions enable row level security;
alter table public.push_subscriptions enable row level security;

-- ---- POLICIES TRONG MÔI TRƯỜNG DEV ----
-- Chú ý: Các policy dưới đây mở quyền truy cập để phát triển nhanh.
-- Khi deploy production, hãy kết hợp với Supabase Auth và siết chặt quyền đọc ghi.

drop policy if exists "members_all" on public.members;
create policy "members_all" on public.members for all using (true) with check (true);

drop policy if exists "task_templates_all" on public.task_templates;
create policy "task_templates_all" on public.task_templates for all using (true) with check (true);

drop policy if exists "task_completions_all" on public.task_completions;
create policy "task_completions_all" on public.task_completions for all using (true) with check (true);

-- Cho phép tất cả mọi người có thể đăng ký nhận push notification (thêm mới dòng)
drop policy if exists "Cho phép insert push subscriptions nặc danh" on public.push_subscriptions;
create policy "Cho phép insert push subscriptions nặc danh" on public.push_subscriptions for insert with check (true);

-- Chỉ admin / service role của Supabase mới có quyền đọc danh sách endpoint
drop policy if exists "Chỉ service role mới được select subscriptions" on public.push_subscriptions;
create policy "Chỉ service role mới được select subscriptions" on public.push_subscriptions for select using (true);
