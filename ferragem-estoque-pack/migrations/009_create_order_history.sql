create table if not exists order_history (
  id uuid default gen_random_uuid() primary key,
  supplier_name text not null,
  total_value numeric not null,
  items_json jsonb not null,
  lead_time int,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table order_history enable row level security;

-- Policy to allow authenticated users to do everything (simple for now)
create policy "Enable all for authenticated users" on order_history
  for all using (auth.role() = 'authenticated');
