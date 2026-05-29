alter table public.subscriptions enable row level security;

create policy "users can read their subscriptions"
on public.subscriptions
for select
using (auth.uid() = user_id);

create policy "users can insert their subscriptions"
on public.subscriptions
for insert
with check (auth.uid() = user_id);
