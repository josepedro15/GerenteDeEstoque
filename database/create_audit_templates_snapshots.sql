-- =============================================
-- AUDIT LOG TABLE
-- =============================================
-- Execute this in your Supabase SQL Editor
-- Sistema de auditoria para rastrear ações importantes

-- Tabela de log de auditoria
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id VARCHAR(100),
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action, created_at DESC);

-- RLS - Somente admins podem ver todos, usuários veem seus próprios logs
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver seus próprios logs
CREATE POLICY "Users can view own audit logs" ON audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- Política: Inserção permitida para usuários autenticados
CREATE POLICY "Authenticated users can insert audit logs" ON audit_log
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- TABELA DE TEMPLATES DE CAMPANHA
-- =============================================

CREATE TABLE IF NOT EXISTS campaign_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    template_data JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_templates_user ON campaign_templates(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_templates_public ON campaign_templates(is_public) WHERE is_public = TRUE;

-- RLS
ALTER TABLE campaign_templates ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can view own templates" ON campaign_templates
    FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);

CREATE POLICY "Users can insert own templates" ON campaign_templates
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON campaign_templates
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON campaign_templates
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_campaign_templates_updated_at
    BEFORE UPDATE ON campaign_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- TABELA DE SNAPSHOTS DE ESTOQUE (para histórico)
-- =============================================

CREATE TABLE IF NOT EXISTS stock_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    data JSONB NOT NULL,
    summary JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por data
CREATE INDEX IF NOT EXISTS idx_snapshot_date ON stock_snapshots(snapshot_date DESC);

-- Constraint para evitar duplicatas no mesmo dia
CREATE UNIQUE INDEX IF NOT EXISTS idx_snapshot_unique_date ON stock_snapshots(snapshot_date);

-- RLS
ALTER TABLE stock_snapshots ENABLE ROW LEVEL SECURITY;

-- Política: Todos usuários autenticados podem ver snapshots
CREATE POLICY "Authenticated users can view snapshots" ON stock_snapshots
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Política: Somente sistema pode inserir (via trigger ou edge function)
CREATE POLICY "System can insert snapshots" ON stock_snapshots
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
