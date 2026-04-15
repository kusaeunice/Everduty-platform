-- EverDuty COMPLETE Schema - Run in Supabase SQL Editor
-- This replaces the previous migration with full field coverage

DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS academy_subscriptions CASCADE;
DROP TABLE IF EXISTS academy_courses CASCADE;
DROP TABLE IF EXISTS referrals CASCADE;
DROP TABLE IF EXISTS visa_applications CASCADE;
DROP TABLE IF EXISTS timesheets CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS freelancer_bookings CASCADE;
DROP TABLE IF EXISTS freelancer_services CASCADE;
DROP TABLE IF EXISTS placement_applications CASCADE;
DROP TABLE IF EXISTS student_placements CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS permanent_jobs CASCADE;
DROP TABLE IF EXISTS shift_applications CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS employer_profiles CASCADE;
DROP TABLE IF EXISTS worker_profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'worker',
  phone TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  referral_code TEXT DEFAULT '',
  referred_by TEXT DEFAULT '',
  country TEXT DEFAULT 'GB',
  created_at TEXT DEFAULT '',
  updated_at TEXT DEFAULT ''
);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  owner_id TEXT DEFAULT '',
  name TEXT NOT NULL,
  industry TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  postcode TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  description TEXT DEFAULT '',
  country TEXT DEFAULT 'GB',
  org_type TEXT DEFAULT 'employer',
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT ''
);
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

CREATE TABLE worker_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE DEFAULT '',
  skills JSONB DEFAULT '[]',
  industries JSONB DEFAULT '[]',
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  hourly_rate NUMERIC DEFAULT 0,
  availability JSONB DEFAULT '{}',
  compliance_status TEXT DEFAULT 'pending',
  documents_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  shifts_completed INTEGER DEFAULT 0,
  is_freelancer BOOLEAN DEFAULT false,
  is_student BOOLEAN DEFAULT false,
  country TEXT DEFAULT 'GB',
  created_at TEXT DEFAULT '',
  updated_at TEXT DEFAULT ''
);
ALTER TABLE worker_profiles DISABLE ROW LEVEL SECURITY;

CREATE TABLE employer_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE DEFAULT '',
  organisation_id TEXT DEFAULT '',
  job_title TEXT DEFAULT '',
  department TEXT DEFAULT '',
  created_at TEXT DEFAULT ''
);
ALTER TABLE employer_profiles DISABLE ROW LEVEL SECURITY;

CREATE TABLE shifts (
  id TEXT PRIMARY KEY,
  employer_id TEXT DEFAULT '',
  employer_name TEXT DEFAULT '',
  title TEXT NOT NULL,
  industry TEXT DEFAULT '',
  role TEXT DEFAULT '',
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  date TEXT DEFAULT '',
  start_time TEXT DEFAULT '',
  end_time TEXT DEFAULT '',
  hourly_rate NUMERIC DEFAULT 0,
  positions INTEGER DEFAULT 1,
  filled_positions INTEGER DEFAULT 0,
  applicants_count INTEGER DEFAULT 0,
  requirements JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  urgent BOOLEAN DEFAULT false,
  country TEXT DEFAULT 'GB',
  currency TEXT DEFAULT 'GBP',
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT ''
);
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

CREATE TABLE shift_applications (
  id TEXT PRIMARY KEY,
  shift_id TEXT DEFAULT '',
  worker_id TEXT DEFAULT '',
  worker_name TEXT DEFAULT '',
  employer_id TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  applied_at TEXT DEFAULT ''
);
ALTER TABLE shift_applications DISABLE ROW LEVEL SECURITY;

