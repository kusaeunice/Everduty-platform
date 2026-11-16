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

