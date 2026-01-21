-- Execute this in the Supabase SQL Editor

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    branch TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false,
    is_blocked BOOLEAN DEFAULT false,
    pin TEXT NOT NULL,
    failed_attempts INTEGER DEFAULT 0,
    last_login TIMESTAMP WITH TIME ZONE,
    balances JSONB NOT NULL,
    must_change_pin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Leave Requests Table
CREATE TABLE IF NOT EXISTS leave_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    user_name TEXT,
    user_role TEXT,
    department TEXT,
    branch TEXT,
    type TEXT,
    dates JSONB NOT NULL,
    start_date DATE,
    end_date DATE,
    reason TEXT,
    status TEXT DEFAULT 'Pending',
    manager_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    performed_by TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details TEXT
);

-- 4. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. PIN Reset Requests
CREATE TABLE IF NOT EXISTS reset_requests (
    id TEXT PRIMARY KEY,
    user_name TEXT,
    department TEXT,
    status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Admin (Optional, but helpful for first login)
-- Note: Replace the PIN with a hashed version or 1234 for testing
-- INSERT INTO users (id, name, role, department, branch, is_active, is_approved, pin, balances)
-- VALUES ('admin-init', 'CBL Chief Admin', 'SUPER_ADMIN', 'Management', 'GODOWN HQ', true, true, '1234', '{"Annual Leave": 21, "Sick Leave": 15, "Maternity Leave": 90, "Paternity Leave": 14}');