CREATE TABLE permanent_jobs (
  id TEXT PRIMARY KEY,
  employer_id TEXT DEFAULT '',
  employer_name TEXT DEFAULT '',
  title TEXT NOT NULL,
  industry TEXT DEFAULT '',
  role TEXT DEFAULT '',
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  salary_min NUMERIC DEFAULT 0,
  salary_max NUMERIC DEFAULT 0,
  salary_type TEXT DEFAULT 'annual',
  job_type TEXT DEFAULT 'full-time',
  requirements JSONB DEFAULT '[]',
  benefits JSONB DEFAULT '[]',
  visa_sponsorship BOOLEAN DEFAULT false,
  remote_option TEXT DEFAULT 'on-site',
  country TEXT DEFAULT 'GB',
  currency TEXT DEFAULT 'GBP',
  experience_years INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  applicants_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT ''
);
ALTER TABLE permanent_jobs DISABLE ROW LEVEL SECURITY;

CREATE TABLE job_applications (
  id TEXT PRIMARY KEY,
  job_id TEXT DEFAULT '',
  worker_id TEXT DEFAULT '',
  worker_name TEXT DEFAULT '',
  employer_id TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  applied_at TEXT DEFAULT '',
  updated_at TEXT DEFAULT ''
);
ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;

CREATE TABLE student_placements (
  id TEXT PRIMARY KEY,
  creator_id TEXT DEFAULT '',
  creator_name TEXT DEFAULT '',
  title TEXT NOT NULL,
  university_name TEXT DEFAULT '',
  program TEXT DEFAULT '',
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  country TEXT DEFAULT 'GB',
  duration_months INTEGER DEFAULT 12,
  tuition_fee NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  intake TEXT DEFAULT '',
  requirements JSONB DEFAULT '[]',
  scholarship_available BOOLEAN DEFAULT false,
  visa_support BOOLEAN DEFAULT false,
  placement_type TEXT DEFAULT 'university',
  status TEXT DEFAULT 'open',
  applicants_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT ''
);
ALTER TABLE student_placements DISABLE ROW LEVEL SECURITY;

CREATE TABLE placement_applications (
  id TEXT PRIMARY KEY,
  placement_id TEXT DEFAULT '',
  student_id TEXT DEFAULT '',
  student_name TEXT DEFAULT '',
  creator_id TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  applied_at TEXT DEFAULT ''
);
ALTER TABLE placement_applications DISABLE ROW LEVEL SECURITY;

CREATE TABLE freelancer_services (
  id TEXT PRIMARY KEY,
  freelancer_id TEXT DEFAULT '',
  freelancer_name TEXT DEFAULT '',
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  description TEXT DEFAULT '',
  hourly_rate NUMERIC DEFAULT 0,
  fixed_price NUMERIC DEFAULT 0,
  pricing_type TEXT DEFAULT 'hourly',
  location TEXT DEFAULT '',
  remote_available BOOLEAN DEFAULT false,
  experience_years INTEGER DEFAULT 0,
  country TEXT DEFAULT 'GB',
  currency TEXT DEFAULT 'GBP',
  status TEXT DEFAULT 'active',
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  bookings_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT ''
);
ALTER TABLE freelancer_services DISABLE ROW LEVEL SECURITY;

CREATE TABLE freelancer_bookings (
  id TEXT PRIMARY KEY,
  service_id TEXT DEFAULT '',
  freelancer_id TEXT DEFAULT '',
  freelancer_name TEXT DEFAULT '',
  client_id TEXT DEFAULT '',
  client_name TEXT DEFAULT '',
  service_title TEXT DEFAULT '',
  category TEXT DEFAULT '',
  date TEXT DEFAULT '',
  start_time TEXT DEFAULT '',
  end_time TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  rate NUMERIC DEFAULT 0,
  pricing_type TEXT DEFAULT 'hourly',
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT '',
  updated_at TEXT DEFAULT ''
);
ALTER TABLE freelancer_bookings DISABLE ROW LEVEL SECURITY;

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT '',
  doc_type TEXT DEFAULT '',
  doc_name TEXT DEFAULT '',
  file_name TEXT DEFAULT '',
  file_type TEXT DEFAULT '',
  file_data TEXT DEFAULT '',
  expiry_date TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  ai_review JSONB DEFAULT '{}',
  ai_confidence NUMERIC DEFAULT 0,
  admin_notes TEXT DEFAULT '',
  uploaded_at TEXT DEFAULT '',
  reviewed_at TEXT DEFAULT '',
  reviewed_by TEXT DEFAULT ''
);
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

