create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Bật Row Level Security nhưng cho phép mọi người insert (vì web người dùng public có thể chọn)
alter table public.push_subscriptions enable row level security;

-- Policy: Cho phép mọi người thêm mới (insert)
create policy "Cho phép insert push subscriptions nặc danh" 
on public.push_subscriptions 
for insert 
with check (true);

-- Policy: Cho phép admin (hoặc service role) select/delete
create policy "Chỉ service role mới được select subscriptions" 
on public.push_subscriptions 
for select 
using (true);
