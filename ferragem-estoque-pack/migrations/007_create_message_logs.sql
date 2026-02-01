-- Create table for message history logging
create table if not exists historico_mensagens (
    id uuid default gen_random_uuid() primary key,
    content text,
    type text default 'text', -- 'text', 'image', 'video', 'document'
    media_url text,
    status text default 'sent',
    sent_at timestamptz default now(),
    channel text default 'whatsapp',
    metadata jsonb -- Store extra info like group_id, target_number, etc.
);

-- Add RLS policies (optional but recommended)
alter table historico_mensagens enable row level security;

create policy "Enable read access for authenticated users"
on historico_mensagens for select
to authenticated
using (true);

create policy "Enable insert access for authenticated users"
on historico_mensagens for insert
to authenticated
with check (true);
