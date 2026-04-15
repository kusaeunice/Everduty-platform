-- EverDuty Agency Support - Run in Supabase SQL Editor

CREATE TABLE agencies (
  id TEXT PRIMARY KEY,
  owner_id TEXT DEFAULT '',
  name TEXT NOT NULL,
  logo_url TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  description TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  postcode TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  commission_rate NUMERIC DEFAULT 15,
  subscription_plan TEXT DEFAULT 'basic',
  worker_pool_count INTEGER DEFAULT 0,
  active_shifts INTEGER DEFAULT 0,
  total_placements INTEGER DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT ''
);
ALTER TABLE agencies DISABLE ROW LEVEL SECURITY;

ALTER TABLE shifts ADD COLUMN IF NOT EXISTS agency_id TEXT DEFAULT '';
ALTER TABLE permanent_jobs ADD COLUMN IF NOT EXISTS agency_id TEXT DEFAULT '';
ALTER TABLE worker_profiles ADD COLUMN IF NOT EXISTS agency_id TEXT DEFAULT '';
ALTER TABLE freelancer_services ADD COLUMN IF NOT EXISTS agency_id TEXT DEFAULT '';

CREATE INDEX idx_agencies_owner ON agencies(owner_id);
CREATE INDEX idx_agencies_status ON agencies(status);
CREATE INDEX idx_shifts_agency ON shifts(agency_id);
CREATE INDEX idx_perm_jobs_agency ON permanent_jobs(agency_id);
CREATE INDEX idx_worker_profiles_agency ON worker_profiles(agency_id);
