-- EverDuty Flex Staffing Solutions - Supabase Migration
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/dynnaafttbgucxepfuxo/sql

-- Drop existing tables (they have incompatible schemas)
DROP TABLE IF EXISTS shift_applications CASCADE;
DROP TABLE IF EXISTS timesheets CASCADE;
DROP TABLE IF EXISTS worker_profiles CASCADE;
DROP TABLE IF EXISTS student_placements CASCADE;
DROP TABLE IF EXISTS international_candidates CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Disable RLS on all tables (we use service_role key from backend)
-- ============================================================

-- USERS
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker',
  full_name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  referral_code TEXT DEFAULT '',
  referred_by TEXT DEFAULT '',
  country TEXT DEFAULT 'United Kingdom',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS
CREATE TABLE organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  industry TEXT DEFAULT '',
  size TEXT DEFAULT '',
  address TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  website TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

-- WORKER PROFILES
CREATE TABLE worker_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE REFERENCES users(id),
  industry TEXT DEFAULT '',
  skills JSONB DEFAULT '[]',
  availability TEXT DEFAULT 'full_time',
  hourly_rate NUMERIC DEFAULT 0,
  experience_years INTEGER DEFAULT 0,
  compliance_status TEXT DEFAULT 'pending',
  documents_verified BOOLEAN DEFAULT false,
  bio TEXT DEFAULT '',
  location TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE worker_profiles DISABLE ROW LEVEL SECURITY;

-- EMPLOYER PROFILES
CREATE TABLE employer_profiles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE REFERENCES users(id),
  organisation_id TEXT REFERENCES organizations(id),
  job_title TEXT DEFAULT '',
  department TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE employer_profiles DISABLE ROW LEVEL SECURITY;

-- SHIFTS (Temporary Staffing)
CREATE TABLE shifts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  role TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  date TEXT DEFAULT '',
  start_time TEXT DEFAULT '',
  end_time TEXT DEFAULT '',
  hourly_rate NUMERIC DEFAULT 0,
  workers_needed INTEGER DEFAULT 1,
  workers_filled INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  employer_id TEXT REFERENCES users(id),
  organisation_id TEXT DEFAULT '',
  requirements JSONB DEFAULT '[]',
  urgent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;

-- SHIFT APPLICATIONS
CREATE TABLE shift_applications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  shift_id TEXT REFERENCES shifts(id),
  worker_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  applied_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  notes TEXT DEFAULT ''
);
ALTER TABLE shift_applications DISABLE ROW LEVEL SECURITY;

-- PERMANENT JOBS
CREATE TABLE permanent_jobs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  location TEXT DEFAULT '',
  salary_min NUMERIC DEFAULT 0,
  salary_max NUMERIC DEFAULT 0,
  employment_type TEXT DEFAULT 'full_time',
  experience_required TEXT DEFAULT '',
  skills_required JSONB DEFAULT '[]',
  benefits JSONB DEFAULT '[]',
  status TEXT DEFAULT 'open',
  employer_id TEXT REFERENCES users(id),
  organisation_id TEXT DEFAULT '',
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  closing_date TEXT DEFAULT ''
);
ALTER TABLE permanent_jobs DISABLE ROW LEVEL SECURITY;

-- JOB APPLICATIONS
CREATE TABLE job_applications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_id TEXT REFERENCES permanent_jobs(id),
  worker_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  cover_letter TEXT DEFAULT '',
  resume_url TEXT DEFAULT '',
  applied_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;

-- STUDENT PLACEMENTS
CREATE TABLE student_placements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  program_name TEXT DEFAULT '',
  university_name TEXT DEFAULT '',
  description TEXT DEFAULT '',
  field_of_study TEXT DEFAULT '',
  placement_type TEXT DEFAULT 'university',
  location TEXT DEFAULT '',
  country TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  stipend NUMERIC DEFAULT 0,
  requirements JSONB DEFAULT '[]',
  status TEXT DEFAULT 'open',
  employer_id TEXT REFERENCES users(id),
  applications_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  start_date TEXT DEFAULT '',
  deadline TEXT DEFAULT ''
);
ALTER TABLE student_placements DISABLE ROW LEVEL SECURITY;

-- PLACEMENT APPLICATIONS
CREATE TABLE placement_applications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  placement_id TEXT REFERENCES student_placements(id),
  student_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  motivation TEXT DEFAULT '',
  applied_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE placement_applications DISABLE ROW LEVEL SECURITY;

-- FREELANCER SERVICES
CREATE TABLE freelancer_services (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id),
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  subcategory TEXT DEFAULT '',
  description TEXT DEFAULT '',
  hourly_rate NUMERIC DEFAULT 0,
  fixed_rate NUMERIC DEFAULT 0,
  skills JSONB DEFAULT '[]',
  portfolio_url TEXT DEFAULT '',
  availability TEXT DEFAULT 'available',
  rating NUMERIC DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE freelancer_services DISABLE ROW LEVEL SECURITY;

