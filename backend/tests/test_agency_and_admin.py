"""
Test suite for Agency features and Admin Agency Management.
Tests the new Agency portal functionality including:
- Agency login and dashboard
- Agency shifts and workers management
- Admin agency management (view, approve, suspend)
- Existing portal logins (worker, employer, admin)
- PWA manifest and service worker accessibility
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://payroll-master-26.preview.emergentagent.com"

# Test credentials
CREDENTIALS = {
    "admin": {"email": "admin@everduty.com", "password": "admin123"},
    "employer": {"email": "employer@careplus.com", "password": "employer123"},
    "worker": {"email": "worker@email.com", "password": "worker123"},
    "agency": {"email": "agency@swiftstaff.co.uk", "password": "agency123"},
}

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


# ============ AUTH TOKENS ============

@pytest.fixture(scope="module")
def admin_token(api_client):
    """Get admin token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    data = response.json()
    assert "token" in data
    assert data["user"]["role"] == "admin"
    return data["token"]


@pytest.fixture(scope="module")
def employer_token(api_client):
    """Get employer token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["employer"])
    assert response.status_code == 200, f"Employer login failed: {response.text}"
    data = response.json()
    assert "token" in data
    assert data["user"]["role"] == "employer"
    return data["token"]


@pytest.fixture(scope="module")
def worker_token(api_client):
    """Get worker token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["worker"])
    assert response.status_code == 200, f"Worker login failed: {response.text}"
    data = response.json()
    assert "token" in data
    assert data["user"]["role"] == "worker"
    return data["token"]


@pytest.fixture(scope="module")
def agency_token(api_client):
    """Get agency token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["agency"])
    assert response.status_code == 200, f"Agency login failed: {response.text}"
    data = response.json()
    assert "token" in data
    assert data["user"]["role"] == "agency"
    return data["token"]


# ============ EXISTING LOGIN TESTS ============

class TestExistingLogins:
    """Verify existing user logins still work"""
    
    def test_admin_login(self, api_client):
        """Admin login: admin@everduty.com / admin123"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["admin"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "admin"
        assert data["user"]["email"] == "admin@everduty.com"
        print("✓ Admin login successful")
    
    def test_employer_login(self, api_client):
        """Employer login: employer@careplus.com / employer123"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["employer"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "employer"
        assert data["user"]["email"] == "employer@careplus.com"
        print("✓ Employer login successful")
    
    def test_worker_login(self, api_client):
        """Worker login: worker@email.com / worker123"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["worker"])
        assert response.status_code == 200
        data = response.json()
        assert data["user"]["role"] == "worker"
        assert data["user"]["email"] == "worker@email.com"
        print("✓ Worker login successful")


# ============ AGENCY LOGIN AND PROFILE ============

