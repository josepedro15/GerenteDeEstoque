-- Create table for user settings
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY DEFAULT auth.uid(),
    phone_primary TEXT,
    phone_secondary TEXT,
    notification_preferences JSONB DEFAULT '{"critical_rupture": true, "daily_briefing": true, "weekly_burn": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to select their own settings
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to update their own settings
CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own settings
CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);