-- FREELANCER BOOKINGS
CREATE TABLE freelancer_bookings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  service_id TEXT REFERENCES freelancer_services(id),
  client_id TEXT REFERENCES users(id),
  freelancer_id TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  description TEXT DEFAULT '',
  budget NUMERIC DEFAULT 0,
  start_date TEXT DEFAULT '',
  end_date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE freelancer_bookings DISABLE ROW LEVEL SECURITY;

-- DOCUMENTS
CREATE TABLE documents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id),
  document_type TEXT DEFAULT '',
  document_name TEXT DEFAULT '',
  file_url TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  expiry_date TEXT DEFAULT '',
  ai_verification JSONB DEFAULT '{}',
  reviewed_by TEXT DEFAULT '',
  reviewed_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;

-- TIMESHEETS
CREATE TABLE timesheets (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  shift_id TEXT REFERENCES shifts(id),
  worker_id TEXT REFERENCES users(id),
  employer_id TEXT REFERENCES users(id),
  date TEXT DEFAULT '',
  hours_worked NUMERIC DEFAULT 0,
  hourly_rate NUMERIC DEFAULT 0,
  total_pay NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  notes TEXT DEFAULT ''
);
ALTER TABLE timesheets DISABLE ROW LEVEL SECURITY;

-- VISA APPLICATIONS
CREATE TABLE visa_applications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id),
  visa_type TEXT DEFAULT '',
  destination_country TEXT DEFAULT '',
  current_country TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  employer_sponsor TEXT DEFAULT '',
  documents JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE visa_applications DISABLE ROW LEVEL SECURITY;

-- REFERRALS
CREATE TABLE referrals (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  referrer_id TEXT REFERENCES users(id),
  referred_id TEXT REFERENCES users(id),
  referred_name TEXT DEFAULT '',
  referred_email TEXT DEFAULT '',
  referred_role TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  bonus_amount NUMERIC DEFAULT 0,
  tier TEXT DEFAULT 'bronze',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE referrals DISABLE ROW LEVEL SECURITY;

-- ACADEMY COURSES
CREATE TABLE academy_courses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  category TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  description TEXT DEFAULT '',
  duration_hours NUMERIC DEFAULT 1,
  level TEXT DEFAULT 'beginner',
  price NUMERIC DEFAULT 0,
  is_certified BOOLEAN DEFAULT false,
  certificate_name TEXT DEFAULT '',
  status TEXT DEFAULT 'published',
  created_by TEXT DEFAULT '',
  enrollments_count INTEGER DEFAULT 0,
  completions_count INTEGER DEFAULT 0,
  modules JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE academy_courses DISABLE ROW LEVEL SECURITY;

-- ENROLLMENTS
CREATE TABLE enrollments (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id),
  course_id TEXT REFERENCES academy_courses(id),
  status TEXT DEFAULT 'enrolled',
  progress INTEGER DEFAULT 0,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  certificate_id TEXT DEFAULT ''
);
ALTER TABLE enrollments DISABLE ROW LEVEL SECURITY;

-- CERTIFICATES
CREATE TABLE certificates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES users(id),
  course_id TEXT REFERENCES academy_courses(id),
  certificate_name TEXT DEFAULT '',
  course_title TEXT DEFAULT '',
  industry TEXT DEFAULT '',
  status TEXT DEFAULT 'active',
  issued_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;

-- ACADEMY SUBSCRIPTIONS
CREATE TABLE academy_subscriptions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT UNIQUE REFERENCES users(id),
  plan TEXT DEFAULT 'monthly',
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);
ALTER TABLE academy_subscriptions DISABLE ROW LEVEL SECURITY;

-- INDEXES for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_shifts_employer ON shifts(employer_id);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shift_apps_shift ON shift_applications(shift_id);
CREATE INDEX idx_shift_apps_worker ON shift_applications(worker_id);
CREATE INDEX idx_perm_jobs_employer ON permanent_jobs(employer_id);
CREATE INDEX idx_job_apps_job ON job_applications(job_id);
CREATE INDEX idx_job_apps_worker ON job_applications(worker_id);
CREATE INDEX idx_placements_employer ON student_placements(employer_id);
CREATE INDEX idx_placement_apps_placement ON placement_applications(placement_id);
CREATE INDEX idx_freelancer_user ON freelancer_services(user_id);
CREATE INDEX idx_freelancer_bookings_service ON freelancer_bookings(service_id);
CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_timesheets_worker ON timesheets(worker_id);
CREATE INDEX idx_visa_apps_user ON visa_applications(user_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_certificates_user ON certificates(user_id);
