# EverDuty Flex Staffing Solutions - PRD

## Original Problem Statement
Build a full production-ready multi-industry staffing platform called EverDuty Flex Staffing Solutions. UK-based temporary staffing marketplace for multiple industries. Expanded to include permanent job placements, international multi-industry recruitment, student university/college placements, freelancers/independent workers, a tiered referral programme, a training academy, PWA support, and a multi-agency vehicle platform.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI (Gold/Black/White theme) + PWA
- **Backend**: FastAPI (Python) with **Supabase PostgreSQL** (21 tables)
- **Database**: Supabase (https://dynnaafttbgucxepfuxo.supabase.co)
- **AI**: OpenAI GPT-5.2 via emergentintegrations for document verification (stub)
- **Auth**: JWT-based multi-role (worker, employer, agency, admin)
- **Domain**: everduty.org (pending DNS setup)
- **PWA**: Installable on Android/iOS/Windows via browser

## User Personas & Portals
1. **Workers** — Browse shifts, jobs, placements; list freelance services; manage documents; earn referral bonuses; take academy courses
2. **Employers/Universities** — Post shifts/jobs/placements; review applicants; manage timesheets; create academy courses
3. **Agencies** — Post shifts/jobs under their brand; manage worker pool; review applicants; invite/find workers; track revenue/commission
4. **Super Admin** — Full platform oversight: all users, agencies (approve/suspend/set commission), shifts, jobs, placements, documents, finance, referrals, academy

## Database (Supabase PostgreSQL - 21 Tables)
users, organizations, worker_profiles, employer_profiles, agencies, shifts, shift_applications, permanent_jobs, job_applications, student_placements, placement_applications, freelancer_services, freelancer_bookings, documents, timesheets, visa_applications, referrals, academy_courses, enrollments, certificates, academy_subscriptions

## What's Been Implemented

### PWA (Progressive Web App)
- [x] manifest.json with app name, icons, theme colors
- [x] Service worker with caching for offline support
- [x] Install prompt banner component
- [x] Apple/Android/Windows installability via "Add to Home Screen"

### Multi-Agency Platform
- [x] Agency registration (self-signup + admin approval)
- [x] Agency Dashboard: 8 stats (shifts, worker pool, revenue, net revenue, jobs, applications, commission)
- [x] Agency can post temp shifts and permanent jobs under their brand
- [x] Worker Pool management: invite workers by email, remove workers
- [x] Shared worker browsing: find verified workers across platform
- [x] Applicant management: accept/reject shift applications
- [x] Timesheets view for agency-posted shifts
- [x] Agency Settings: update profile, view commission rate/status
- [x] Admin Agency Management: view all agencies, approve/suspend, set commission rates
- [x] 15% default commission rate per agency (configurable by admin)

### All Previous Features
- [x] Temp Shifts, Permanent Jobs, Student Placements, Freelancer Marketplace
- [x] Referral Programme (Bronze/Silver/Gold tiers)
- [x] Training Academy (32 courses, certificates, subscriptions)
- [x] AI Document Verification (stub)
- [x] Visa/International support (19 countries)
- [x] Finance dashboard with commission calculations

## Demo Accounts
- Admin: admin@everduty.com / admin123
- Employer: employer@careplus.com / employer123
- Worker: worker@email.com / worker123
- University: university@oxford.ac.uk / university123
- Agency: agency@swiftstaff.co.uk / agency123

## Prioritized Backlog

### P0 (Critical - Next Sprint)
- [ ] Deploy to production (Emergent Deploy)
- [ ] Link everduty.org domain
- [ ] Multi-admin user management (add team admin users)
- [ ] Stripe payment integration for subscriptions/commissions

### P1 (Important)
- [ ] Notifications system (email, in-app)
- [ ] Messaging between workers/employers/agencies
- [ ] Rating and review system
- [ ] Clock in/out with geolocation
- [ ] AI Document Verification deep-dive (real OpenAI pipeline)
- [ ] Invoice/receipt PDF generation
- [ ] Agency white-label branding options

### P2 (Nice to Have)
- [ ] Recurring shifts support
- [ ] Auto-match workers to shifts (AI)
- [ ] QR code-based attendance
- [ ] Analytics charts and forecasting
- [ ] GDPR data export/deletion
- [ ] Native mobile apps (React Native)
- [ ] App Store / Play Store submission
