-- =============================================
-- CHAT HISTORY TABLE
-- =============================================
-- Execute this in your Supabase SQL Editor

-- Tabela principal de histórico de chat
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    session_id UUID DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    route VARCHAR(50), -- MARKETING, COMPRA, ESTOQUE, etc.
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON chat_history(created_at DESC);

-- Índice composto para busca rápida
CREATE INDEX IF NOT EXISTS idx_chat_user_session ON chat_history(user_id, session_id, created_at DESC);

-- =============================================
-- ALERTS QUEUE TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS alerts_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    sku VARCHAR(100),
    nome TEXT,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user_unread ON alerts_queue(user_id, read) WHERE read = FALSE;

-- =============================================
-- WORKFLOW METRICS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS workflow_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workflow_name VARCHAR(100) NOT NULL,
    route VARCHAR(50),
    user_id UUID,
    duration_ms INTEGER,
    tokens_used INTEGER,
    llm_provider VARCHAR(50),
    success BOOLEAN,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metrics_workflow ON workflow_metrics(workflow_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_user ON workflow_metrics(user_id, created_at DESC);

-- =============================================
-- VIEW: Workflow Stats (últimos 30 dias)
-- =============================================

CREATE OR REPLACE VIEW v_workflow_stats AS
SELECT 
    workflow_name,
    route,
    COUNT(*) as total_executions,
    AVG(duration_ms)::INTEGER as avg_duration_ms,
    SUM(tokens_used) as total_tokens,
    ROUND((SUM(CASE WHEN success THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100), 2) as success_rate,
    DATE_TRUNC('day', created_at) as date
FROM workflow_metrics
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY workflow_name, route, DATE_TRUNC('day', created_at)
ORDER BY date DESC;