CREATE TABLE timesheets (
  id TEXT PRIMARY KEY,
  shift_id TEXT DEFAULT '',
  worker_id TEXT DEFAULT '',
  worker_name TEXT DEFAULT '',
  employer_id TEXT DEFAULT '',
  shift_title TEXT DEFAULT '',
  date TEXT DEFAULT '',
  hours_worked NUMERIC DEFAULT 0,
  break_minutes INTEGER DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 0,
  total_pay NUMERIC DEFAULT 0,
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  submitted_at TEXT DEFAULT '',
  approved_at TEXT DEFAULT ''
);
ALTER TABLE timesheets DISABLE ROW LEVEL SECURITY;

CREATE TABLE visa_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  visa_type TEXT DEFAULT '',
  destination_country TEXT DEFAULT '',
  current_country TEXT DEFAULT '',
  purpose TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'submitted',
  documents JSONB DEFAULT '[]',
  created_at TEXT DEFAULT ''
);
ALTER TABLE visa_applications DISABLE ROW LEVEL SECURITY;

CREATE TABLE referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT DEFAULT '',
  referred_id TEXT DEFAULT '',
  referred_name TEXT DEFAULT '',
  referred_role TEXT DEFAULT '',
  bonus_amount NUMERIC DEFAULT 0,
  commission_pct NUMERIC DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT ''
);
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;

CREATE TABLE academy_courses (
  id TEXT PRIMARY KEY,
  creator_id TEXT DEFAULT '',
  creator_name TEXT DEFAULT '',
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  description TEXT DEFAULT '',
  duration_hours NUMERIC DEFAULT 1,
  level TEXT DEFAULT 'beginner',
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  is_certified BOOLEAN DEFAULT false,
  certificate_name TEXT DEFAULT '',
  modules JSONB DEFAULT '[]',
  prerequisites JSONB DEFAULT '[]',
  learning_outcomes JSONB DEFAULT '[]',
  status TEXT DEFAULT 'published',
  enrollments_count INTEGER DEFAULT 0,
  completions_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT ''
);
ALTER TABLE academy_courses DISABLE ROW LEVEL SECURITY;

CREATE TABLE enrollments (
  id TEXT PRIMARY KEY,
  course_id TEXT DEFAULT '',
  user_id TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  course_title TEXT DEFAULT '',
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'enrolled',
  completed_modules JSONB DEFAULT '[]',
  enrolled_at TEXT DEFAULT '',
  completed_at TEXT DEFAULT '',
  certificate_id TEXT DEFAULT ''
);
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;

CREATE TABLE certificates (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  course_id TEXT DEFAULT '',
  course_title TEXT DEFAULT '',
  certificate_name TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  status TEXT DEFAULT 'valid',
  issued_at TEXT DEFAULT ''
);
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;

CREATE TABLE academy_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  plan TEXT DEFAULT 'monthly',
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'GBP',
  status TEXT DEFAULT 'active',
  started_at TEXT DEFAULT '',
  expires_at TEXT DEFAULT ''
);
ALTER TABLE academy_subscriptions DISABLE ROW LEVEL SECURITY;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_shifts_employer ON shifts(employer_id);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shift_apps_shift ON shift_applications(shift_id);
CREATE INDEX idx_shift_apps_worker ON shift_applications(worker_id);
CREATE INDEX idx_perm_jobs_employer ON permanent_jobs(employer_id);
CREATE INDEX idx_job_apps_job ON job_applications(job_id);
CREATE INDEX idx_job_apps_worker ON job_applications(worker_id);
CREATE INDEX idx_placements_creator ON student_placements(creator_id);
CREATE INDEX idx_placement_apps_placement ON placement_applications(placement_id);
CREATE INDEX idx_freelancer_user ON freelancer_services(freelancer_id);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_timesheets_worker ON timesheets(worker_id);
CREATE INDEX idx_visa_apps_user ON visa_applications(user_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_certificates_user ON certificates(user_id);
