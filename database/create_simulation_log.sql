-- Create table for simulation logs
CREATE TABLE IF NOT EXISTS simulation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID DEFAULT auth.uid(),
    input_payload JSONB NOT NULL,
    output_result JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE simulation_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own logs
CREATE POLICY "Users can view their own simulations" ON simulation_log
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own logs
CREATE POLICY "Users can insert their own simulations" ON simulation_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);
