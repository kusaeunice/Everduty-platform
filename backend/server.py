from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from supabase import create_client
import os
import logging
import base64
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Keep MongoDB for backward compat but use Supabase as primary
sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_SERVICE_KEY'])

JWT_SECRET = os.environ.get('JWT_SECRET', 'everduty-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ CONSTANTS ============

INDUSTRIES = [
    "Healthcare", "Social Care", "Hospitality", "Cleaning", "Retail",
    "Transport & Logistics", "Warehousing", "Security", "Education Support",
    "Office & Admin", "Farming & Seasonal", "Construction Support",
    "Technology", "Finance & Banking", "Legal", "Manufacturing",
    "Energy & Utilities", "Telecommunications", "Media & Entertainment"
]

FREELANCER_CATEGORIES = [
    "Nanny", "Babysitter", "Au Pair", "House Cleaner", "Apartment Cleaner",
    "Housekeeper", "Laundry & Ironing Service",
    "Personal Trainer", "Yoga Instructor", "Pilates Instructor", "Martial Arts Instructor",
    "Swimming Instructor", "Dance Instructor", "Meditation Coach", "Nutritionist",
    "Massage Therapist", "Physiotherapist", "Life Coach",
    "Piano Instructor", "Guitar Instructor", "Violin Instructor", "Drum Instructor",
    "Vocal Coach", "Music Theory Tutor", "Art Teacher", "Pottery Instructor",
    "Photography Instructor",
    "Academic Tutor", "Language Teacher", "STEM Tutor", "Test Prep Tutor",
    "Special Needs Tutor", "Early Years Educator", "Homework Helper",
    "University Admissions Consultant",
    "Photographer", "Videographer", "Graphic Designer", "Web Developer",
    "App Developer", "UI/UX Designer", "Social Media Manager",
    "Content Writer", "Copywriter", "Translator", "Interpreter",
    "Video Editor", "Animator", "Podcast Producer",
    "Handyman", "Plumber", "Electrician", "Carpenter", "Painter & Decorator",
    "Gardener", "Landscaper", "Locksmith", "HVAC Technician",
    "Appliance Repair", "Tiler", "Plasterer", "Roofer", "Fencer",
    "Window Cleaner", "Pressure Washer", "Pest Control",
    "Mobile Mechanic", "Car Detailer", "Driving Instructor", "MOT Tester",
    "Pet Sitter", "Dog Walker", "Pet Groomer", "Dog Trainer",
    "Cat Sitter", "Horse Riding Instructor",
    "Mobile Hair Stylist", "Mobile Barber", "Makeup Artist", "Nail Technician",
    "Personal Stylist", "Personal Shopper", "Wardrobe Consultant",
    "Tailor", "Seamstress", "Shoe Repair",
    "DJ", "Event Planner", "Wedding Planner", "Florist",
    "Balloon Artist", "Face Painter", "Magician", "Caricature Artist",
    "Master of Ceremonies", "Party Chef",
    "Personal Chef", "Caterer", "Baker", "Bartender",
    "Meal Prep Service", "Cake Decorator",
    "Virtual Assistant", "Bookkeeper", "Accountant", "Tax Advisor",
    "Legal Consultant", "Business Coach", "IT Consultant",
    "Data Analyst", "Project Manager", "HR Consultant",
    "Marketing Consultant", "SEO Specialist", "PR Consultant",
    "Private Nurse", "Private Carer", "Occupational Therapist",
    "Speech Therapist", "Counsellor", "Psychotherapist",
    "First Aid Trainer", "Health & Safety Consultant",
    "Courier", "Delivery Driver", "Removal Service", "Man & Van",
    "Furniture Assembly", "Errand Runner",
    "Senior Companion", "Disability Support Worker", "Respite Carer",
    "Live-in Carer",
    "Interior Designer", "Feng Shui Consultant", "Organiser & Declutterer",
    "Drone Operator", "3D Printing Service", "Engraver"
]

COUNTRIES = [
    {"code": "GB", "name": "United Kingdom", "currency": "GBP", "symbol": "£"},
    {"code": "US", "name": "United States", "currency": "USD", "symbol": "$"},
    {"code": "CA", "name": "Canada", "currency": "CAD", "symbol": "C$"},
    {"code": "AU", "name": "Australia", "currency": "AUD", "symbol": "A$"},
    {"code": "DE", "name": "Germany", "currency": "EUR", "symbol": "€"},
    {"code": "FR", "name": "France", "currency": "EUR", "symbol": "€"},
    {"code": "IE", "name": "Ireland", "currency": "EUR", "symbol": "€"},
    {"code": "NL", "name": "Netherlands", "currency": "EUR", "symbol": "€"},
    {"code": "AE", "name": "UAE", "currency": "AED", "symbol": "د.إ"},
    {"code": "SA", "name": "Saudi Arabia", "currency": "SAR", "symbol": "﷼"},
    {"code": "SG", "name": "Singapore", "currency": "SGD", "symbol": "S$"},
    {"code": "NZ", "name": "New Zealand", "currency": "NZD", "symbol": "NZ$"},
    {"code": "IN", "name": "India", "currency": "INR", "symbol": "₹"},
    {"code": "NG", "name": "Nigeria", "currency": "NGN", "symbol": "₦"},
    {"code": "GH", "name": "Ghana", "currency": "GHS", "symbol": "₵"},
    {"code": "KE", "name": "Kenya", "currency": "KES", "symbol": "KSh"},
    {"code": "ZA", "name": "South Africa", "currency": "ZAR", "symbol": "R"},
    {"code": "PH", "name": "Philippines", "currency": "PHP", "symbol": "₱"},
    {"code": "JP", "name": "Japan", "currency": "JPY", "symbol": "¥"},
]

REFERRAL_TIERS = {
    "bronze": {"min_referrals": 1, "max_referrals": 5, "worker_bonus": 25, "employer_bonus": 50, "commission_pct": 2},
    "silver": {"min_referrals": 6, "max_referrals": 15, "worker_bonus": 35, "employer_bonus": 75, "commission_pct": 3},
    "gold": {"min_referrals": 16, "max_referrals": 999999, "worker_bonus": 50, "employer_bonus": 100, "commission_pct": 5},
}

ACADEMY_CATEGORIES = [
    "Healthcare", "Social Care", "Hospitality", "Security", "Construction",
    "Transport & Logistics", "Warehousing", "Education", "Cleaning",
    "Office & Admin", "Technology", "Farming", "Retail", "General", "Leadership"
]

SUBSCRIPTION_PLANS = {
    "monthly": {"price": 29.99, "currency": "GBP", "name": "Monthly Access", "duration_days": 30},
    "annual": {"price": 249.99, "currency": "GBP", "name": "Annual Access (Save 30%)", "duration_days": 365},
}

# ============ MODELS ============

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str
    phone: Optional[str] = None
    country: Optional[str] = "GB"
    referral_code: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class WorkerProfileUpdate(BaseModel):
    skills: Optional[List[str]] = None
    industries: Optional[List[str]] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    hourly_rate: Optional[float] = None
    availability: Optional[dict] = None
    country: Optional[str] = None
    is_freelancer: Optional[bool] = None
    is_student: Optional[bool] = None

class OrganizationCreate(BaseModel):
    name: str
    industry: str
    address: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    phone: Optional[str] = None
    description: Optional[str] = None
    country: Optional[str] = "GB"
    org_type: Optional[str] = "employer"

class ShiftCreate(BaseModel):
    title: str
    industry: str
    role: str
    description: Optional[str] = None
    location: str
    date: str
    start_time: str
    end_time: str
    hourly_rate: float
    positions: int = 1
    requirements: Optional[List[str]] = None
    notes: Optional[str] = None
    urgent: bool = False
    country: Optional[str] = "GB"
    currency: Optional[str] = "GBP"

class PermanentJobCreate(BaseModel):
    title: str
    industry: str
    role: str
    description: str
    location: str
    salary_min: float
    salary_max: float
    salary_type: str = "annual"
    job_type: str = "full-time"
    requirements: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    visa_sponsorship: bool = False
    remote_option: str = "on-site"
    country: Optional[str] = "GB"
    currency: Optional[str] = "GBP"
    experience_years: Optional[int] = 0

class StudentPlacementCreate(BaseModel):
    title: str
    university_name: str
    program: str
    description: str
    location: str
    country: str = "GB"
    duration_months: int = 12
    tuition_fee: Optional[float] = None
    currency: Optional[str] = "GBP"
    intake: Optional[str] = None
    requirements: Optional[List[str]] = None
    scholarship_available: bool = False
    visa_support: bool = False
    placement_type: str = "university"

class FreelancerServiceCreate(BaseModel):
    title: str
    category: str
    description: str
    hourly_rate: Optional[float] = None
    fixed_price: Optional[float] = None
    pricing_type: str = "hourly"
    location: str
    remote_available: bool = False
    experience_years: int = 0
    country: Optional[str] = "GB"
    currency: Optional[str] = "GBP"

class FreelancerBookingCreate(BaseModel):
    service_id: str
    freelancer_id: str
    date: str
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    notes: Optional[str] = None

class VisaApplicationCreate(BaseModel):
    visa_type: str
    destination_country: str
    current_country: str
    purpose: str
    notes: Optional[str] = None

class TimesheetSubmit(BaseModel):
    shift_id: str
    hours_worked: float
    break_minutes: int = 0
    notes: Optional[str] = None

class CourseCreate(BaseModel):
    title: str
    category: str
    industry: str
    description: str
    duration_hours: float = 1
    level: str = "beginner"
    price: float = 0
    currency: str = "GBP"
    is_certified: bool = True
    certificate_name: Optional[str] = None
    modules: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None
    learning_outcomes: Optional[List[str]] = None

class SubscriptionCreate(BaseModel):
    plan: str

class AgencyCreate(BaseModel):
    name: str
    industry: str
    description: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postcode: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None

class AgencyInviteWorker(BaseModel):
    worker_email: str

# ============ SUPABASE HELPERS ============

def sb_first(result):
    """Get first row from Supabase result or None."""
    return result.data[0] if result.data else None

def sb_count(table, **filters):
    """Count rows matching filters."""
    q = sb.table(table).select("id", count="exact")
    for k, v in filters.items():
        q = q.eq(k, v)
    r = q.execute()
    return r.count or 0

def sb_inc(table, id_val, field, amount=1):
    """Increment a numeric field."""
    row = sb_first(sb.table(table).select(field).eq("id", id_val).execute())
    if row:
        sb.table(table).update({field: (row[field] or 0) + amount}).eq("id", id_val).execute()

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, role: str) -> str:
    payload = {"user_id": user_id, "role": role, "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        result = sb.table("users").select("*").eq("id", payload["user_id"]).execute()
        user = sb_first(result)
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_referral_code(name):
    prefix = ''.join(c for c in name.upper().replace(' ', '') if c.isalpha())[:4]
    suffix = uuid.uuid4().hex[:4].upper()
    return f"ED-{prefix}{suffix}"

def require_role(user: dict, roles: list):
    if user["role"] not in roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
def register(data: UserRegister):
    existing = sb_first(sb.table("users").select("id").eq("email", data.email).execute())
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    ref_code = generate_referral_code(data.full_name)
    now = datetime.now(timezone.utc).isoformat()
    user = {
        "id": user_id, "email": data.email, "hashed_password": hash_password(data.password),
        "full_name": data.full_name, "role": data.role, "phone": data.phone or "",
        "country": data.country or "GB",
        "referral_code": ref_code, "referred_by": "",
        "status": "active" if data.role == "admin" else "pending",
        "created_at": now, "updated_at": now
    }
    if data.referral_code:
        referrer = sb_first(sb.table("users").select("*").eq("referral_code", data.referral_code).execute())
        if referrer:
            user["referred_by"] = referrer["id"]
            ref_count = sb_count("referrals", referrer_id=referrer["id"])
            tier = "bronze"
            for t, cfg in REFERRAL_TIERS.items():
                if cfg["min_referrals"] <= ref_count + 1 <= cfg["max_referrals"]:
                    tier = t
            bonus = REFERRAL_TIERS[tier]["worker_bonus"] if data.role == "worker" else REFERRAL_TIERS[tier]["employer_bonus"]
            sb.table("referrals").insert({
                "id": str(uuid.uuid4()), "referrer_id": referrer["id"], "referred_id": user_id,
                "referred_name": data.full_name, "referred_role": data.role,
                "bonus_amount": bonus, "commission_pct": REFERRAL_TIERS[tier]["commission_pct"],
                "tier": tier, "status": "pending", "created_at": now
            }).execute()
    sb.table("users").insert(user).execute()
    if data.role == "worker":
        sb.table("worker_profiles").insert({
            "id": str(uuid.uuid4()), "user_id": user_id, "skills": [], "industries": [],
            "bio": "", "location": "", "hourly_rate": 0, "availability": {},
            "compliance_status": "pending", "documents_count": 0, "rating": 0,
            "shifts_completed": 0, "is_freelancer": False, "is_student": False,
            "country": data.country or "GB", "created_at": now
        }).execute()
    token = create_token(user_id, data.role)
    return {"token": token, "user": {"id": user_id, "email": data.email, "full_name": data.full_name, "role": data.role, "status": user["status"], "country": user["country"]}}

@api_router.post("/auth/login")
def login(data: UserLogin):
    user = sb_first(sb.table("users").select("*").eq("email", data.email).execute())
    if not user or not verify_password(data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token(user["id"], user["role"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"], "status": user.get("status", "active"), "country": user.get("country", "GB")}}

@api_router.get("/auth/me")
def get_me(user=Depends(get_current_user)):
    return {"id": user["id"], "email": user["email"], "full_name": user["full_name"], "role": user["role"], "status": user.get("status", "active"), "phone": user.get("phone"), "country": user.get("country", "GB")}

# ============ REFERENCE DATA ============

@api_router.get("/industries")
def get_industries():
    return {"industries": INDUSTRIES}

@api_router.get("/freelancer-categories")
def get_freelancer_categories():
    return {"categories": FREELANCER_CATEGORIES}

@api_router.get("/countries")
def get_countries():
    return {"countries": COUNTRIES}

@api_router.get("/shifts/public")
def get_public_shifts(industry: Optional[str] = None):
    q = sb.table("shifts").select("*").eq("status", "open")
    if industry:
        q = q.eq("industry", industry)
    return q.order("date").limit(50).execute().data

# ============ WORKER ROUTES ============

@api_router.get("/worker/profile")
def get_worker_profile(user=Depends(get_current_user)):
    require_role(user, ["worker"])
    profile = sb_first(sb.table("worker_profiles").select("*").eq("user_id", user["id"]).execute())
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@api_router.put("/worker/profile")
def update_worker_profile(data: WorkerProfileUpdate, user=Depends(get_current_user)):
    require_role(user, ["worker"])
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    sb.table("worker_profiles").update(update_data).eq("user_id", user["id"]).execute()
    return sb_first(sb.table("worker_profiles").select("*").eq("user_id", user["id"]).execute())

@api_router.get("/worker/documents")
def get_worker_documents(user=Depends(get_current_user)):
    require_role(user, ["worker"])
    return sb.table("documents").select("*").eq("user_id", user["id"]).execute().data

@api_router.post("/worker/documents")
async def upload_document(file: UploadFile = File(...), doc_type: str = Form(...), doc_name: str = Form(...), expiry_date: str = Form(None), user=Depends(get_current_user)):
    require_role(user, ["worker"])
    content = await file.read()
    file_base64 = base64.b64encode(content).decode('utf-8')
    doc_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": doc_id, "user_id": user["id"], "doc_type": doc_type, "doc_name": doc_name,
        "file_name": file.filename, "file_type": file.content_type, "file_data": file_base64,
        "expiry_date": expiry_date or "", "status": "pending", "ai_review": {}, "ai_confidence": 0,
        "admin_notes": "", "uploaded_at": now, "reviewed_at": "", "reviewed_by": ""
    }
    sb.table("documents").insert(doc).execute()
    try:
        await run_ai_document_check(doc_id, file_base64, file.content_type, doc_type, doc_name, user["full_name"])
    except Exception as e:
        logger.error(f"AI review failed for doc {doc_id}: {e}")
    count = sb_count("documents", user_id=user["id"])
    sb.table("worker_profiles").update({"documents_count": count}).eq("user_id", user["id"]).execute()
    return {"id": doc_id, "status": "pending", "message": "Document uploaded and queued for AI review"}

@api_router.get("/worker/shifts")
def get_worker_available_shifts(industry: Optional[str] = None, location: Optional[str] = None, user=Depends(get_current_user)):
    require_role(user, ["worker"])
    q = sb.table("shifts").select("*").eq("status", "open")
    if industry:
        q = q.eq("industry", industry)
    if location:
        q = q.ilike("location", f"%{location}%")
    shifts = q.order("date").limit(100).execute().data
    for shift in shifts:
        app = sb_first(sb.table("shift_applications").select("status").eq("shift_id", shift["id"]).eq("worker_id", user["id"]).execute())
        shift["application_status"] = app["status"] if app else None
    return shifts

@api_router.get("/worker/my-shifts")
def get_worker_my_shifts(user=Depends(get_current_user)):
    require_role(user, ["worker"])
    applications = sb.table("shift_applications").select("*").eq("worker_id", user["id"]).execute().data
    result = []
    for a in applications:
        shift = sb_first(sb.table("shifts").select("*").eq("id", a["shift_id"]).execute())
        if shift:
            shift["application_status"] = a["status"]
            shift["application_id"] = a["id"]
            result.append(shift)
    return result

@api_router.post("/worker/shifts/{shift_id}/apply")
def apply_for_shift(shift_id: str, user=Depends(get_current_user)):
    require_role(user, ["worker"])
    shift = sb_first(sb.table("shifts").select("*").eq("id", shift_id).execute())
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    existing = sb_first(sb.table("shift_applications").select("id").eq("shift_id", shift_id).eq("worker_id", user["id"]).execute())
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")
    app_id = str(uuid.uuid4())
    sb.table("shift_applications").insert({
        "id": app_id, "shift_id": shift_id, "worker_id": user["id"],
        "worker_name": user["full_name"], "employer_id": shift["employer_id"],
        "status": "applied", "applied_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    return {"message": "Application submitted", "application_id": app_id}

@api_router.get("/worker/earnings")
def get_worker_earnings(user=Depends(get_current_user)):
    require_role(user, ["worker"])
    timesheets = sb.table("timesheets").select("*").eq("worker_id", user["id"]).execute().data
    total_earned = sum(t.get("total_pay", 0) for t in timesheets if t.get("status") == "approved")
    pending = sum(t.get("total_pay", 0) for t in timesheets if t.get("status") == "pending")
    return {"total_earned": round(total_earned, 2), "pending_amount": round(pending, 2), "timesheets": timesheets}

# ============ PERMANENT JOBS ============

@api_router.post("/employer/permanent-jobs")
def create_permanent_job(data: PermanentJobCreate, user=Depends(get_current_user)):
    require_role(user, ["employer"])
    job_id = str(uuid.uuid4())
    job = {
        "id": job_id, "employer_id": user["id"], "employer_name": user["full_name"],
        **data.model_dump(), "status": "open", "applicants_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    sb.table("permanent_jobs").insert(job).execute()
    return {"id": job_id, "message": "Permanent job posted"}

@api_router.get("/employer/permanent-jobs")
def get_employer_permanent_jobs(user=Depends(get_current_user)):
    require_role(user, ["employer"])
    jobs = sb.table("permanent_jobs").select("*").eq("employer_id", user["id"]).order("created_at", desc=True).limit(100).execute().data
    for j in jobs:
        j["applicants_count"] = sb_count("job_applications", job_id=j["id"])
    return jobs

@api_router.get("/permanent-jobs")
def browse_permanent_jobs(industry: Optional[str] = None, country: Optional[str] = None, remote: Optional[str] = None, user=Depends(get_current_user)):
    q = sb.table("permanent_jobs").select("*").eq("status", "open")
    if industry:
        q = q.eq("industry", industry)
    if country:
        q = q.eq("country", country)
    if remote:
        q = q.eq("remote_option", remote)
    jobs = q.order("created_at", desc=True).limit(100).execute().data
    for j in jobs:
        app = sb_first(sb.table("job_applications").select("status").eq("job_id", j["id"]).eq("worker_id", user["id"]).execute())
        j["application_status"] = app["status"] if app else None
    return jobs

@api_router.post("/permanent-jobs/{job_id}/apply")
def apply_permanent_job(job_id: str, user=Depends(get_current_user)):
    require_role(user, ["worker"])
    job = sb_first(sb.table("permanent_jobs").select("*").eq("id", job_id).execute())
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    existing = sb_first(sb.table("job_applications").select("id").eq("job_id", job_id).eq("worker_id", user["id"]).execute())
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")
    sb.table("job_applications").insert({
        "id": str(uuid.uuid4()), "job_id": job_id, "worker_id": user["id"],
        "worker_name": user["full_name"], "employer_id": job["employer_id"],
        "status": "applied", "applied_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    return {"message": "Application submitted"}

@api_router.get("/worker/permanent-applications")
def get_worker_permanent_applications(user=Depends(get_current_user)):
    require_role(user, ["worker"])
    apps = sb.table("job_applications").select("*").eq("worker_id", user["id"]).execute().data
    result = []
    for a in apps:
        job = sb_first(sb.table("permanent_jobs").select("*").eq("id", a["job_id"]).execute())
        if job:
            job["application_status"] = a["status"]
            result.append(job)
    return result

@api_router.get("/employer/permanent-jobs/{job_id}/applicants")
def get_permanent_job_applicants(job_id: str, user=Depends(get_current_user)):
    require_role(user, ["employer"])
    apps = sb.table("job_applications").select("*").eq("job_id", job_id).eq("employer_id", user["id"]).execute().data
    for a in apps:
        w = sb_first(sb.table("users").select("id,email,full_name,role,phone,country,status").eq("id", a["worker_id"]).execute())
        a["worker"] = w
        a["worker_profile"] = sb_first(sb.table("worker_profiles").select("*").eq("user_id", a["worker_id"]).execute())
    return apps

@api_router.post("/employer/job-applications/{app_id}/{action}")
def handle_job_application(app_id: str, action: str, user=Depends(get_current_user)):
    require_role(user, ["employer"])
    if action not in ["accept", "reject", "shortlist"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    status_map = {"accept": "accepted", "reject": "rejected", "shortlist": "shortlisted"}
    sb.table("job_applications").update({"status": status_map[action], "updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", app_id).execute()
    return {"message": f"Application {status_map[action]}"}

# ============ STUDENT PLACEMENTS ============

@api_router.post("/placements")
def create_placement(data: StudentPlacementCreate, user=Depends(get_current_user)):
    require_role(user, ["employer", "admin"])
    placement_id = str(uuid.uuid4())
    sb.table("student_placements").insert({
        "id": placement_id, "creator_id": user["id"], "creator_name": user["full_name"],
        **data.model_dump(), "status": "open", "applicants_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    return {"id": placement_id, "message": "Placement created"}

@api_router.get("/placements")
def browse_placements(country: Optional[str] = None, placement_type: Optional[str] = None, user=Depends(get_current_user)):
    q = sb.table("student_placements").select("*").eq("status", "open")
    if country:
        q = q.eq("country", country)
    if placement_type:
        q = q.eq("placement_type", placement_type)
    placements = q.order("created_at", desc=True).limit(100).execute().data
    for p in placements:
        app = sb_first(sb.table("placement_applications").select("status").eq("placement_id", p["id"]).eq("student_id", user["id"]).execute())
        p["application_status"] = app["status"] if app else None
    return placements

@api_router.post("/placements/{placement_id}/apply")
def apply_placement(placement_id: str, user=Depends(get_current_user)):
    require_role(user, ["worker"])
    placement = sb_first(sb.table("student_placements").select("*").eq("id", placement_id).execute())
    if not placement:
        raise HTTPException(status_code=404, detail="Placement not found")
    existing = sb_first(sb.table("placement_applications").select("id").eq("placement_id", placement_id).eq("student_id", user["id"]).execute())
    if existing:
        raise HTTPException(status_code=400, detail="Already applied")
    sb.table("placement_applications").insert({
        "id": str(uuid.uuid4()), "placement_id": placement_id, "student_id": user["id"],
        "student_name": user["full_name"], "creator_id": placement["creator_id"],
        "status": "applied", "applied_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    return {"message": "Application submitted"}

@api_router.get("/student/applications")
def get_student_applications(user=Depends(get_current_user)):
    require_role(user, ["worker"])
    apps = sb.table("placement_applications").select("*").eq("student_id", user["id"]).execute().data
    result = []
    for a in apps:
        pl = sb_first(sb.table("student_placements").select("*").eq("id", a["placement_id"]).execute())
        if pl:
            pl["application_status"] = a["status"]
            result.append(pl)
    return result

@api_router.get("/employer/placements")
def get_employer_placements(user=Depends(get_current_user)):
    require_role(user, ["employer", "admin"])
    return sb.table("student_placements").select("*").eq("creator_id", user["id"]).order("created_at", desc=True).limit(100).execute().data

# ============ FREELANCER MODULE ============

@api_router.post("/freelancer/services")
def create_freelancer_service(data: FreelancerServiceCreate, user=Depends(get_current_user)):
    require_role(user, ["worker"])
    service_id = str(uuid.uuid4())
    sb.table("freelancer_services").insert({
        "id": service_id, "freelancer_id": user["id"], "freelancer_name": user["full_name"],
        **data.model_dump(), "status": "active", "rating": 0, "reviews_count": 0, "bookings_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    sb.table("worker_profiles").update({"is_freelancer": True}).eq("user_id", user["id"]).execute()
    return {"id": service_id, "message": "Service listed"}

@api_router.get("/freelancer/my-services")
def get_my_services(user=Depends(get_current_user)):
    require_role(user, ["worker"])
    return sb.table("freelancer_services").select("*").eq("freelancer_id", user["id"]).execute().data

@api_router.get("/freelancer/browse")
def browse_freelancers(category: Optional[str] = None, location: Optional[str] = None, country: Optional[str] = None, remote: Optional[bool] = None):
    q = sb.table("freelancer_services").select("*").eq("status", "active")
    if category:
        q = q.eq("category", category)
    if location:
        q = q.ilike("location", f"%{location}%")
    if country:
        q = q.eq("country", country)
    if remote:
        q = q.eq("remote_available", True)
    return q.order("rating", desc=True).limit(100).execute().data

@api_router.post("/freelancer/bookings")
def create_booking(data: FreelancerBookingCreate, user=Depends(get_current_user)):
    service = sb_first(sb.table("freelancer_services").select("*").eq("id", data.service_id).execute())
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    booking_id = str(uuid.uuid4())
    sb.table("freelancer_bookings").insert({
        "id": booking_id, "service_id": data.service_id, "freelancer_id": data.freelancer_id,
        "freelancer_name": service["freelancer_name"], "client_id": user["id"],
        "client_name": user["full_name"], "service_title": service["title"],
        "category": service["category"],
        "date": data.date, "start_time": data.start_time or "", "end_time": data.end_time or "",
        "notes": data.notes or "", "status": "pending",
        "rate": service.get("hourly_rate") or service.get("fixed_price", 0),
        "pricing_type": service["pricing_type"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    sb_inc("freelancer_services", data.service_id, "bookings_count")
    return {"id": booking_id, "message": "Booking request sent"}

@api_router.get("/freelancer/bookings")
def get_freelancer_bookings(user=Depends(get_current_user)):
    as_freelancer = sb.table("freelancer_bookings").select("*").eq("freelancer_id", user["id"]).execute().data
    as_client = sb.table("freelancer_bookings").select("*").eq("client_id", user["id"]).execute().data
    return {"as_freelancer": as_freelancer, "as_client": as_client}

@api_router.post("/freelancer/bookings/{booking_id}/{action}")
def handle_booking(booking_id: str, action: str, user=Depends(get_current_user)):
    if action not in ["accept", "reject", "complete", "cancel"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    status_map = {"accept": "confirmed", "reject": "rejected", "complete": "completed", "cancel": "cancelled"}
    sb.table("freelancer_bookings").update({"status": status_map[action], "updated_at": datetime.now(timezone.utc).isoformat()}).eq("id", booking_id).execute()
    return {"message": f"Booking {status_map[action]}"}

# ============ VISA & INTERNATIONAL ============

@api_router.post("/visa-applications")
def create_visa_application(data: VisaApplicationCreate, user=Depends(get_current_user)):
    visa_id = str(uuid.uuid4())
    sb.table("visa_applications").insert({
        "id": visa_id, "user_id": user["id"], "user_name": user["full_name"],
        **data.model_dump(), "status": "submitted", "documents": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    return {"id": visa_id, "message": "Visa application submitted"}

@api_router.get("/visa-applications")
def get_my_visa_applications(user=Depends(get_current_user)):
    return sb.table("visa_applications").select("*").eq("user_id", user["id"]).execute().data

# ============ REFERRAL PROGRAMME ============

@api_router.get("/referral/code")
def get_referral_code(user=Depends(get_current_user)):
    u = sb_first(sb.table("users").select("referral_code").eq("id", user["id"]).execute())
    code = u.get("referral_code") if u else ""
    if not code:
        code = generate_referral_code(user["full_name"])
        sb.table("users").update({"referral_code": code}).eq("id", user["id"]).execute()
    return {"referral_code": code}

@api_router.get("/referral/stats")
def get_referral_stats(user=Depends(get_current_user)):
    referrals = sb.table("referrals").select("*").eq("referrer_id", user["id"]).execute().data
    total = len(referrals)
    tier = "none"
    for t, cfg in REFERRAL_TIERS.items():
        if cfg["min_referrals"] <= total <= cfg["max_referrals"]:
            tier = t
    if total == 0:
        tier = "none"
    total_bonus = sum(r.get("bonus_amount", 0) for r in referrals)
    paid_bonus = sum(r.get("bonus_amount", 0) for r in referrals if r.get("status") == "paid")
    pending_bonus = sum(r.get("bonus_amount", 0) for r in referrals if r.get("status") == "pending")
    workers_referred = len([r for r in referrals if r.get("referred_role") == "worker"])
    employers_referred = len([r for r in referrals if r.get("referred_role") == "employer"])
    u = sb_first(sb.table("users").select("referral_code").eq("id", user["id"]).execute())
    next_tier = None
    if tier == "none":
        next_tier = {"name": "bronze", "referrals_needed": 1}
    elif tier == "bronze":
        next_tier = {"name": "silver", "referrals_needed": 6 - total}
    elif tier == "silver":
        next_tier = {"name": "gold", "referrals_needed": 16 - total}
    return {
        "referral_code": u.get("referral_code", "") if u else "",
        "total_referrals": total, "tier": tier,
        "total_bonus": round(total_bonus, 2), "paid_bonus": round(paid_bonus, 2),
        "pending_bonus": round(pending_bonus, 2),
        "workers_referred": workers_referred, "employers_referred": employers_referred,
        "next_tier": next_tier, "tier_config": REFERRAL_TIERS.get(tier, REFERRAL_TIERS["bronze"])
    }

@api_router.get("/referral/history")
def get_referral_history(user=Depends(get_current_user)):
    return sb.table("referrals").select("*").eq("referrer_id", user["id"]).order("created_at", desc=True).limit(100).execute().data

@api_router.get("/admin/referrals")
def admin_get_referrals(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    referrals = sb.table("referrals").select("*").order("created_at", desc=True).limit(500).execute().data
    total_bonus = sum(r.get("bonus_amount", 0) for r in referrals)
    return {"referrals": referrals, "total_count": len(referrals), "total_bonus_liability": round(total_bonus, 2)}

# ============ ACADEMY ============

@api_router.get("/academy/categories")
def get_academy_categories():
    return {"categories": ACADEMY_CATEGORIES}

@api_router.post("/academy/courses")
def create_course(data: CourseCreate, user=Depends(get_current_user)):
    require_role(user, ["admin", "employer"])
    course_id = str(uuid.uuid4())
    sb.table("academy_courses").insert({
        "id": course_id, "creator_id": user["id"], "creator_name": user["full_name"],
        **data.model_dump(),
        "certificate_name": data.certificate_name or data.title,
        "status": "published" if user["role"] == "admin" else "pending_review",
        "enrollments_count": 0, "completions_count": 0, "rating": 0, "reviews_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    return {"id": course_id, "message": "Course created"}

@api_router.get("/academy/courses")
def browse_courses(category: Optional[str] = None, industry: Optional[str] = None, level: Optional[str] = None, free_only: Optional[bool] = None):
    q = sb.table("academy_courses").select("*").eq("status", "published")
    if category:
        q = q.eq("category", category)
    if industry:
        q = q.eq("industry", industry)
    if level:
        q = q.eq("level", level)
    if free_only:
        q = q.eq("price", 0)
    return q.order("enrollments_count", desc=True).limit(200).execute().data

@api_router.get("/academy/courses/{course_id}")
def get_course_detail(course_id: str):
    course = sb_first(sb.table("academy_courses").select("*").eq("id", course_id).execute())
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@api_router.post("/academy/courses/{course_id}/enroll")
def enroll_course(course_id: str, user=Depends(get_current_user)):
    course = sb_first(sb.table("academy_courses").select("*").eq("id", course_id).execute())
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    existing = sb_first(sb.table("enrollments").select("id").eq("course_id", course_id).eq("user_id", user["id"]).execute())
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")
    if course.get("price", 0) > 0:
        sub = sb_first(sb.table("academy_subscriptions").select("id").eq("user_id", user["id"]).eq("status", "active").execute())
        if not sub:
            return {"message": "Subscription or payment required", "requires_payment": True, "price": course["price"]}
    enrollment_id = str(uuid.uuid4())
    sb.table("enrollments").insert({
        "id": enrollment_id, "course_id": course_id, "user_id": user["id"],
        "user_name": user["full_name"], "course_title": course["title"],
        "progress": 0, "status": "enrolled", "completed_modules": [],
        "enrolled_at": datetime.now(timezone.utc).isoformat(), "completed_at": "", "certificate_id": ""
    }).execute()
    sb_inc("academy_courses", course_id, "enrollments_count")
    return {"message": "Enrolled successfully", "enrollment_id": enrollment_id}

@api_router.get("/academy/my-courses")
def get_my_courses(user=Depends(get_current_user)):
    enrollments = sb.table("enrollments").select("*").eq("user_id", user["id"]).execute().data
    for e in enrollments:
        course = sb_first(sb.table("academy_courses").select("*").eq("id", e["course_id"]).execute())
        if course:
            e["course"] = course
    return enrollments

@api_router.post("/academy/courses/{course_id}/complete")
def complete_course(course_id: str, user=Depends(get_current_user)):
    enrollment = sb_first(sb.table("enrollments").select("*").eq("course_id", course_id).eq("user_id", user["id"]).execute())
    if not enrollment:
        raise HTTPException(status_code=404, detail="Not enrolled")
    now = datetime.now(timezone.utc).isoformat()
    cert_id = str(uuid.uuid4())
    course = sb_first(sb.table("academy_courses").select("*").eq("id", course_id).execute())
    sb.table("enrollments").update({"status": "completed", "progress": 100, "completed_at": now, "certificate_id": cert_id}).eq("course_id", course_id).eq("user_id", user["id"]).execute()
    sb_inc("academy_courses", course_id, "completions_count")
    sb.table("certificates").insert({
        "id": cert_id, "user_id": user["id"], "user_name": user["full_name"],
        "course_id": course_id, "course_title": course["title"] if course else "",
        "certificate_name": course.get("certificate_name", course["title"]) if course else "",
        "industry": course.get("industry", "") if course else "",
        "issued_at": now, "status": "valid"
    }).execute()
    sb.table("documents").insert({
        "id": str(uuid.uuid4()), "user_id": user["id"], "doc_type": "Training Certificate",
        "doc_name": f"Academy: {course['title']}" if course else "Academy Certificate",
        "file_name": "academy_certificate.pdf", "file_type": "application/pdf", "file_data": "",
        "expiry_date": "", "status": "approved", "ai_review": {"source": "academy", "auto_approved": True},
        "ai_confidence": 100, "admin_notes": "Auto-approved academy certificate",
        "uploaded_at": now, "reviewed_at": now, "reviewed_by": ""
    }).execute()
    return {"message": "Course completed! Certificate issued.", "certificate_id": cert_id}

@api_router.get("/academy/certificates")
def get_my_certificates(user=Depends(get_current_user)):
    return sb.table("certificates").select("*").eq("user_id", user["id"]).execute().data

@api_router.get("/academy/subscription")
def get_subscription(user=Depends(get_current_user)):
    sub = sb_first(sb.table("academy_subscriptions").select("*").eq("user_id", user["id"]).eq("status", "active").execute())
    return {"subscription": sub, "plans": SUBSCRIPTION_PLANS}

@api_router.post("/academy/subscription")
def create_subscription(data: SubscriptionCreate, user=Depends(get_current_user)):
    if data.plan not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")
    plan = SUBSCRIPTION_PLANS[data.plan]
    now = datetime.now(timezone.utc)
    sub_id = str(uuid.uuid4())
    # Cancel existing
    sb.table("academy_subscriptions").update({"status": "cancelled"}).eq("user_id", user["id"]).execute()
    sb.table("academy_subscriptions").insert({
        "id": sub_id, "user_id": user["id"], "user_name": user["full_name"],
        "plan": data.plan, "price": plan["price"], "currency": plan["currency"],
        "status": "active",
        "started_at": now.isoformat(),
        "expires_at": (now + timedelta(days=plan["duration_days"])).isoformat()
    }).execute()
    return {"message": f"Subscribed to {plan['name']}", "subscription_id": sub_id}

@api_router.get("/academy/my-created-courses")
def get_my_created_courses(user=Depends(get_current_user)):
    require_role(user, ["admin", "employer"])
    return sb.table("academy_courses").select("*").eq("creator_id", user["id"]).order("created_at", desc=True).limit(100).execute().data

@api_router.get("/admin/academy")
def admin_get_academy(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    courses = sb.table("academy_courses").select("*").order("created_at", desc=True).limit(500).execute().data
    total_enrollments = sum(c.get("enrollments_count", 0) for c in courses)
    total_completions = sum(c.get("completions_count", 0) for c in courses)
    certs = sb_count("certificates")
    subs = sb_count("academy_subscriptions", status="active")
    return {"courses": courses, "stats": {"total_courses": len(courses), "total_enrollments": total_enrollments, "total_completions": total_completions, "certificates_issued": certs, "active_subscriptions": subs}}

# ============ EMPLOYER ROUTES ============

@api_router.post("/employer/organization")
def create_organization(data: OrganizationCreate, user=Depends(get_current_user)):
    require_role(user, ["employer"])
    org_id = str(uuid.uuid4())
    sb.table("organizations").insert({"id": org_id, "owner_id": user["id"], **data.model_dump(), "status": "active", "created_at": datetime.now(timezone.utc).isoformat()}).execute()
    return {"id": org_id, "message": "Organization created"}

@api_router.get("/employer/organization")
def get_employer_organizations(user=Depends(get_current_user)):
    require_role(user, ["employer"])
    return sb.table("organizations").select("*").eq("owner_id", user["id"]).execute().data

@api_router.post("/employer/shifts")
def create_shift(data: ShiftCreate, user=Depends(get_current_user)):
    require_role(user, ["employer"])
    shift_id = str(uuid.uuid4())
    sb.table("shifts").insert({
        "id": shift_id, "employer_id": user["id"], "employer_name": user["full_name"],
        **data.model_dump(), "status": "open", "filled_positions": 0, "applicants_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    return {"id": shift_id, "message": "Shift created"}

@api_router.get("/employer/shifts")
def get_employer_shifts(user=Depends(get_current_user)):
    require_role(user, ["employer"])
    shifts = sb.table("shifts").select("*").eq("employer_id", user["id"]).order("created_at", desc=True).limit(100).execute().data
    for s in shifts:
        s["applicants_count"] = sb_count("shift_applications", shift_id=s["id"])
    return shifts

@api_router.get("/employer/shifts/{shift_id}/applicants")
def get_shift_applicants(shift_id: str, user=Depends(get_current_user)):
    require_role(user, ["employer"])
    apps = sb.table("shift_applications").select("*").eq("shift_id", shift_id).eq("employer_id", user["id"]).execute().data
    for a in apps:
        a["worker"] = sb_first(sb.table("users").select("id,email,full_name,role,phone,country,status").eq("id", a["worker_id"]).execute())
        a["worker_profile"] = sb_first(sb.table("worker_profiles").select("*").eq("user_id", a["worker_id"]).execute())
    return apps

@api_router.post("/employer/applications/{app_id}/{action}")
def handle_shift_application(app_id: str, action: str, user=Depends(get_current_user)):
    require_role(user, ["employer"])
    if action == "accept":
        sb.table("shift_applications").update({"status": "accepted"}).eq("id", app_id).execute()
        application = sb_first(sb.table("shift_applications").select("*").eq("id", app_id).execute())
        if application:
            accepted = sb_count("shift_applications", shift_id=application["shift_id"], status="accepted")
            shift = sb_first(sb.table("shifts").select("positions").eq("id", application["shift_id"]).execute())
            new_status = "filled" if accepted >= (shift.get("positions", 1) if shift else 1) else "open"
            sb.table("shifts").update({"filled_positions": accepted, "status": new_status}).eq("id", application["shift_id"]).execute()
    elif action == "reject":
        sb.table("shift_applications").update({"status": "rejected"}).eq("id", app_id).execute()
    return {"message": f"Application {action}ed"}

@api_router.get("/employer/timesheets")
def get_employer_timesheets(user=Depends(get_current_user)):
    require_role(user, ["employer"])
    return sb.table("timesheets").select("*").eq("employer_id", user["id"]).execute().data

@api_router.post("/employer/timesheets/{ts_id}/{action}")
def handle_timesheet(ts_id: str, action: str, user=Depends(get_current_user)):
    require_role(user, ["employer"])
    status_map = {"approve": "approved", "reject": "rejected"}
    if action not in status_map:
        raise HTTPException(status_code=400, detail="Invalid action")
    sb.table("timesheets").update({"status": status_map[action], "approved_at": datetime.now(timezone.utc).isoformat()}).eq("id", ts_id).execute()
    return {"message": f"Timesheet {status_map[action]}"}

# ============ TIMESHEETS ============

@api_router.post("/timesheets")
def submit_timesheet(data: TimesheetSubmit, user=Depends(get_current_user)):
    require_role(user, ["worker"])
    shift = sb_first(sb.table("shifts").select("*").eq("id", data.shift_id).execute())
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    total_pay = round(data.hours_worked * shift["hourly_rate"], 2)
    ts_id = str(uuid.uuid4())
    sb.table("timesheets").insert({
        "id": ts_id, "shift_id": data.shift_id, "worker_id": user["id"],
        "worker_name": user["full_name"], "employer_id": shift["employer_id"],
        "shift_title": shift["title"], "date": shift["date"], "hours_worked": data.hours_worked,
        "break_minutes": data.break_minutes, "hourly_rate": shift["hourly_rate"],
        "total_pay": total_pay, "notes": data.notes or "", "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    return {"id": ts_id, "message": "Timesheet submitted", "total_pay": total_pay}

# ============ ADMIN ROUTES ============

@api_router.get("/admin/dashboard")
def get_admin_dashboard(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    workers = sb_count("users", role="worker")
    employers = sb_count("users", role="employer")
    total_shifts = sb_count("shifts")
    open_shifts = sb_count("shifts", status="open")
    pending_docs = sb_count("documents", status="pending")
    pending_ts = sb_count("timesheets", status="pending")
    perm_jobs = sb_count("permanent_jobs")
    placements = sb_count("student_placements")
    freelancers = sb_count("freelancer_services", status="active")
    visa_apps = sb_count("visa_applications")
    approved_ts = sb.table("timesheets").select("total_pay").eq("status", "approved").execute().data
    total_revenue = sum(t.get("total_pay", 0) for t in approved_ts)
    platform_commission = round(total_revenue * 0.15, 2)
    recent_shifts = sb.table("shifts").select("*").order("created_at", desc=True).limit(5).execute().data
    recent_apps = sb.table("shift_applications").select("*").order("applied_at", desc=True).limit(5).execute().data
    return {
        "stats": {
            "total_workers": workers, "total_employers": employers, "total_shifts": total_shifts,
            "open_shifts": open_shifts, "pending_documents": pending_docs, "pending_timesheets": pending_ts,
            "total_revenue": round(total_revenue, 2), "platform_commission": platform_commission,
            "permanent_jobs": perm_jobs, "student_placements": placements,
            "active_freelancers": freelancers, "visa_applications": visa_apps
        },
        "recent_shifts": recent_shifts, "recent_applications": recent_apps
    }

@api_router.get("/admin/workers")
def get_all_workers(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    workers = sb.table("users").select("id,email,full_name,role,phone,country,status,created_at").eq("role", "worker").limit(500).execute().data
    for w in workers:
        w["profile"] = sb_first(sb.table("worker_profiles").select("*").eq("user_id", w["id"]).execute())
    return workers

@api_router.get("/admin/employers")
def get_all_employers(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    employers = sb.table("users").select("id,email,full_name,role,phone,country,status,created_at").eq("role", "employer").limit(500).execute().data
    for e in employers:
        e["organizations"] = sb.table("organizations").select("*").eq("owner_id", e["id"]).execute().data
    return employers

@api_router.get("/admin/shifts")
def get_all_shifts(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    return sb.table("shifts").select("*").order("created_at", desc=True).limit(500).execute().data

@api_router.get("/admin/documents")
def get_all_documents(status: Optional[str] = None, user=Depends(get_current_user)):
    require_role(user, ["admin"])
    q = sb.table("documents").select("id,user_id,doc_type,doc_name,file_name,file_type,expiry_date,status,ai_review,ai_confidence,admin_notes,uploaded_at,reviewed_at,reviewed_by")
    if status:
        q = q.eq("status", status)
    docs = q.order("uploaded_at", desc=True).limit(500).execute().data
    for d in docs:
        w = sb_first(sb.table("users").select("full_name").eq("id", d["user_id"]).execute())
        d["worker_name"] = w["full_name"] if w else "Unknown"
    return docs

@api_router.post("/admin/documents/{doc_id}/{action}")
def admin_handle_document(doc_id: str, action: str, user=Depends(get_current_user)):
    require_role(user, ["admin"])
    status_map = {"approve": "approved", "reject": "rejected"}
    if action not in status_map:
        raise HTTPException(status_code=400, detail="Invalid action")
    sb.table("documents").update({"status": status_map[action], "reviewed_at": datetime.now(timezone.utc).isoformat(), "reviewed_by": user["id"]}).eq("id", doc_id).execute()
    return {"message": f"Document {status_map[action]}"}

@api_router.get("/admin/timesheets")
def get_all_timesheets(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    return sb.table("timesheets").select("*").order("submitted_at", desc=True).limit(500).execute().data

@api_router.get("/admin/finance")
def get_finance_dashboard(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    all_ts = sb.table("timesheets").select("*").execute().data
    total_gross = sum(t.get("total_pay", 0) for t in all_ts)
    approved_pay = sum(t.get("total_pay", 0) for t in all_ts if t.get("status") == "approved")
    pending_pay = sum(t.get("total_pay", 0) for t in all_ts if t.get("status") == "pending")
    commission_rate = 0.15
    platform_revenue = round(approved_pay * commission_rate, 2)
    return {
        "total_gross_pay": round(total_gross, 2), "approved_pay": round(approved_pay, 2),
        "pending_pay": round(pending_pay, 2), "platform_commission_rate": commission_rate,
        "platform_revenue": platform_revenue, "net_worker_pay": round(approved_pay * (1 - commission_rate), 2),
        "timesheets_count": len(all_ts),
        "approved_count": len([t for t in all_ts if t.get("status") == "approved"]),
        "pending_count": len([t for t in all_ts if t.get("status") == "pending"])
    }

@api_router.post("/admin/users/{user_id}/status")
def update_user_status(user_id: str, status: str = Query(...), user=Depends(get_current_user)):
    require_role(user, ["admin"])
    sb.table("users").update({"status": status}).eq("id", user_id).execute()
    return {"message": f"User status updated to {status}"}

@api_router.get("/admin/permanent-jobs")
def admin_get_permanent_jobs(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    return sb.table("permanent_jobs").select("*").order("created_at", desc=True).limit(500).execute().data

@api_router.get("/admin/placements")
def admin_get_placements(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    return sb.table("student_placements").select("*").order("created_at", desc=True).limit(500).execute().data

@api_router.get("/admin/freelancers")
def admin_get_freelancers(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    return sb.table("freelancer_services").select("*").order("created_at", desc=True).limit(500).execute().data

@api_router.get("/admin/visa-applications")
def admin_get_visa_applications(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    return sb.table("visa_applications").select("*").order("created_at", desc=True).limit(500).execute().data

# ============ AI DOCUMENT VERIFICATION ============

async def run_ai_document_check(doc_id, file_base64, content_type, doc_type, doc_name, worker_name):
    if not EMERGENT_LLM_KEY:
        logger.warning("No EMERGENT_LLM_KEY, skipping AI review")
        return
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"doc-review-{doc_id}",
            system_message="""You are a document verification specialist. Analyze uploaded documents and respond in JSON:
            {"document_type_confirmed":"string","extracted_name":"string or null","extracted_id_number":"string or null",
            "extracted_expiry":"string or null","quality":"clear|blurry|partial|unreadable",
            "fraud_flags":["list"],"confidence_score":0-100,"recommendation":"auto_approve|manual_review|reject",
            "summary":"brief explanation"}"""
        ).with_model("openai", "gpt-5.2")
        image_content = ImageContent(image_base64=file_base64)
        user_msg = UserMessage(text=f"Verify this document. Worker: {worker_name}. Type: {doc_type}. Name: {doc_name}.", file_contents=[image_content])
        response = await chat.send_message(user_msg)
        import json
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            ai_result = json.loads(response[json_start:json_end]) if json_start >= 0 else {"summary": response, "confidence_score": 50, "recommendation": "manual_review"}
        except (json.JSONDecodeError, ValueError):
            ai_result = {"summary": response, "confidence_score": 50, "recommendation": "manual_review"}
        new_status = "pending"
        if ai_result.get("recommendation") == "auto_approve" and ai_result.get("confidence_score", 0) >= 85:
            new_status = "approved"
        elif ai_result.get("recommendation") == "reject":
            new_status = "flagged"
        sb.table("documents").update({"ai_review": ai_result, "ai_confidence": ai_result.get("confidence_score", 0), "status": new_status}).eq("id", doc_id).execute()
        logger.info(f"AI review for doc {doc_id}: confidence={ai_result.get('confidence_score')}")
    except Exception as e:
        logger.error(f"AI doc check failed: {e}")
        sb.table("documents").update({"ai_review": {"error": str(e)}, "status": "pending"}).eq("id", doc_id).execute()

# ============ AGENCY ROUTES ============

@api_router.post("/agency/register")
def register_agency(data: AgencyCreate, user=Depends(get_current_user)):
    require_role(user, ["agency"])
    existing = sb_first(sb.table("agencies").select("id").eq("owner_id", user["id"]).execute())
    if existing:
        raise HTTPException(status_code=400, detail="Agency already registered")
    agency_id = str(uuid.uuid4())
    sb.table("agencies").insert({
        "id": agency_id, "owner_id": user["id"], "name": data.name, "industry": data.industry,
        "description": data.description or "", "address": data.address or "", "city": data.city or "",
        "postcode": data.postcode or "", "phone": data.phone or "", "email": data.email or user["email"],
        "website": data.website or "", "logo_url": "", "commission_rate": 15,
        "subscription_plan": "basic", "worker_pool_count": 0, "active_shifts": 0,
        "total_placements": 0, "total_revenue": 0, "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    return {"id": agency_id, "message": "Agency registered. Pending admin approval."}

@api_router.get("/agency/profile")
def get_agency_profile(user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("*").eq("owner_id", user["id"]).execute())
    if not agency:
        return {"agency": None, "setup_required": True}
    return {"agency": agency, "setup_required": False}

@api_router.put("/agency/profile")
def update_agency_profile(data: AgencyCreate, user=Depends(get_current_user)):
    require_role(user, ["agency"])
    update = {k: v for k, v in data.model_dump().items() if v is not None}
    sb.table("agencies").update(update).eq("owner_id", user["id"]).execute()
    return sb_first(sb.table("agencies").select("*").eq("owner_id", user["id"]).execute())

@api_router.get("/agency/dashboard")
def get_agency_dashboard(user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("*").eq("owner_id", user["id"]).execute())
    if not agency:
        return {"agency": None, "stats": {}}
    aid = agency["id"]
    total_shifts = sb_count("shifts", agency_id=aid)
    open_shifts = len(sb.table("shifts").select("id").eq("agency_id", aid).eq("status", "open").execute().data)
    total_jobs = sb_count("permanent_jobs", agency_id=aid)
    workers = sb.table("worker_profiles").select("id").eq("agency_id", aid).execute().data
    worker_count = len(workers)
    applications = sb.table("shift_applications").select("id").eq("employer_id", user["id"]).execute().data
    ts = sb.table("timesheets").select("total_pay,status").eq("employer_id", user["id"]).execute().data
    total_revenue = sum(t.get("total_pay", 0) for t in ts if t.get("status") == "approved")
    pending_pay = sum(t.get("total_pay", 0) for t in ts if t.get("status") == "pending")
    commission = round(total_revenue * (agency.get("commission_rate", 15) / 100), 2)
    return {
        "agency": agency,
        "stats": {
            "total_shifts": total_shifts, "open_shifts": open_shifts,
            "total_jobs": total_jobs, "worker_pool": worker_count,
            "total_applications": len(applications),
            "total_revenue": round(total_revenue, 2), "pending_pay": round(pending_pay, 2),
            "platform_commission": commission,
            "net_revenue": round(total_revenue - commission, 2)
        }
    }

@api_router.post("/agency/shifts")
def create_agency_shift(data: ShiftCreate, user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("id,name,status").eq("owner_id", user["id"]).execute())
    if not agency:
        raise HTTPException(status_code=400, detail="Register your agency first")
    if agency["status"] != "active":
        raise HTTPException(status_code=403, detail="Agency not yet approved")
    shift_id = str(uuid.uuid4())
    sb.table("shifts").insert({
        "id": shift_id, "employer_id": user["id"], "employer_name": agency["name"],
        "agency_id": agency["id"],
        **data.model_dump(), "status": "open", "filled_positions": 0, "applicants_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    return {"id": shift_id, "message": "Shift created"}

@api_router.get("/agency/shifts")
def get_agency_shifts(user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("id").eq("owner_id", user["id"]).execute())
    if not agency:
        return []
    shifts = sb.table("shifts").select("*").eq("agency_id", agency["id"]).order("created_at", desc=True).limit(200).execute().data
    for s in shifts:
        s["applicants_count"] = sb_count("shift_applications", shift_id=s["id"])
    return shifts

@api_router.post("/agency/permanent-jobs")
def create_agency_job(data: PermanentJobCreate, user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("id,name,status").eq("owner_id", user["id"]).execute())
    if not agency:
        raise HTTPException(status_code=400, detail="Register your agency first")
    if agency["status"] != "active":
        raise HTTPException(status_code=403, detail="Agency not yet approved")
    job_id = str(uuid.uuid4())
    sb.table("permanent_jobs").insert({
        "id": job_id, "employer_id": user["id"], "employer_name": agency["name"],
        "agency_id": agency["id"],
        **data.model_dump(), "status": "open", "applicants_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }).execute()
    return {"id": job_id, "message": "Permanent job posted"}

@api_router.get("/agency/permanent-jobs")
def get_agency_jobs(user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("id").eq("owner_id", user["id"]).execute())
    if not agency:
        return []
    return sb.table("permanent_jobs").select("*").eq("agency_id", agency["id"]).order("created_at", desc=True).limit(200).execute().data

@api_router.get("/agency/workers")
def get_agency_workers(user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("id").eq("owner_id", user["id"]).execute())
    if not agency:
        return []
    profiles = sb.table("worker_profiles").select("*").eq("agency_id", agency["id"]).execute().data
    result = []
    for p in profiles:
        w = sb_first(sb.table("users").select("id,email,full_name,phone,country,status").eq("id", p["user_id"]).execute())
        if w:
            w["profile"] = p
            result.append(w)
    return result

@api_router.post("/agency/invite-worker")
def invite_worker_to_agency(data: AgencyInviteWorker, user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("id").eq("owner_id", user["id"]).execute())
    if not agency:
        raise HTTPException(status_code=400, detail="Register your agency first")
    worker_user = sb_first(sb.table("users").select("id").eq("email", data.worker_email).eq("role", "worker").execute())
    if not worker_user:
        raise HTTPException(status_code=404, detail="Worker not found with that email")
    profile = sb_first(sb.table("worker_profiles").select("id,agency_id").eq("user_id", worker_user["id"]).execute())
    if profile and profile.get("agency_id") and profile["agency_id"] == agency["id"]:
        raise HTTPException(status_code=400, detail="Worker already in your pool")
    sb.table("worker_profiles").update({"agency_id": agency["id"]}).eq("user_id", worker_user["id"]).execute()
    sb_inc("agencies", agency["id"], "worker_pool_count")
    return {"message": f"Worker added to your pool"}

@api_router.post("/agency/remove-worker/{worker_id}")
def remove_worker_from_agency(worker_id: str, user=Depends(get_current_user)):
    require_role(user, ["agency"])
    agency = sb_first(sb.table("agencies").select("id").eq("owner_id", user["id"]).execute())
    if not agency:
        raise HTTPException(status_code=400, detail="No agency")
    sb.table("worker_profiles").update({"agency_id": ""}).eq("user_id", worker_id).eq("agency_id", agency["id"]).execute()
    return {"message": "Worker removed from pool"}

@api_router.get("/agency/applicants")
def get_agency_applicants(user=Depends(get_current_user)):
    require_role(user, ["agency"])
    apps = sb.table("shift_applications").select("*").eq("employer_id", user["id"]).order("applied_at", desc=True).limit(200).execute().data
    for a in apps:
        a["worker"] = sb_first(sb.table("users").select("id,email,full_name,phone,country,status").eq("id", a["worker_id"]).execute())
        a["shift"] = sb_first(sb.table("shifts").select("title,date,location,hourly_rate").eq("id", a["shift_id"]).execute())
    return apps

@api_router.post("/agency/applications/{app_id}/{action}")
def handle_agency_application(app_id: str, action: str, user=Depends(get_current_user)):
    require_role(user, ["agency"])
    if action not in ["accept", "reject"]:
        raise HTTPException(status_code=400, detail="Invalid action")
    status = "accepted" if action == "accept" else "rejected"
    sb.table("shift_applications").update({"status": status}).eq("id", app_id).execute()
    if action == "accept":
        application = sb_first(sb.table("shift_applications").select("shift_id").eq("id", app_id).execute())
        if application:
            accepted = sb_count("shift_applications", shift_id=application["shift_id"], status="accepted")
            shift = sb_first(sb.table("shifts").select("positions").eq("id", application["shift_id"]).execute())
            if shift and accepted >= shift.get("positions", 1):
                sb.table("shifts").update({"filled_positions": accepted, "status": "filled"}).eq("id", application["shift_id"]).execute()
    return {"message": f"Application {status}"}

@api_router.get("/agency/timesheets")
def get_agency_timesheets(user=Depends(get_current_user)):
    require_role(user, ["agency"])
    return sb.table("timesheets").select("*").eq("employer_id", user["id"]).execute().data

@api_router.get("/agency/shared-workers")
def browse_shared_workers(industry: Optional[str] = None, user=Depends(get_current_user)):
    require_role(user, ["agency"])
    q = sb.table("worker_profiles").select("*").eq("compliance_status", "approved")
    if industry:
        q = q.contains("industries", [industry])
    profiles = q.limit(200).execute().data
    result = []
    for p in profiles:
        w = sb_first(sb.table("users").select("id,full_name,country,status").eq("id", p["user_id"]).execute())
        if w:
            w["profile"] = p
            result.append(w)
    return result

# ============ ADMIN AGENCY MANAGEMENT ============

@api_router.get("/admin/agencies")
def admin_get_agencies(user=Depends(get_current_user)):
    require_role(user, ["admin"])
    agencies = sb.table("agencies").select("*").order("created_at", desc=True).limit(500).execute().data
    for a in agencies:
        owner = sb_first(sb.table("users").select("full_name,email").eq("id", a["owner_id"]).execute())
        a["owner_name"] = owner["full_name"] if owner else "Unknown"
        a["owner_email"] = owner["email"] if owner else ""
    return agencies

@api_router.post("/admin/agencies/{agency_id}/approve")
def admin_approve_agency(agency_id: str, user=Depends(get_current_user)):
    require_role(user, ["admin"])
    sb.table("agencies").update({"status": "active"}).eq("id", agency_id).execute()
    return {"message": "Agency approved"}

@api_router.post("/admin/agencies/{agency_id}/suspend")
def admin_suspend_agency(agency_id: str, user=Depends(get_current_user)):
    require_role(user, ["admin"])
    sb.table("agencies").update({"status": "suspended"}).eq("id", agency_id).execute()
    return {"message": "Agency suspended"}

@api_router.post("/admin/agencies/{agency_id}/commission")
def admin_set_commission(agency_id: str, rate: float = Query(...), user=Depends(get_current_user)):
    require_role(user, ["admin"])
    sb.table("agencies").update({"commission_rate": rate}).eq("id", agency_id).execute()
    return {"message": f"Commission rate set to {rate}%"}

# ============ SEED DATA ============

@api_router.post("/seed")
def seed_data():
    existing = sb_first(sb.table("users").select("id").eq("email", "admin@everduty.com").execute())
    if existing:
        return {"message": "Data already seeded"}

    admin_id, emp_id, worker_id, uni_id = str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4()), str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    users = [
        {"id": admin_id, "email": "admin@everduty.com", "hashed_password": hash_password("admin123"), "full_name": "System Administrator", "role": "admin", "status": "active", "phone": "+44 20 7946 0958", "country": "GB", "referral_code": "", "referred_by": "", "created_at": now, "updated_at": now},
        {"id": emp_id, "email": "employer@careplus.com", "hashed_password": hash_password("employer123"), "full_name": "Sarah Mitchell", "role": "employer", "status": "active", "phone": "+44 20 7946 1234", "country": "GB", "referral_code": "", "referred_by": "", "created_at": now, "updated_at": now},
        {"id": worker_id, "email": "worker@email.com", "hashed_password": hash_password("worker123"), "full_name": "James Thompson", "role": "worker", "status": "active", "phone": "+44 7700 900123", "country": "GB", "referral_code": "", "referred_by": "", "created_at": now, "updated_at": now},
        {"id": uni_id, "email": "university@oxford.ac.uk", "hashed_password": hash_password("university123"), "full_name": "Oxford Admissions", "role": "employer", "status": "active", "phone": "+44 1865 270000", "country": "GB", "referral_code": "", "referred_by": "", "created_at": now, "updated_at": now},
    ]
    sb.table("users").insert(users).execute()

    sb.table("worker_profiles").insert({
        "id": str(uuid.uuid4()), "user_id": worker_id, "skills": ["Patient Care", "First Aid", "Manual Handling"],
        "industries": ["Healthcare", "Social Care"], "bio": "Experienced healthcare worker with 5 years in care settings.",
        "location": "London", "hourly_rate": 15.50, "availability": {"monday": True, "tuesday": True, "wednesday": True, "thursday": True, "friday": True},
        "compliance_status": "approved", "documents_count": 2, "rating": 4.7, "shifts_completed": 47,
        "is_freelancer": True, "is_student": False, "country": "GB", "created_at": now
    }).execute()

    sb.table("organizations").insert([
        {"id": str(uuid.uuid4()), "owner_id": emp_id, "name": "CarePlus Healthcare Ltd", "industry": "Healthcare", "address": "45 King Street", "city": "London", "postcode": "EC2V 8AD", "phone": "+44 20 7946 1234", "description": "Leading healthcare staffing provider", "country": "GB", "org_type": "employer", "status": "active", "created_at": now},
        {"id": str(uuid.uuid4()), "owner_id": uni_id, "name": "University of Oxford", "industry": "Education Support", "address": "Wellington Square", "city": "Oxford", "postcode": "OX1 2JD", "phone": "+44 1865 270000", "description": "World-leading university", "country": "GB", "org_type": "university", "status": "active", "created_at": now},
    ]).execute()

    shifts_data = [
        {"title": "Night Nurse - ICU Ward", "industry": "Healthcare", "role": "Nurse", "location": "St Thomas Hospital, London", "date": "2026-02-20", "start_time": "20:00", "end_time": "08:00", "hourly_rate": 25.00, "positions": 3, "urgent": True, "country": "GB", "currency": "GBP"},
        {"title": "Care Assistant - Day Shift", "industry": "Social Care", "role": "Care Assistant", "location": "Sunrise Care Home, Manchester", "date": "2026-02-21", "start_time": "07:00", "end_time": "19:00", "hourly_rate": 14.50, "positions": 2, "urgent": False, "country": "GB", "currency": "GBP"},
        {"title": "Kitchen Porter - Evening", "industry": "Hospitality", "role": "Kitchen Porter", "location": "The Grand Hotel, Birmingham", "date": "2026-02-22", "start_time": "16:00", "end_time": "23:00", "hourly_rate": 12.00, "positions": 1, "urgent": False, "country": "GB", "currency": "GBP"},
        {"title": "Warehouse Operative", "industry": "Warehousing", "role": "Warehouse Operative", "location": "Amazon FC, Coventry", "date": "2026-02-23", "start_time": "06:00", "end_time": "14:00", "hourly_rate": 13.50, "positions": 5, "urgent": True, "country": "GB", "currency": "GBP"},
        {"title": "Security Guard - Night", "industry": "Security", "role": "Security Guard", "location": "Westfield, London", "date": "2026-02-24", "start_time": "22:00", "end_time": "06:00", "hourly_rate": 16.00, "positions": 2, "urgent": False, "country": "GB", "currency": "GBP"},
        {"title": "Office Receptionist", "industry": "Office & Admin", "role": "Receptionist", "location": "Deloitte, Canary Wharf", "date": "2026-02-25", "start_time": "09:00", "end_time": "17:00", "hourly_rate": 14.00, "positions": 1, "urgent": False, "country": "GB", "currency": "GBP"},
    ]
    sb.table("shifts").insert([{
        "id": str(uuid.uuid4()), "employer_id": emp_id, "employer_name": "Sarah Mitchell",
        **s, "description": f"Seeking experienced {s['role']}.", "requirements": [], "notes": "",
        "status": "open", "filled_positions": 0, "applicants_count": 0, "created_at": now
    } for s in shifts_data]).execute()

    perm_jobs = [
        {"title": "Senior Staff Nurse", "industry": "Healthcare", "role": "Nurse", "description": "Permanent senior nurse position in a leading London hospital.", "location": "London", "salary_min": 35000, "salary_max": 45000, "salary_type": "annual", "job_type": "full-time", "visa_sponsorship": True, "remote_option": "on-site", "country": "GB", "currency": "GBP", "experience_years": 3},
        {"title": "Warehouse Manager", "industry": "Warehousing", "role": "Manager", "description": "Lead a team of 50+ warehouse operatives.", "location": "Coventry", "salary_min": 32000, "salary_max": 40000, "salary_type": "annual", "job_type": "full-time", "visa_sponsorship": False, "remote_option": "on-site", "country": "GB", "currency": "GBP", "experience_years": 5},
        {"title": "Remote IT Support Specialist", "industry": "Technology", "role": "IT Support", "description": "Work remotely providing IT support across multiple facilities.", "location": "Remote, UK", "salary_min": 28000, "salary_max": 35000, "salary_type": "annual", "job_type": "full-time", "visa_sponsorship": False, "remote_option": "remote", "country": "GB", "currency": "GBP", "experience_years": 2},
        {"title": "Head Chef", "industry": "Hospitality", "role": "Chef", "description": "Lead kitchen operations at a 5-star hotel in Dubai.", "location": "Dubai", "salary_min": 180000, "salary_max": 240000, "salary_type": "annual", "job_type": "full-time", "visa_sponsorship": True, "remote_option": "on-site", "country": "AE", "currency": "AED", "experience_years": 7},
    ]
    sb.table("permanent_jobs").insert([{
        "id": str(uuid.uuid4()), "employer_id": emp_id, "employer_name": "Sarah Mitchell",
        **j, "requirements": [], "benefits": ["Pension", "Healthcare", "Annual Leave"],
        "status": "open", "applicants_count": 0, "created_at": now
    } for j in perm_jobs]).execute()

    placements = [
        {"title": "MSc Nursing - International Intake", "university_name": "University of Oxford", "program": "MSc Nursing Science", "description": "2-year nursing program with clinical placements.", "location": "Oxford", "country": "GB", "duration_months": 24, "tuition_fee": 28000, "currency": "GBP", "intake": "September 2026", "scholarship_available": True, "visa_support": True, "placement_type": "university"},
        {"title": "BSc Computer Science", "university_name": "University of Manchester", "program": "BSc Computer Science", "description": "Top-ranked CS program with industry placement year.", "location": "Manchester", "country": "GB", "duration_months": 36, "tuition_fee": 25000, "currency": "GBP", "intake": "September 2026", "scholarship_available": True, "visa_support": True, "placement_type": "university"},
        {"title": "Hospitality Management Diploma", "university_name": "Le Cordon Bleu London", "program": "Diploma in Hospitality Management", "description": "Intensive hospitality training.", "location": "London", "country": "GB", "duration_months": 12, "tuition_fee": 18000, "currency": "GBP", "intake": "January 2027", "scholarship_available": False, "visa_support": True, "placement_type": "vocational"},
        {"title": "Summer Internship - Finance", "university_name": "Goldman Sachs Academy", "program": "Summer Analyst Programme", "description": "10-week paid internship.", "location": "London", "country": "GB", "duration_months": 3, "tuition_fee": 0, "currency": "GBP", "intake": "June 2026", "scholarship_available": False, "visa_support": True, "placement_type": "internship"},
    ]
    sb.table("student_placements").insert([{
        "id": str(uuid.uuid4()), "creator_id": uni_id, "creator_name": "Oxford Admissions",
        **p, "requirements": [], "status": "open", "applicants_count": 0, "created_at": now
    } for p in placements]).execute()

    freelancer_services = [
        {"title": "Experienced Nanny - Full Day Care", "category": "Nanny", "description": "Ofsted registered nanny with 8 years experience.", "hourly_rate": 18.00, "fixed_price": 0, "pricing_type": "hourly", "location": "London", "remote_available": False, "experience_years": 8, "country": "GB", "currency": "GBP"},
        {"title": "Piano & Guitar Lessons", "category": "Piano Instructor", "description": "ABRSM Grade 8 qualified.", "hourly_rate": 35.00, "fixed_price": 0, "pricing_type": "hourly", "location": "Manchester", "remote_available": True, "experience_years": 12, "country": "GB", "currency": "GBP"},
        {"title": "Professional House Cleaning", "category": "House Cleaner", "description": "Deep cleaning, regular cleaning, end-of-tenancy.", "hourly_rate": 15.00, "fixed_price": 0, "pricing_type": "hourly", "location": "Birmingham", "remote_available": False, "experience_years": 5, "country": "GB", "currency": "GBP"},
        {"title": "Personal Fitness Training", "category": "Personal Trainer", "description": "Certified PT specialising in weight loss.", "hourly_rate": 45.00, "fixed_price": 0, "pricing_type": "hourly", "location": "London", "remote_available": True, "experience_years": 6, "country": "GB", "currency": "GBP"},
        {"title": "Mobile Dog Grooming", "category": "Pet Groomer", "description": "Full grooming service at your door.", "hourly_rate": 0, "fixed_price": 40.00, "pricing_type": "fixed", "location": "Leeds", "remote_available": False, "experience_years": 4, "country": "GB", "currency": "GBP"},
        {"title": "Website Development & Design", "category": "Web Developer", "description": "Full-stack developer. React, Node.js, Python.", "hourly_rate": 55.00, "fixed_price": 0, "pricing_type": "hourly", "location": "Remote", "remote_available": True, "experience_years": 7, "country": "GB", "currency": "GBP"},
    ]
    sb.table("freelancer_services").insert([{
        "id": str(uuid.uuid4()), "freelancer_id": worker_id, "freelancer_name": "James Thompson",
        **fs, "status": "active", "rating": 4.8, "reviews_count": 23, "bookings_count": 47, "created_at": now
    } for fs in freelancer_services]).execute()

    sb.table("visa_applications").insert({
        "id": str(uuid.uuid4()), "user_id": worker_id, "user_name": "James Thompson",
        "visa_type": "skilled_worker", "destination_country": "GB", "current_country": "NG",
        "purpose": "Healthcare worker visa for nursing position", "notes": "NMC registration pending",
        "status": "submitted", "documents": [], "created_at": now
    }).execute()

    sb.table("timesheets").insert([
        {"id": str(uuid.uuid4()), "shift_id": "sample", "worker_id": worker_id, "worker_name": "James Thompson", "employer_id": emp_id, "shift_title": "Care Assistant - Morning", "date": "2026-02-15", "hours_worked": 8.0, "break_minutes": 30, "hourly_rate": 14.50, "total_pay": 116.00, "notes": "Completed all duties", "status": "approved", "submitted_at": now},
        {"id": str(uuid.uuid4()), "shift_id": "sample2", "worker_id": worker_id, "worker_name": "James Thompson", "employer_id": emp_id, "shift_title": "Night Nurse - Ward B", "date": "2026-02-18", "hours_worked": 12.0, "break_minutes": 60, "hourly_rate": 25.00, "total_pay": 300.00, "notes": "", "status": "pending", "submitted_at": now},
    ]).execute()

    # Academy Courses
    courses = [
        {"title": "First Aid at Work", "category": "Healthcare", "industry": "Healthcare", "description": "HSE-approved 3-day first aid course.", "duration_hours": 18, "level": "beginner", "price": 0, "is_certified": True, "modules": ["Scene Assessment", "CPR & AED", "Wound Care", "Choking", "Shock Management"]},
        {"title": "Manual Handling", "category": "Healthcare", "industry": "Healthcare", "description": "Learn safe lifting and moving techniques.", "duration_hours": 4, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Infection Prevention & Control", "category": "Healthcare", "industry": "Healthcare", "description": "Comprehensive IPC training.", "duration_hours": 6, "level": "beginner", "price": 15, "is_certified": True},
        {"title": "Basic Life Support (BLS)", "category": "Healthcare", "industry": "Healthcare", "description": "Resuscitation Council UK-aligned BLS training.", "duration_hours": 4, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Medication Administration", "category": "Healthcare", "industry": "Healthcare", "description": "Safe medication handling and administration.", "duration_hours": 8, "level": "intermediate", "price": 45, "is_certified": True},
        {"title": "Mental Health First Aid", "category": "Healthcare", "industry": "Healthcare", "description": "MHFA England certified course.", "duration_hours": 12, "level": "intermediate", "price": 65, "is_certified": True},
        {"title": "Dementia Awareness", "category": "Social Care", "industry": "Social Care", "description": "Understanding dementia types.", "duration_hours": 4, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Safeguarding Adults", "category": "Social Care", "industry": "Social Care", "description": "Recognise abuse indicators.", "duration_hours": 4, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Safeguarding Children", "category": "Education", "industry": "Education", "description": "Level 1 safeguarding.", "duration_hours": 3, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Food Hygiene Level 2", "category": "Hospitality", "industry": "Hospitality", "description": "Essential for all food handlers.", "duration_hours": 6, "level": "beginner", "price": 25, "is_certified": True},
        {"title": "Food Hygiene Level 3", "category": "Hospitality", "industry": "Hospitality", "description": "Advanced food safety for supervisors.", "duration_hours": 18, "level": "advanced", "price": 85, "is_certified": True},
        {"title": "Allergen Awareness", "category": "Hospitality", "industry": "Hospitality", "description": "Understanding the 14 allergens.", "duration_hours": 2, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Barista Training", "category": "Hospitality", "industry": "Hospitality", "description": "Professional coffee making.", "duration_hours": 8, "level": "beginner", "price": 35, "is_certified": True},
        {"title": "SIA Door Supervision", "category": "Security", "industry": "Security", "description": "4-day SIA licence-linked course.", "duration_hours": 30, "level": "beginner", "price": 195, "is_certified": True},
        {"title": "CCTV Operations", "category": "Security", "industry": "Security", "description": "SIA CCTV licence-linked training.", "duration_hours": 18, "level": "beginner", "price": 145, "is_certified": True},
        {"title": "Counter Terrorism Awareness", "category": "Security", "industry": "Security", "description": "ACT awareness training.", "duration_hours": 2, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "CSCS Health & Safety", "category": "Construction", "industry": "Construction", "description": "CITB-approved training.", "duration_hours": 8, "level": "beginner", "price": 35, "is_certified": True},
        {"title": "Working at Heights", "category": "Construction", "industry": "Construction", "description": "Safe working at height procedures.", "duration_hours": 4, "level": "intermediate", "price": 45, "is_certified": True},
        {"title": "Asbestos Awareness", "category": "Construction", "industry": "Construction", "description": "Category A asbestos awareness.", "duration_hours": 4, "level": "beginner", "price": 25, "is_certified": True},
        {"title": "Forklift Operation (FLT)", "category": "Transport & Logistics", "industry": "Warehousing", "description": "RTITB-accredited operator training.", "duration_hours": 24, "level": "beginner", "price": 175, "is_certified": True},
        {"title": "Driver CPC", "category": "Transport & Logistics", "industry": "Transport & Logistics", "description": "35-hour periodic training for drivers.", "duration_hours": 35, "level": "intermediate", "price": 225, "is_certified": True},
        {"title": "Warehouse Safety", "category": "Warehousing", "industry": "Warehousing", "description": "Safe warehouse operations.", "duration_hours": 4, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Health & Safety at Work", "category": "General", "industry": "General", "description": "IOSH-aligned fundamentals.", "duration_hours": 6, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Fire Safety Awareness", "category": "General", "industry": "General", "description": "Fire prevention and evacuation.", "duration_hours": 2, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "GDPR Compliance", "category": "General", "industry": "General", "description": "Data protection principles.", "duration_hours": 3, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Equality & Diversity", "category": "General", "industry": "General", "description": "Understanding protected characteristics.", "duration_hours": 2, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Microsoft Office Suite", "category": "Office & Admin", "industry": "Office & Admin", "description": "Excel, Word, PowerPoint, Outlook.", "duration_hours": 12, "level": "beginner", "price": 35, "is_certified": True},
        {"title": "Cyber Security Basics", "category": "Technology", "industry": "Technology", "description": "Essential cyber security awareness.", "duration_hours": 4, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Leadership & Management Level 3", "category": "Leadership", "industry": "General", "description": "ILM-aligned leadership programme.", "duration_hours": 24, "level": "advanced", "price": 150, "is_certified": True},
        {"title": "COSHH Awareness", "category": "Cleaning", "industry": "Cleaning", "description": "Control of Substances Hazardous to Health.", "duration_hours": 3, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Customer Service Excellence", "category": "Retail", "industry": "Retail", "description": "Deliver outstanding customer experiences.", "duration_hours": 4, "level": "beginner", "price": 0, "is_certified": True},
        {"title": "Pesticide Application (PA1/PA6)", "category": "Farming", "industry": "Farming", "description": "Safe use of pesticides.", "duration_hours": 12, "level": "intermediate", "price": 85, "is_certified": True},
    ]
    sb.table("academy_courses").insert([{
        "id": str(uuid.uuid4()), "creator_id": admin_id, "creator_name": "System Administrator",
        **c, "currency": "GBP", "certificate_name": c["title"],
        "modules": c.get("modules", []), "prerequisites": [], "learning_outcomes": [],
        "status": "published", "enrollments_count": 0, "completions_count": 0,
        "rating": 0, "reviews_count": 0, "created_at": now
    } for c in courses]).execute()

    # Demo Agency
    agency_user_id = str(uuid.uuid4())
    agency_id = str(uuid.uuid4())
    sb.table("users").insert({
        "id": agency_user_id, "email": "agency@swiftstaff.co.uk", "hashed_password": hash_password("agency123"),
        "full_name": "Tom Richards", "role": "agency", "status": "active",
        "phone": "+44 7700 900456", "country": "GB", "referral_code": "", "referred_by": "",
        "created_at": now, "updated_at": now
    }).execute()
    sb.table("agencies").insert({
        "id": agency_id, "owner_id": agency_user_id, "name": "SwiftStaff Recruitment",
        "industry": "Healthcare", "description": "Leading healthcare staffing agency serving NHS trusts and private hospitals across the UK.",
        "address": "12 Baker Street", "city": "London", "postcode": "W1U 3BW",
        "phone": "+44 20 7946 5678", "email": "agency@swiftstaff.co.uk", "website": "https://swiftstaff.co.uk",
        "logo_url": "", "commission_rate": 15, "subscription_plan": "basic",
        "worker_pool_count": 0, "active_shifts": 0, "total_placements": 0, "total_revenue": 0,
        "status": "active", "created_at": now
    }).execute()

    return {"message": "Demo data seeded successfully", "accounts": {
        "admin": {"email": "admin@everduty.com", "password": "admin123"},
        "employer": {"email": "employer@careplus.com", "password": "employer123"},
        "worker": {"email": "worker@email.com", "password": "worker123"},
        "university": {"email": "university@oxford.ac.uk", "password": "university123"},
        "agency": {"email": "agency@swiftstaff.co.uk", "password": "agency123"}
    }}

# ============ APP SETUP ============

app.include_router(api_router)
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','), allow_methods=["*"], allow_headers=["*"])
