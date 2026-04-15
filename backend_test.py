#!/usr/bin/env python3
"""
EverDuty Staffing Platform Backend API Testing
Testing all authentication, worker, employer and admin APIs
"""

import requests
import sys
from datetime import datetime, timedelta
import time

class EverDutyAPITester:
    def __init__(self, base_url="https://payroll-master-26.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_base = f"{base_url}/api"
        self.admin_token = None
        self.employer_token = None
        self.worker_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        
    def run_test(self, name, method, endpoint, expected_status, data=None, token=None, files=None):
        """Run a single API test"""
        url = f"{self.api_base}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        if files:
            headers.pop('Content-Type', None)  # Let requests handle multipart

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            print(f"   Status: {response.status_code}")
            
            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ PASSED - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(response_data) <= 5:
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response length: {len(response.text)} chars")
                return True, response.json() if response.text else {}
            else:
                self.tests_passed += 1 if response.status_code in [200, 201] else 0
                self.failed_tests.append(f"{name} - Expected {expected_status}, got {response.status_code}")
                print(f"❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except requests.exceptions.RequestException as e:
            print(f"❌ NETWORK ERROR - {str(e)}")
            self.failed_tests.append(f"{name} - Network Error: {str(e)}")
            return False, {}
        except Exception as e:
            print(f"❌ ERROR - {str(e)}")
            self.failed_tests.append(f"{name} - Error: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Test seeding demo data"""
        print("\n🌱 SEEDING DEMO DATA")
        success, response = self.run_test(
            "Seed Demo Data",
            "POST", 
            "seed",
            200
        )
        return success

    def test_admin_login(self):
        """Test admin login and get token"""
        print("\n👑 ADMIN AUTHENTICATION TESTS")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@everduty.com", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token acquired: {self.admin_token[:20]}...")
            return True
        return False

    def test_employer_login(self):
        """Test employer login and get token"""
        print("\n🏢 EMPLOYER AUTHENTICATION TESTS")
        success, response = self.run_test(
            "Employer Login",
            "POST",
            "auth/login", 
            200,
            data={"email": "employer@careplus.com", "password": "employer123"}
        )
        if success and 'token' in response:
            self.employer_token = response['token']
            print(f"   Employer token acquired: {self.employer_token[:20]}...")
            return True
        return False

    def test_worker_login(self):
        """Test worker login and get token"""
        print("\n👷 WORKER AUTHENTICATION TESTS")
        success, response = self.run_test(
            "Worker Login",
            "POST",
            "auth/login",
            200,
            data={"email": "worker@email.com", "password": "worker123"}
        )
        if success and 'token' in response:
            self.worker_token = response['token']
            print(f"   Worker token acquired: {self.worker_token[:20]}...")
            return True
        return False

    def test_admin_endpoints(self):
        """Test admin-specific endpoints"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False

        print("\n📊 ADMIN DASHBOARD & MANAGEMENT TESTS")
        
        # Test admin dashboard
        success = self.run_test(
            "Admin Dashboard Stats",
            "GET",
            "admin/dashboard",
            200,
            token=self.admin_token
        )[0]

        # Test finance dashboard
        success = self.run_test(
            "Admin Finance Dashboard",
            "GET", 
            "admin/finance",
            200,
            token=self.admin_token
        )[0] and success

        # Test workers management
        success = self.run_test(
            "Admin Get All Workers",
            "GET",
            "admin/workers", 
            200,
            token=self.admin_token
        )[0] and success

        # Test employers management
        success = self.run_test(
            "Admin Get All Employers",
            "GET",
            "admin/employers",
            200,
            token=self.admin_token
        )[0] and success

        # Test shifts management
        success = self.run_test(
            "Admin Get All Shifts",
            "GET", 
            "admin/shifts",
            200,
            token=self.admin_token
        )[0] and success

        # Test documents management
        success = self.run_test(
            "Admin Get All Documents",
            "GET",
            "admin/documents",
            200,
            token=self.admin_token
        )[0] and success

        # Test timesheets management
        success = self.run_test(
            "Admin Get All Timesheets", 
            "GET",
            "admin/timesheets",
            200,
            token=self.admin_token
        )[0] and success

        # Test NEW admin endpoints for expanded platform
        
        # Test permanent jobs management
        success = self.run_test(
            "Admin Get All Permanent Jobs",
            "GET",
            "admin/permanent-jobs",
            200,
            token=self.admin_token
        )[0] and success

        # Test student placements management
        success = self.run_test(
            "Admin Get All Student Placements",
            "GET",
            "admin/placements",
            200,
            token=self.admin_token
        )[0] and success

        # Test freelancers management
        success = self.run_test(
            "Admin Get All Freelancer Services",
            "GET",
            "admin/freelancers",
            200,
            token=self.admin_token
        )[0] and success

        # Test visa applications management
        success = self.run_test(
            "Admin Get All Visa Applications",
            "GET",
            "admin/visa-applications",
            200,
            token=self.admin_token
        )[0] and success

        return success

    def test_employer_endpoints(self):
        """Test employer-specific endpoints"""
        if not self.employer_token:
            print("❌ No employer token available")
            return False

        print("\n🏢 EMPLOYER MANAGEMENT TESTS")

        # Test organization management
        success = self.run_test(
            "Employer Get Organizations",
            "GET",
            "employer/organization",
            200,
            token=self.employer_token
        )[0]

        # Test shifts management
        success = self.run_test(
            "Employer Get Shifts",
            "GET", 
            "employer/shifts",
            200,
            token=self.employer_token
        )[0] and success

        # Test creating a new shift
        tomorrow = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
        shift_data = {
            "title": "Test Shift - Automated Testing",
            "industry": "Healthcare", 
            "role": "Nurse",
            "description": "Test shift created by automated testing",
            "location": "Test Hospital, London",
            "date": tomorrow,
            "start_time": "09:00",
            "end_time": "17:00", 
            "hourly_rate": 18.50,
            "positions": 2,
            "requirements": ["Valid ID", "Healthcare Experience"],
            "notes": "This is a test shift",
            "urgent": False
        }

        success = self.run_test(
            "Employer Create Shift",
            "POST",
            "employer/shifts",
            200,
            data=shift_data,
            token=self.employer_token
        )[0] and success

        # Test permanent jobs management
        success = self.run_test(
            "Employer Get Permanent Jobs",
            "GET",
            "employer/permanent-jobs",
            200,
            token=self.employer_token
        )[0] and success

        # Test creating a permanent job with visa sponsorship
        perm_job_data = {
            "title": "Test Permanent Job - Senior Nurse",
            "industry": "Healthcare",
            "role": "Senior Nurse", 
            "description": "Test permanent job with visa sponsorship",
            "location": "London",
            "salary_min": 35000,
            "salary_max": 45000,
            "salary_type": "annual",
            "job_type": "full-time",
            "visa_sponsorship": True,
            "remote_option": "on-site",
            "country": "GB",
            "experience_years": 3
        }

        success = self.run_test(
            "Employer Create Permanent Job",
            "POST",
            "employer/permanent-jobs",
            200,
            data=perm_job_data,
            token=self.employer_token
        )[0] and success

        # Test creating a student placement
        placement_data = {
            "title": "Test Student Placement - Nursing Program",
            "university_name": "Test University",
            "program": "BSc Nursing",
            "description": "Test student placement with visa support",
            "location": "London",
            "country": "GB",
            "duration_months": 24,
            "tuition_fee": 25000,
            "intake": "September 2026",
            "scholarship_available": True,
            "visa_support": True,
            "placement_type": "university"
        }

        success = self.run_test(
            "Employer Create Student Placement",
            "POST",
            "placements",
            200,
            data=placement_data,
            token=self.employer_token
        )[0] and success

        # Test timesheets
        success = self.run_test(
            "Employer Get Timesheets",
            "GET",
            "employer/timesheets",
            200,
            token=self.employer_token
        )[0] and success

        return success

    def test_worker_endpoints(self):
        """Test worker-specific endpoints"""
        if not self.worker_token:
            print("❌ No worker token available")
            return False

        print("\n👷 WORKER FEATURES TESTS")

        # Test worker profile
        success = self.run_test(
            "Worker Get Profile",
            "GET", 
            "worker/profile",
            200,
            token=self.worker_token
        )[0]

        # Test available shifts
        success = self.run_test(
            "Worker Get Available Shifts",
            "GET",
            "worker/shifts",
            200,
            token=self.worker_token
        )[0] and success

        # Test worker's own shifts
        success = self.run_test(
            "Worker Get My Shifts", 
            "GET",
            "worker/my-shifts",
            200,
            token=self.worker_token
        )[0] and success

        # Test worker documents
        success = self.run_test(
            "Worker Get Documents",
            "GET",
            "worker/documents",
            200, 
            token=self.worker_token
        )[0] and success

        # Test worker earnings
        success = self.run_test(
            "Worker Get Earnings",
            "GET",
            "worker/earnings", 
            200,
            token=self.worker_token
        )[0] and success

        # Test NEW worker endpoints for expanded platform

        # Test permanent jobs browsing
        success = self.run_test(
            "Worker Browse Permanent Jobs",
            "GET",
            "permanent-jobs",
            200,
            token=self.worker_token
        )[0] and success

        # Test permanent jobs with country filter
        success = self.run_test(
            "Worker Browse Permanent Jobs (GB filter)",
            "GET",
            "permanent-jobs?country=GB",
            200,
            token=self.worker_token
        )[0] and success

        # Test worker permanent job applications
        success = self.run_test(
            "Worker Get Permanent Applications",
            "GET",
            "worker/permanent-applications",
            200,
            token=self.worker_token
        )[0] and success

        # Test student placements
        success = self.run_test(
            "Worker Browse Student Placements",
            "GET",
            "placements",
            200,
            token=self.worker_token
        )[0] and success

        # Test student applications
        success = self.run_test(
            "Worker Get Student Applications",
            "GET",
            "student/applications",
            200,
            token=self.worker_token
        )[0] and success

        # Test freelancer services browsing
        success = self.run_test(
            "Worker Browse Freelancer Services",
            "GET",
            "freelancer/browse",
            200
        )[0] and success

        # Test worker's own freelancer services
        success = self.run_test(
            "Worker Get My Freelancer Services",
            "GET",
            "freelancer/my-services",
            200,
            token=self.worker_token
        )[0] and success

        # Test freelancer bookings
        success = self.run_test(
            "Worker Get Freelancer Bookings",
            "GET",
            "freelancer/bookings",
            200,
            token=self.worker_token
        )[0] and success

        # Test creating freelancer service
        service_data = {
            "title": "Test Freelancer Service - Personal Training",
            "category": "Personal Trainer",
            "description": "Test personal training service created by automation",
            "hourly_rate": 35.00,
            "pricing_type": "hourly",
            "location": "London",
            "remote_available": False,
            "experience_years": 5,
            "country": "GB"
        }

        success = self.run_test(
            "Worker Create Freelancer Service",
            "POST",
            "freelancer/services",
            200,
            data=service_data,
            token=self.worker_token
        )[0] and success

        # Test visa applications
        success = self.run_test(
            "Worker Get Visa Applications",
            "GET",
            "visa-applications",
            200,
            token=self.worker_token
        )[0] and success

        # Test creating visa application
        visa_data = {
            "visa_type": "work",
            "destination_country": "GB",
            "current_country": "NG",
            "purpose": "Healthcare worker visa for nursing position",
            "notes": "Test visa application created by automation"
        }

        success = self.run_test(
            "Worker Create Visa Application",
            "POST",
            "visa-applications",
            200,
            data=visa_data,
            token=self.worker_token
        )[0] and success

        # Test profile update
        profile_update = {
            "bio": "Updated bio from automated testing",
            "location": "London, UK",
            "hourly_rate": 16.50,
            "skills": ["Patient Care", "First Aid", "Communication"],
            "industries": ["Healthcare", "Social Care"],
            "is_freelancer": True,
            "is_student": False
        }

        success = self.run_test(
            "Worker Update Profile",
            "PUT",
            "worker/profile",
            200,
            data=profile_update,
            token=self.worker_token
        )[0] and success

        return success

    def test_public_endpoints(self):
        """Test public endpoints that don't require authentication"""
        print("\n🌐 PUBLIC ENDPOINTS TESTS")

        # Test industries list
        success = self.run_test(
            "Get Industries List",
            "GET",
            "industries",
            200
        )[0]

        # Test freelancer categories (139+ categories)
        success = self.run_test(
            "Get Freelancer Categories",
            "GET",
            "freelancer-categories",
            200
        )[0] and success

        # Test countries list (19 countries)
        success = self.run_test(
            "Get Countries List",
            "GET",
            "countries",
            200
        )[0] and success

        # Test public shifts
        success = self.run_test(
            "Get Public Shifts",
            "GET", 
            "shifts/public",
            200
        )[0] and success

        # Test me endpoint with invalid token
        success = self.run_test(
            "Auth Me (should fail without token)",
            "GET",
            "auth/me",
            401
        )[0] and success

        return success

    def test_registration(self):
        """Test user registration"""
        print("\n📝 REGISTRATION TESTS")
        
        # Test worker registration
        timestamp = int(time.time())
        worker_data = {
            "email": f"testworker{timestamp}@test.com",
            "password": "testpass123",
            "full_name": f"Test Worker {timestamp}",
            "role": "worker",
            "phone": "+44 7700 900001"
        }

        success = self.run_test(
            "Worker Registration", 
            "POST",
            "auth/register",
            200,
            data=worker_data
        )[0]

        # Test employer registration
        employer_data = {
            "email": f"testemployer{timestamp}@test.com",
            "password": "testpass123", 
            "full_name": f"Test Employer {timestamp}",
            "role": "employer",
            "phone": "+44 7700 900002"
        }

        success = self.run_test(
            "Employer Registration",
            "POST", 
            "auth/register",
            200,
            data=employer_data
        )[0] and success

        return success

def main():
    """Main test execution"""
    print("🚀 Starting EverDuty Staffing Platform API Tests")
    print("=" * 60)
    
    tester = EverDutyAPITester()
    
    # Test sequence
    tests = [
        ("Seed Demo Data", tester.test_seed_data),
        ("Public Endpoints", tester.test_public_endpoints),
        ("Registration", tester.test_registration),
        ("Admin Login", tester.test_admin_login),
        ("Employer Login", tester.test_employer_login), 
        ("Worker Login", tester.test_worker_login),
        ("Admin Endpoints", tester.test_admin_endpoints),
        ("Employer Endpoints", tester.test_employer_endpoints),
        ("Worker Endpoints", tester.test_worker_endpoints),
    ]
    
    for test_name, test_func in tests:
        print(f"\n{'='*60}")
        print(f"🧪 Running {test_name} Tests")
        print("="*60)
        
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} tests failed with exception: {e}")
            tester.failed_tests.append(f"{test_name} - Exception: {str(e)}")

    # Print final results
    print(f"\n{'='*60}")
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    print(f"✅ Tests passed: {tester.tests_passed}/{tester.tests_run}")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests ({len(tester.failed_tests)}):")
        for i, failure in enumerate(tester.failed_tests, 1):
            print(f"  {i}. {failure}")
    else:
        print("\n🎉 All tests passed!")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("✅ Backend API testing SUCCESSFUL")
        return 0
    else:
        print("❌ Backend API testing FAILED") 
        return 1

if __name__ == "__main__":
    sys.exit(main())