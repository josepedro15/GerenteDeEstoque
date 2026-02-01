-- Criação da tabela de mensagens para histórico do chat
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  session_id text not null,
  role text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criação de índice para busca rápida por sessão
create index if not exists messages_session_id_idx on messages(session_id);
