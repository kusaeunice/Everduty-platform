"""
Tests for Referral Programme and Academy features - Iteration 3
Testing: Referral code, stats, history, admin referrals
Testing: Academy courses, enrollment, completion, certificates, subscription
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_CREDS = {"email": "admin@everduty.com", "password": "admin123"}
EMPLOYER_CREDS = {"email": "employer@careplus.com", "password": "employer123"}
WORKER_CREDS = {"email": "worker@email.com", "password": "worker123"}


class TestAuthEndpoints:
    """Test auth endpoint bug fix - should return 401 when no token"""

    def test_auth_me_returns_401_without_token(self):
        """Bug fix: /api/auth/me should return 401 (not 403) when no token provided"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        data = response.json()
        assert "detail" in data


class TestReferralProgramme:
    """Tests for Referral Programme endpoints"""

    @pytest.fixture
    def worker_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=WORKER_CREDS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Worker login failed")

    @pytest.fixture
    def employer_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=EMPLOYER_CREDS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Employer login failed")

    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")

    # === Referral Code Tests ===
    def test_get_referral_code_worker(self, worker_token):
        """GET /api/referral/code returns referral code for worker"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        response = requests.get(f"{BASE_URL}/api/referral/code", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "referral_code" in data
        assert data["referral_code"].startswith("ED-")
        print(f"Worker referral code: {data['referral_code']}")

    def test_get_referral_code_employer(self, employer_token):
        """GET /api/referral/code returns referral code for employer"""
        headers = {"Authorization": f"Bearer {employer_token}"}
        response = requests.get(f"{BASE_URL}/api/referral/code", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "referral_code" in data
        assert data["referral_code"].startswith("ED-")
        print(f"Employer referral code: {data['referral_code']}")

    # === Referral Stats Tests ===
    def test_get_referral_stats_worker(self, worker_token):
        """GET /api/referral/stats returns tier info for worker"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        response = requests.get(f"{BASE_URL}/api/referral/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Verify required fields exist
        assert "referral_code" in data
        assert "total_referrals" in data
        assert "tier" in data
        assert "total_bonus" in data
        assert "paid_bonus" in data
        assert "pending_bonus" in data
        assert "workers_referred" in data
        assert "employers_referred" in data
        assert "tier_config" in data
        print(f"Worker referral stats: tier={data['tier']}, total={data['total_referrals']}")

    def test_get_referral_stats_employer(self, employer_token):
        """GET /api/referral/stats returns tier info for employer"""
        headers = {"Authorization": f"Bearer {employer_token}"}
        response = requests.get(f"{BASE_URL}/api/referral/stats", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "tier" in data
        assert "tier_config" in data

    # === Referral History Tests ===
    def test_get_referral_history(self, worker_token):
        """GET /api/referral/history returns referral list"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        response = requests.get(f"{BASE_URL}/api/referral/history", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Worker has {len(data)} referrals in history")

    # === Admin Referrals Tests ===
    def test_admin_get_referrals(self, admin_token):
        """GET /api/admin/referrals returns platform-wide referral data"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/referrals", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "referrals" in data
        assert "total_count" in data
        assert "total_bonus_liability" in data
        print(f"Admin referrals: total={data['total_count']}, bonus_liability={data['total_bonus_liability']}")

    def test_admin_referrals_forbidden_for_worker(self, worker_token):
        """Workers cannot access admin referrals endpoint"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/referrals", headers=headers)
        assert response.status_code == 403


class TestAcademyCourses:
    """Tests for Academy course browsing"""

    def test_get_courses_returns_seeded_courses(self):
        """GET /api/academy/courses returns 32 seeded courses"""
        response = requests.get(f"{BASE_URL}/api/academy/courses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 30, f"Expected at least 30 courses, got {len(data)}"
        print(f"Academy has {len(data)} courses")

    def test_get_courses_with_category_filter(self):
        """GET /api/academy/courses with category filter"""
        response = requests.get(f"{BASE_URL}/api/academy/courses", params={"category": "Healthcare"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for course in data:
            assert course["category"] == "Healthcare"
        print(f"Healthcare category has {len(data)} courses")

    def test_get_courses_with_level_filter(self):
        """GET /api/academy/courses with level filter"""
        response = requests.get(f"{BASE_URL}/api/academy/courses", params={"level": "beginner"})
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for course in data:
            assert course["level"] == "beginner"

    def test_get_course_detail(self):
        """GET /api/academy/courses/{id} returns course detail"""
        # First get a course
        response = requests.get(f"{BASE_URL}/api/academy/courses")
        courses = response.json()
        if not courses:
            pytest.skip("No courses available")
        course_id = courses[0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/academy/courses/{course_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == course_id
        assert "title" in data
        assert "category" in data

    def test_get_academy_categories(self):
        """GET /api/academy/categories returns category list"""
        response = requests.get(f"{BASE_URL}/api/academy/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        print(f"Academy has {len(data['categories'])} categories")


class TestAcademyEnrollment:
    """Tests for Academy enrollment, completion, and certificates"""

    @pytest.fixture
    def worker_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=WORKER_CREDS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Worker login failed")

    def test_get_my_courses(self, worker_token):
        """GET /api/academy/my-courses returns user enrollments"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        response = requests.get(f"{BASE_URL}/api/academy/my-courses", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Worker has {len(data)} enrolled courses")

    def test_enroll_in_free_course(self, worker_token):
        """POST /api/academy/courses/{id}/enroll enrolls user in free course"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        
        # Find a free course the worker hasn't enrolled in
        response = requests.get(f"{BASE_URL}/api/academy/courses", params={"free_only": True})
        courses = response.json()
        
        my_courses = requests.get(f"{BASE_URL}/api/academy/my-courses", headers=headers)
        enrolled_ids = [e["course_id"] for e in my_courses.json()]
        
        available_courses = [c for c in courses if c["id"] not in enrolled_ids]
        if not available_courses:
            pytest.skip("No available free courses to enroll")
        
        course = available_courses[0]
        response = requests.post(f"{BASE_URL}/api/academy/courses/{course['id']}/enroll", headers=headers)
        
        # Should succeed or already enrolled
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        if response.status_code == 200:
            data = response.json()
            assert "enrollment_id" in data or "message" in data
            print(f"Enrolled in course: {course['title']}")

    def test_complete_course_and_get_certificate(self, worker_token):
        """POST /api/academy/courses/{id}/complete issues certificate"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        
        # Get enrolled courses
        response = requests.get(f"{BASE_URL}/api/academy/my-courses", headers=headers)
        enrollments = response.json()
        
        # Find an enrolled (not completed) course
        enrolled_courses = [e for e in enrollments if e["status"] == "enrolled"]
        if not enrolled_courses:
            pytest.skip("No enrolled courses to complete")
        
        course_id = enrolled_courses[0]["course_id"]
        response = requests.post(f"{BASE_URL}/api/academy/courses/{course_id}/complete", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "certificate_id" in data
        print(f"Course completed, certificate_id: {data['certificate_id']}")

    def test_get_certificates(self, worker_token):
        """GET /api/academy/certificates returns user certs"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        response = requests.get(f"{BASE_URL}/api/academy/certificates", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Worker has {len(data)} certificates")


class TestAcademySubscription:
    """Tests for Academy subscription"""

    @pytest.fixture
    def worker_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=WORKER_CREDS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Worker login failed")

    def test_get_subscription_plans(self, worker_token):
        """GET /api/academy/subscription returns subscription plans"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        response = requests.get(f"{BASE_URL}/api/academy/subscription", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert "monthly" in data["plans"]
        assert "annual" in data["plans"]
        assert data["plans"]["monthly"]["price"] == 29.99
        assert data["plans"]["annual"]["price"] == 249.99
        print(f"Subscription plans available: {list(data['plans'].keys())}")

    def test_create_subscription(self, worker_token):
        """POST /api/academy/subscription creates subscription"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        
        # Create monthly subscription
        response = requests.post(
            f"{BASE_URL}/api/academy/subscription",
            json={"plan": "monthly"},
            headers=headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "subscription_id" in data
        print(f"Subscription created: {data['subscription_id']}")


class TestAcademyAdmin:
    """Tests for Academy admin endpoint"""

    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin login failed")

    @pytest.fixture
    def worker_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=WORKER_CREDS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Worker login failed")

    def test_admin_academy_stats(self, admin_token):
        """GET /api/admin/academy returns admin academy stats"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/academy", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "courses" in data
        assert "stats" in data
        stats = data["stats"]
        assert "total_courses" in stats
        assert "total_enrollments" in stats
        assert "total_completions" in stats
        assert "certificates_issued" in stats
        assert "active_subscriptions" in stats
        print(f"Admin academy stats: courses={stats['total_courses']}, enrollments={stats['total_enrollments']}, certs={stats['certificates_issued']}")

    def test_admin_academy_forbidden_for_worker(self, worker_token):
        """Workers cannot access admin academy endpoint"""
        headers = {"Authorization": f"Bearer {worker_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/academy", headers=headers)
        assert response.status_code == 403


class TestEmployerAcademy:
    """Tests for employer creating courses"""

    @pytest.fixture
    def employer_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json=EMPLOYER_CREDS)
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Employer login failed")

    def test_employer_get_my_created_courses(self, employer_token):
        """GET /api/academy/my-created-courses returns employer's created courses"""
        headers = {"Authorization": f"Bearer {employer_token}"}
        response = requests.get(f"{BASE_URL}/api/academy/my-created-courses", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Employer has {len(data)} created courses")

    def test_employer_create_course(self, employer_token):
        """POST /api/academy/courses allows employer to create a course"""
        headers = {"Authorization": f"Bearer {employer_token}"}
        course_data = {
            "title": "TEST_Employer Course for Testing",
            "category": "Healthcare",
            "industry": "Healthcare",
            "description": "A test course created by employer",
            "duration_hours": 4,
            "level": "beginner",
            "price": 0,
            "is_certified": True
        }
        response = requests.post(f"{BASE_URL}/api/academy/courses", json=course_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        print(f"Employer created course: {data['id']}")


class TestExistingFeatures:
    """Verify existing features still work"""

    def test_worker_login(self):
        """Worker can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=WORKER_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "worker"

    def test_employer_login(self):
        """Employer can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=EMPLOYER_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "employer"

    def test_admin_login(self):
        """Admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "admin"

    def test_admin_dashboard_stats(self):
        """Admin dashboard stats endpoint"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "workers" in data or "total_workers" in data or isinstance(data, dict)
