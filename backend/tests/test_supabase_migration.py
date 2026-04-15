"""
Tests for EverDuty Flex - Supabase Migration (Iteration 4)
Testing: All core functionality after MongoDB to Supabase PostgreSQL migration
Covers: Auth, Worker, Employer, Admin, Shifts, Permanent Jobs, Freelancer, Placements, Referrals, Academy
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_CREDS = {"email": "admin@everduty.com", "password": "admin123"}
EMPLOYER_CREDS = {"email": "employer@careplus.com", "password": "employer123"}
WORKER_CREDS = {"email": "worker@email.com", "password": "worker123"}
UNIVERSITY_CREDS = {"email": "university@oxford.ac.uk", "password": "university123"}


# =========== AUTH TESTS ===========
class TestAuth:
    """Authentication endpoint tests - Supabase migration"""

    def test_auth_me_returns_401_without_token(self):
        """GET /api/auth/me returns 401 when no token provided"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"

    def test_worker_login(self):
        """POST /api/auth/login - Worker login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=WORKER_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "worker"
        assert data["user"]["email"] == WORKER_CREDS["email"]

    def test_employer_login(self):
        """POST /api/auth/login - Employer login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=EMPLOYER_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "employer"

    def test_admin_login(self):
        """POST /api/auth/login - Admin login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"

    def test_auth_me_returns_user_with_valid_token(self):
        """GET /api/auth/me returns user data with valid token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json=WORKER_CREDS)
        token = login_response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == WORKER_CREDS["email"]
        assert data["role"] == "worker"
        assert "full_name" in data

    def test_invalid_login(self):
        """POST /api/auth/login - Invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "wrong@test.com", "password": "wrong"})
        assert response.status_code == 401


# =========== PUBLIC SHIFTS ===========
class TestPublicShifts:
    """Public shift browsing - no auth required"""

    def test_public_shifts_returns_shifts(self):
        """GET /api/shifts/public returns 6 shifts"""
        response = requests.get(f"{BASE_URL}/api/shifts/public")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 6, f"Expected at least 6 shifts, got {len(data)}"
        print(f"Public shifts count: {len(data)}")

    def test_public_shifts_structure(self):
        """Verify shift data structure"""
        response = requests.get(f"{BASE_URL}/api/shifts/public")
        shifts = response.json()
        if shifts:
            shift = shifts[0]
            required_fields = ["id", "title", "industry", "location", "date", "hourly_rate", "status"]
            for field in required_fields:
                assert field in shift, f"Missing field: {field}"


# =========== WORKER FEATURES ===========
class TestWorkerFeatures:
    """Worker portal features"""

    @pytest.fixture
    def worker_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=WORKER_CREDS)
        if response.status_code == 200:
            return {"Authorization": f"Bearer {response.json()['token']}"}
        pytest.skip("Worker login failed")

    def test_worker_profile(self, worker_headers):
        """GET /api/worker/profile returns worker profile"""
        response = requests.get(f"{BASE_URL}/api/worker/profile", headers=worker_headers)
        assert response.status_code == 200
        data = response.json()
        assert "skills" in data
        assert "industries" in data
        assert "shifts_completed" in data
        assert "rating" in data
        print(f"Worker profile: shifts_completed={data['shifts_completed']}, rating={data['rating']}")

    def test_worker_earnings(self, worker_headers):
        """GET /api/worker/earnings returns earnings data"""
        response = requests.get(f"{BASE_URL}/api/worker/earnings", headers=worker_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_earned" in data
        assert "pending_amount" in data

    def test_worker_browse_shifts(self, worker_headers):
        """GET /api/worker/shifts returns available shifts"""
        response = requests.get(f"{BASE_URL}/api/worker/shifts", headers=worker_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_worker_my_shifts(self, worker_headers):
        """GET /api/worker/my-shifts returns worker's shifts"""
        response = requests.get(f"{BASE_URL}/api/worker/my-shifts", headers=worker_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_worker_apply_for_shift(self, worker_headers):
        """POST /api/worker/shifts/{id}/apply - Apply for a shift"""
        # Get available shifts
        response = requests.get(f"{BASE_URL}/api/shifts/public")
        shifts = response.json()
        if not shifts:
            pytest.skip("No shifts available")
        
        shift_id = shifts[0]["id"]
        response = requests.post(f"{BASE_URL}/api/worker/shifts/{shift_id}/apply", headers=worker_headers)
        # Success or already applied
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        print(f"Shift application status: {response.status_code}")


# =========== PERMANENT JOBS ===========
class TestPermanentJobs:
    """Permanent jobs browsing and application"""

    @pytest.fixture
    def worker_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=WORKER_CREDS)
        if response.status_code == 200:
            return {"Authorization": f"Bearer {response.json()['token']}"}
        pytest.skip("Worker login failed")

    def test_browse_permanent_jobs(self, worker_headers):
        """GET /api/permanent-jobs returns permanent jobs"""
        response = requests.get(f"{BASE_URL}/api/permanent-jobs", headers=worker_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Permanent jobs count: {len(data)}")


# =========== FREELANCER MARKETPLACE ===========
class TestFreelancerMarketplace:
    """Freelancer services browsing"""

    def test_browse_freelancer_services(self):
        """GET /api/freelancer/browse returns freelancer services"""
        response = requests.get(f"{BASE_URL}/api/freelancer/browse")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Freelancer services count: {len(data)}")

    def test_freelancer_categories(self):
        """GET /api/freelancer-categories returns categories"""
        response = requests.get(f"{BASE_URL}/api/freelancer-categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 100


# =========== STUDENT PLACEMENTS ===========
class TestStudentPlacements:
    """Student placements browsing"""

    @pytest.fixture
    def worker_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=WORKER_CREDS)
        if response.status_code == 200:
            return {"Authorization": f"Bearer {response.json()['token']}"}
        pytest.skip("Worker login failed")

    def test_browse_placements(self, worker_headers):
        """GET /api/placements returns student placements"""
        response = requests.get(f"{BASE_URL}/api/placements", headers=worker_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Student placements count: {len(data)}")


# =========== REFERRAL PROGRAMME ===========
class TestReferralProgramme:
    """Referral code and stats"""

    @pytest.fixture
    def worker_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=WORKER_CREDS)
        if response.status_code == 200:
            return {"Authorization": f"Bearer {response.json()['token']}"}
        pytest.skip("Worker login failed")

    def test_get_referral_code(self, worker_headers):
        """GET /api/referral/code returns referral code"""
        response = requests.get(f"{BASE_URL}/api/referral/code", headers=worker_headers)
        assert response.status_code == 200
        data = response.json()
        assert "referral_code" in data
        assert data["referral_code"].startswith("ED-")
        print(f"Referral code: {data['referral_code']}")

    def test_get_referral_stats(self, worker_headers):
        """GET /api/referral/stats returns stats"""
        response = requests.get(f"{BASE_URL}/api/referral/stats", headers=worker_headers)
        assert response.status_code == 200
        data = response.json()
        assert "tier" in data
        assert "total_referrals" in data


# =========== ACADEMY ===========
class TestAcademy:
    """Training Academy features"""

    @pytest.fixture
    def worker_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=WORKER_CREDS)
        if response.status_code == 200:
            return {"Authorization": f"Bearer {response.json()['token']}"}
        pytest.skip("Worker login failed")

    def test_browse_academy_courses(self):
        """GET /api/academy/courses returns 32 courses"""
        response = requests.get(f"{BASE_URL}/api/academy/courses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 30, f"Expected at least 30 courses, got {len(data)}"
        print(f"Academy courses count: {len(data)}")

    def test_enroll_in_course(self, worker_headers):
        """POST /api/academy/courses/{id}/enroll - Enroll in a free course"""
        # Get free courses
        response = requests.get(f"{BASE_URL}/api/academy/courses", params={"free_only": True})
        courses = response.json()
        
        # Get enrolled courses
        my_courses = requests.get(f"{BASE_URL}/api/academy/my-courses", headers=worker_headers)
        enrolled_ids = [e["course_id"] for e in my_courses.json()]
        
        available = [c for c in courses if c["id"] not in enrolled_ids]
        if not available:
            pytest.skip("No available free courses")
        
        course_id = available[0]["id"]
        response = requests.post(f"{BASE_URL}/api/academy/courses/{course_id}/enroll", headers=worker_headers)
        assert response.status_code in [200, 400]
        print(f"Enrollment status: {response.status_code}")

    def test_get_my_courses(self, worker_headers):
        """GET /api/academy/my-courses returns enrolled courses"""
        response = requests.get(f"{BASE_URL}/api/academy/my-courses", headers=worker_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Enrolled courses: {len(data)}")

    def test_get_certificates(self, worker_headers):
        """GET /api/academy/certificates returns certificates"""
        response = requests.get(f"{BASE_URL}/api/academy/certificates", headers=worker_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Certificates: {len(data)}")


# =========== EMPLOYER FEATURES ===========
class TestEmployerFeatures:
    """Employer portal features"""

    @pytest.fixture
    def employer_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=EMPLOYER_CREDS)
        if response.status_code == 200:
            return {"Authorization": f"Bearer {response.json()['token']}"}
        pytest.skip("Employer login failed")

    def test_employer_shifts(self, employer_headers):
        """GET /api/employer/shifts returns employer's shifts (6 shifts)"""
        response = requests.get(f"{BASE_URL}/api/employer/shifts", headers=employer_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 6, f"Expected at least 6 shifts, got {len(data)}"
        print(f"Employer shifts: {len(data)}")

    def test_employer_permanent_jobs(self, employer_headers):
        """GET /api/employer/permanent-jobs returns jobs"""
        response = requests.get(f"{BASE_URL}/api/employer/permanent-jobs", headers=employer_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_employer_referral_code(self, employer_headers):
        """GET /api/referral/code for employer"""
        response = requests.get(f"{BASE_URL}/api/referral/code", headers=employer_headers)
        assert response.status_code == 200
        data = response.json()
        assert "referral_code" in data

    def test_employer_academy_courses(self, employer_headers):
        """GET /api/academy/my-created-courses"""
        response = requests.get(f"{BASE_URL}/api/academy/my-created-courses", headers=employer_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)


# =========== ADMIN FEATURES ===========
class TestAdminFeatures:
    """Admin dashboard and management"""

    @pytest.fixture
    def admin_headers(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if response.status_code == 200:
            return {"Authorization": f"Bearer {response.json()['token']}"}
        pytest.skip("Admin login failed")

    def test_admin_dashboard(self, admin_headers):
        """GET /api/admin/dashboard returns 12 stats"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data
        stats = data["stats"]
        # Verify all 12 expected stats
        expected_stats = [
            "total_workers", "total_employers", "total_shifts", "open_shifts",
            "pending_documents", "pending_timesheets", "total_revenue", "platform_commission",
            "permanent_jobs", "student_placements", "active_freelancers", "visa_applications"
        ]
        for stat in expected_stats:
            assert stat in stats, f"Missing stat: {stat}"
        print(f"Admin stats: workers={stats['total_workers']}, employers={stats['total_employers']}, shifts={stats['total_shifts']}")

    def test_admin_workers(self, admin_headers):
        """GET /api/admin/workers returns workers list"""
        response = requests.get(f"{BASE_URL}/api/admin/workers", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin workers count: {len(data)}")

    def test_admin_employers(self, admin_headers):
        """GET /api/admin/employers returns employers list"""
        response = requests.get(f"{BASE_URL}/api/admin/employers", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin employers count: {len(data)}")

    def test_admin_shifts(self, admin_headers):
        """GET /api/admin/shifts returns all shifts"""
        response = requests.get(f"{BASE_URL}/api/admin/shifts", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Admin shifts count: {len(data)}")

    def test_admin_finance(self, admin_headers):
        """GET /api/admin/finance returns finance dashboard"""
        response = requests.get(f"{BASE_URL}/api/admin/finance", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "total_gross_pay" in data
        assert "platform_revenue" in data

    def test_admin_referrals(self, admin_headers):
        """GET /api/admin/referrals returns referrals overview"""
        response = requests.get(f"{BASE_URL}/api/admin/referrals", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "referrals" in data
        assert "total_count" in data

    def test_admin_academy(self, admin_headers):
        """GET /api/admin/academy returns academy overview with stats"""
        response = requests.get(f"{BASE_URL}/api/admin/academy", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "courses" in data
        assert "stats" in data
        stats = data["stats"]
        assert "total_courses" in stats
        assert "total_enrollments" in stats
        print(f"Admin academy: courses={stats['total_courses']}, enrollments={stats['total_enrollments']}")


# =========== REFERENCE DATA ===========
class TestReferenceData:
    """Static reference data endpoints"""

    def test_get_industries(self):
        """GET /api/industries returns industries list"""
        response = requests.get(f"{BASE_URL}/api/industries")
        assert response.status_code == 200
        data = response.json()
        assert "industries" in data
        assert len(data["industries"]) >= 15

    def test_get_countries(self):
        """GET /api/countries returns countries list"""
        response = requests.get(f"{BASE_URL}/api/countries")
        assert response.status_code == 200
        data = response.json()
        assert "countries" in data
        assert len(data["countries"]) >= 15


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
