-- ====================================================================
-- SMART WORKPLACE & EMPLOYEE ACTIVITY MONITORING SYSTEM
-- Supabase PostgreSQL Database Schema (Updated with Minutes Support)
-- ====================================================================

-- 1. Create Users Table (Stores custom User IDs and Hashed Passwords)
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
    department TEXT DEFAULT 'Engineering',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Attendance Table (Auto-marked upon login)
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMPTZ DEFAULT now(),
    check_out_time TIMESTAMPTZ,
    status TEXT DEFAULT 'Present' CHECK (status IN ('Present', 'Late', 'Half Day', 'Absent')),
    total_active_seconds INT DEFAULT 0,
    total_idle_seconds NUMERIC(10,2) DEFAULT 0, -- Stored in minutes
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, date)
);

-- 3. Create Idle & Break Logs Table (10-second inactivity lock screen records)
-- Stores duration in MINUTES (e.g. 1.5, 2.0, 10.0 mins)
CREATE TABLE IF NOT EXISTS idle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_seconds NUMERIC(10,2) NOT NULL, -- Stored in MINUTES
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create Activity & Visited Websites/Apps Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES app_users(user_id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL DEFAULT 'window_active',
    title TEXT NOT NULL,
    url_or_app TEXT,
    category TEXT DEFAULT 'Productive' CHECK (category IN ('Productive', 'Entertainment', 'Gaming', 'Social Media', 'Communication', 'Break', 'Unproductive')),
    duration_seconds NUMERIC(10,2) DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 5. Full Public Permissions for 'anon' and 'authenticated'
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 6. Disable RLS for smooth client saving
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE idle_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- 7. If tables already exist, alter column types to NUMERIC to support minutes decimals:
ALTER TABLE idle_logs ALTER COLUMN duration_seconds TYPE NUMERIC(10,2);
ALTER TABLE attendance ALTER COLUMN total_idle_seconds TYPE NUMERIC(10,2);