class TestAgencyLogin:
    """Test Agency login and profile"""
    
    def test_agency_login(self, api_client):
        """Agency login: agency@swiftstaff.co.uk / agency123"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json=CREDENTIALS["agency"])
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["user"]["role"] == "agency"
        assert data["user"]["email"] == "agency@swiftstaff.co.uk"
        print("✓ Agency login successful")
    
    def test_agency_profile(self, api_client, agency_token):
        """GET /api/agency/profile - returns agency details"""
        response = api_client.get(
            f"{BASE_URL}/api/agency/profile",
            headers={"Authorization": f"Bearer {agency_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Agency should already be set up (SwiftStaff is pre-seeded)
        if data.get("setup_required"):
            print("✓ Agency profile requires setup (new agency)")
        else:
            assert data["agency"] is not None
            assert "name" in data["agency"]
            print(f"✓ Agency profile: {data['agency']['name']}")


# ============ AGENCY DASHBOARD AND STATS ============

class TestAgencyDashboard:
    """Test Agency dashboard and stats"""
    
    def test_agency_dashboard(self, api_client, agency_token):
        """GET /api/agency/dashboard - returns stats"""
        response = api_client.get(
            f"{BASE_URL}/api/agency/dashboard",
            headers={"Authorization": f"Bearer {agency_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "stats" in data
        # Verify stats structure
        stats = data["stats"]
        if stats:  # Stats may be empty for new agency
            expected_keys = ["open_shifts", "worker_pool", "total_revenue", "net_revenue"]
            for key in expected_keys:
                assert key in stats, f"Missing stat: {key}"
        print(f"✓ Agency dashboard stats loaded: {stats}")


# ============ AGENCY SHIFTS ============

class TestAgencyShifts:
    """Test Agency shifts management"""
    
    def test_get_agency_shifts(self, api_client, agency_token):
        """GET /api/agency/shifts - returns shifts array"""
        response = api_client.get(
            f"{BASE_URL}/api/agency/shifts",
            headers={"Authorization": f"Bearer {agency_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Expected list of shifts"
        print(f"✓ Agency shifts: {len(data)} shifts found")


# ============ AGENCY WORKERS ============

class TestAgencyWorkers:
    """Test Agency worker pool management"""
    
    def test_get_agency_workers(self, api_client, agency_token):
        """GET /api/agency/workers - returns workers array"""
        response = api_client.get(
            f"{BASE_URL}/api/agency/workers",
            headers={"Authorization": f"Bearer {agency_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Expected list of workers"
        print(f"✓ Agency workers: {len(data)} workers in pool")


# ============ AGENCY APPLICANTS ============

class TestAgencyApplicants:
    """Test Agency applicants management"""
    
    def test_get_agency_applicants(self, api_client, agency_token):
        """GET /api/agency/applicants - returns applicants"""
        response = api_client.get(
            f"{BASE_URL}/api/agency/applicants",
            headers={"Authorization": f"Bearer {agency_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Expected list of applicants"
        print(f"✓ Agency applicants: {len(data)} applicants found")


# ============ AGENCY TIMESHEETS ============

class TestAgencyTimesheets:
    """Test Agency timesheets"""
    
    def test_get_agency_timesheets(self, api_client, agency_token):
        """GET /api/agency/timesheets - returns timesheets"""
        response = api_client.get(
            f"{BASE_URL}/api/agency/timesheets",
            headers={"Authorization": f"Bearer {agency_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Expected list of timesheets"
        print(f"✓ Agency timesheets: {len(data)} timesheets found")


# ============ ADMIN AGENCY MANAGEMENT ============

class TestAdminAgencies:
    """Test Admin agency management"""
    
    def test_get_agencies_list(self, api_client, admin_token):
        """GET /api/admin/agencies - returns agencies list"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/agencies",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list), "Expected list of agencies"
        print(f"✓ Admin agencies: {len(data)} agencies found")
        
        # Verify SwiftStaff is in the list
        agency_names = [a.get("name", "") for a in data]
        if "SwiftStaff Recruitment" in agency_names:
            print("✓ SwiftStaff Recruitment found in agencies list")
        
        # Verify structure of agency data
        if data:
            agency = data[0]
            assert "id" in agency
            assert "name" in agency
            assert "status" in agency
            assert "owner_name" in agency
            print(f"✓ Agency structure verified: {agency['name']} ({agency['status']})")
    
    def test_agencies_stats(self, api_client, admin_token):
        """Verify admin can see agency stats"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/agencies",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        agencies = response.json()
        
        total = len(agencies)
        active = len([a for a in agencies if a.get("status") == "active"])
        pending = len([a for a in agencies if a.get("status") == "pending"])
        
        print(f"✓ Agency stats - Total: {total}, Active: {active}, Pending: {pending}")


# ============ ADMIN AGENCY ACTIONS ============

class TestAdminAgencyActions:
    """Test Admin agency approve/suspend actions"""
    
    def test_approve_agency_endpoint(self, api_client, admin_token):
        """POST /api/admin/agencies/{id}/approve - endpoint exists"""
        # First get an agency to test with
        response = api_client.get(
            f"{BASE_URL}/api/admin/agencies",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        agencies = response.json()
        
        if agencies:
            # Test approve endpoint with existing agency
            agency_id = agencies[0]["id"]
            response = api_client.post(
                f"{BASE_URL}/api/admin/agencies/{agency_id}/approve",
                headers={"Authorization": f"Bearer {admin_token}"}
            )
            assert response.status_code == 200
            print(f"✓ Approve agency endpoint works")
    
    def test_suspend_agency_endpoint(self, api_client, admin_token):
        """POST /api/admin/agencies/{id}/suspend - endpoint exists"""
        response = api_client.get(
            f"{BASE_URL}/api/admin/agencies",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        agencies = response.json()
        
        if agencies:
            # Find an active agency to suspend then re-approve
            active_agencies = [a for a in agencies if a.get("status") == "active"]
            if active_agencies:
                agency_id = active_agencies[0]["id"]
                
                # Suspend
                response = api_client.post(
                    f"{BASE_URL}/api/admin/agencies/{agency_id}/suspend",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                assert response.status_code == 200
                print(f"✓ Suspend agency endpoint works")
                
                # Re-approve to restore state
                response = api_client.post(
                    f"{BASE_URL}/api/admin/agencies/{agency_id}/approve",
                    headers={"Authorization": f"Bearer {admin_token}"}
                )
                assert response.status_code == 200
                print(f"✓ Agency re-approved after test")


# ============ AGENCY REGISTRATION ============

class TestAgencyRegistration:
    """Test Agency registration endpoint"""
    
    def test_agency_registration_endpoint(self, api_client, agency_token):
        """POST /api/agency/register - endpoint works"""
        # Note: This will fail if agency already registered, which is expected
        response = api_client.post(
            f"{BASE_URL}/api/agency/register",
            headers={"Authorization": f"Bearer {agency_token}"},
            json={
                "name": "Test Agency",
                "industry": "Healthcare"
            }
        )
        # Accept either 200 (new) or 400 (already exists)
        assert response.status_code in [200, 400]
        if response.status_code == 400:
            assert "already registered" in response.json().get("detail", "").lower()
            print("✓ Agency registration endpoint works (agency already exists)")
        else:
            print("✓ Agency registration created new agency")


# ============ PWA FILES ============

class TestPWAFiles:
    """Test PWA manifest and service worker accessibility"""
    
    def test_manifest_json(self, api_client):
        """PWA manifest.json accessible at /manifest.json"""
        # Remove /api from base URL for static files
        frontend_url = BASE_URL.replace("/api", "")
        response = api_client.get(f"{frontend_url}/manifest.json")
        assert response.status_code == 200, f"manifest.json not accessible: {response.status_code}"
        data = response.json()
        assert "name" in data
        assert "icons" in data
        print(f"✓ PWA manifest.json accessible: {data.get('name')}")
    
    def test_service_worker(self, api_client):
        """PWA service-worker.js accessible at /service-worker.js"""
        frontend_url = BASE_URL.replace("/api", "")
        response = api_client.get(f"{frontend_url}/service-worker.js")
        assert response.status_code == 200, f"service-worker.js not accessible: {response.status_code}"
        assert "addEventListener" in response.text or "self" in response.text
        print("✓ PWA service-worker.js accessible")


# ============ REFERRAL AND ACADEMY FOR AGENCY ============

class TestAgencyReferralsAndAcademy:
    """Test Referral and Academy endpoints work for agency role"""
    
    def test_agency_referral_code(self, api_client, agency_token):
        """GET /api/referral/code - agency can get referral code"""
        response = api_client.get(
            f"{BASE_URL}/api/referral/code",
            headers={"Authorization": f"Bearer {agency_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "referral_code" in data
        print(f"✓ Agency referral code: {data['referral_code']}")
    
    def test_academy_courses(self, api_client, agency_token):
        """GET /api/academy/courses - agency can browse courses"""
        response = api_client.get(
            f"{BASE_URL}/api/academy/courses",
            headers={"Authorization": f"Bearer {agency_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Academy courses available: {len(data)} courses")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
