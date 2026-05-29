alter table public.subscriptions enable row level security;

create policy "allow all reads"
on public.subscriptions
for select
using (true);

create policy "allow all writes"
on public.subscriptions
for insert
with check (true);
