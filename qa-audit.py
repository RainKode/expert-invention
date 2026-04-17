"""
Sunday — Full QA Audit Script
Tests all routes and modules against the product guide.
"""
import json, sys, time
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
RESULTS = []

def log(module, test, status, detail=""):
    RESULTS.append({"module": module, "test": test, "status": status, "detail": detail})
    marker = "PASS" if status == "pass" else "FAIL" if status == "fail" else "WARN"
    print(f"[{marker}] {module} > {test}" + (f" — {detail}" if detail else ""))

def check_page(page, url, module, test, expect_selector=None, expect_text=None, timeout=8000):
    """Navigate to a URL and verify it loads properly."""
    try:
        resp = page.goto(f"{BASE}{url}", wait_until="networkidle", timeout=timeout)
        if resp and resp.status >= 400:
            log(module, test, "fail", f"HTTP {resp.status}")
            return False
        if expect_selector:
            try:
                page.wait_for_selector(expect_selector, timeout=5000)
            except:
                log(module, test, "fail", f"Selector '{expect_selector}' not found")
                return False
        if expect_text:
            try:
                page.wait_for_selector(f"text={expect_text}", timeout=5000)
            except:
                log(module, test, "fail", f"Text '{expect_text}' not found on page")
                return False
        log(module, test, "pass")
        return True
    except Exception as e:
        log(module, test, "fail", str(e)[:200])
        return False

def run_audit():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900})
        page = context.new_page()

        # ─── SEGMENT 1: AUTH MODULE ──────────────────────────────
        print("\n=== SEGMENT 1: AUTH & ACCOUNT ===")

        # 1.1 Login page loads
        check_page(page, "/login", "Auth", "Login page renders", expect_text="Welcome back")

        # 1.2 Login form has all fields
        page.goto(f"{BASE}/login", wait_until="networkidle")
        has_email = page.locator('input[type="email"]').count() > 0
        has_password = page.locator('input[type="password"]').count() > 0
        has_submit = page.locator('button[type="submit"]').count() > 0
        if has_email and has_password and has_submit:
            log("Auth", "Login form fields present", "pass")
        else:
            log("Auth", "Login form fields present", "fail", f"email={has_email}, pw={has_password}, submit={has_submit}")

        # 1.3 Login validation (empty fields)
        page.click('button[type="submit"]')
        time.sleep(1)
        current = page.url
        if "/login" in current:
            log("Auth", "Login validation prevents empty submit", "pass")
        else:
            log("Auth", "Login validation prevents empty submit", "fail")

        # 1.4 Login error on wrong credentials
        page.fill('input[type="email"]', "nonexistent@test.com")
        page.fill('input[type="password"]', "wrongpassword123")
        page.click('button[type="submit"]')
        time.sleep(2)
        if page.locator("text=Invalid").count() > 0 or page.locator('[class*="error"]').count() > 0 or "/login" in page.url:
            log("Auth", "Login rejects wrong credentials", "pass")
        else:
            log("Auth", "Login rejects wrong credentials", "warn", "Could not confirm error message")

        # 1.5 Forgot password page
        check_page(page, "/forgot-password", "Auth", "Forgot password page renders", expect_text="Reset your password")

        # 1.6 Forgot password form
        page.goto(f"{BASE}/forgot-password", wait_until="networkidle")
        has_email_field = page.locator('input[type="email"]').count() > 0
        if has_email_field:
            log("Auth", "Forgot password form has email field", "pass")
        else:
            log("Auth", "Forgot password form has email field", "fail")

        # 1.7 Set password page (without token)
        check_page(page, "/set-password", "Auth", "Set password page loads", expect_text="invite")

        # 1.8 Reset password page
        check_page(page, "/reset-password", "Auth", "Reset password page loads", expect_text="password")

        # 1.9 Check password strength meter on set-password
        page.goto(f"{BASE}/set-password?token=fake", wait_until="networkidle")
        time.sleep(1)
        # Should show error for invalid token
        has_error = page.locator("text=invalid").count() > 0 or page.locator("text=expired").count() > 0
        if has_error:
            log("Auth", "Set password validates token", "pass")
        else:
            log("Auth", "Set password validates token", "warn", "Token validation not visible")

        # ─── SEGMENT 1B: MIDDLEWARE / AUTH PROTECTION ──────────
        print("\n=== SEGMENT 1B: ROUTE PROTECTION ===")

        # Test if unauthenticated user is redirected from protected routes
        protected_routes = [
            "/dashboard", "/tasks", "/board", "/plan", "/checkin",
            "/wrapup", "/reports", "/admin/users", "/admin/teams",
            "/settings", "/team/tasks", "/team/plans"
        ]
        for route in protected_routes:
            page.goto(f"{BASE}{route}", wait_until="networkidle", timeout=10000)
            time.sleep(1)
            if "/login" in page.url:
                log("Auth", f"Route {route} redirects to login", "pass")
            else:
                log("Auth", f"Route {route} redirects to login", "fail", f"Ended up at {page.url}")

        # ─── SEGMENT 2: API ROUTES ─────────────────────────────
        print("\n=== SEGMENT 2: API ROUTES ===")

        api_routes = [
            ("/api/auth/me", "GET", "Auth ME endpoint"),
            ("/api/tasks", "GET", "Tasks list endpoint"),
            ("/api/projects", "GET", "Projects endpoint"),
            ("/api/notifications", "GET", "Notifications endpoint"),
            ("/api/search?q=test", "GET", "Search endpoint"),
            ("/api/checkin", "GET", "Check-in endpoint"),
            ("/api/dashboard/my-overview", "GET", "Dashboard overview endpoint"),
            ("/api/custom-fields", "GET", "Custom fields endpoint"),
            ("/api/saved-views", "GET", "Saved views endpoint"),
            ("/api/activity-feed", "GET", "Activity feed endpoint"),
        ]

        for route, method, name in api_routes:
            try:
                resp = page.goto(f"{BASE}{route}", wait_until="networkidle", timeout=8000)
                status = resp.status if resp else 0
                if status == 401:
                    log("API", name, "pass", "Returns 401 (auth required)")
                elif status == 200:
                    log("API", name, "warn", "Returns 200 without auth (check RLS)")
                elif status >= 500:
                    log("API", name, "fail", f"Server error {status}")
                else:
                    log("API", name, "pass", f"HTTP {status}")
            except Exception as e:
                log("API", name, "fail", str(e)[:150])

        # ─── SEGMENT 3: CHECK BUILD/COMPILE ────────────────────
        print("\n=== SEGMENT 3: PAGE RENDERING CHECK (Login as prerequisite) ===")

        # Try to find a valid test user or just check pages load without error
        # Check if login page has proper form structure
        page.goto(f"{BASE}/login", wait_until="networkidle")
        # Take screenshot
        page.screenshot(path="d:/New folder (24)/Nest-Task Managment/expert-invention/qa-screenshots/login.png")

        # Check forgot password screenshot
        page.goto(f"{BASE}/forgot-password", wait_until="networkidle")
        page.screenshot(path="d:/New folder (24)/Nest-Task Managment/expert-invention/qa-screenshots/forgot-password.png")

        # ─── SEGMENT 4: CHECK IF MIDDLEWARE EXISTS ─────────────
        print("\n=== SEGMENT 4: MIDDLEWARE CHECK ===")
        import os
        middleware_path = r"d:\New folder (24)\Nest-Task Managment\expert-invention\src\middleware.ts"
        if os.path.exists(middleware_path):
            log("Middleware", "src/middleware.ts exists", "pass")
        else:
            log("Middleware", "src/middleware.ts exists", "fail", "CRITICAL: No middleware.ts found — auth protection not enforced by Next.js")

        # ─── SEGMENT 5: CHECK CRITICAL API IMPLEMENTATIONS ────
        print("\n=== SEGMENT 5: CRITICAL FILE CHECKS ===")

        # Check if cron routes exist
        cron_paths = [
            r"d:\New folder (24)\Nest-Task Managment\expert-invention\src\app\api\cron\notifications\route.ts",
            r"d:\New folder (24)\Nest-Task Managment\expert-invention\src\app\api\cron\archive-tasks\route.ts",
        ]
        for cp in cron_paths:
            name = cp.split("\\")[-2]
            if os.path.exists(cp):
                log("Cron", f"Cron route {name} exists", "pass")
            else:
                log("Cron", f"Cron route {name} exists", "fail")

        # Check comments API
        comments_path = r"d:\New folder (24)\Nest-Task Managment\expert-invention\src\app\api\tasks\[id]\comments\route.ts"
        if os.path.exists(comments_path):
            log("API", "Task comments API exists", "pass")
        else:
            log("API", "Task comments API exists", "fail", "QA Guide says this is deferred")

        # Check department API
        dept_path = r"d:\New folder (24)\Nest-Task Managment\expert-invention\src\app\api\admin\departments"
        if os.path.exists(dept_path):
            log("API", "Departments API exists", "pass")
        else:
            log("API", "Departments API exists", "fail", "Product guide requires department CRUD")

        # ─── FINAL SUMMARY ─────────────────────────────────────
        print("\n" + "=" * 70)
        print("QA AUDIT SUMMARY")
        print("=" * 70)
        
        passes = sum(1 for r in RESULTS if r["status"] == "pass")
        fails = sum(1 for r in RESULTS if r["status"] == "fail")
        warns = sum(1 for r in RESULTS if r["status"] == "warn")
        
        print(f"  PASS: {passes}")
        print(f"  FAIL: {fails}")
        print(f"  WARN: {warns}")
        print(f"  TOTAL: {len(RESULTS)}")
        print("=" * 70)

        # Write JSON results
        with open(r"d:\New folder (24)\Nest-Task Managment\expert-invention\qa-audit-results.json", "w") as f:
            json.dump(RESULTS, f, indent=2)

        print("\nDetailed results saved to qa-audit-results.json")

        browser.close()

if __name__ == "__main__":
    import os
    os.makedirs(r"d:\New folder (24)\Nest-Task Managment\expert-invention\qa-screenshots", exist_ok=True)
    run_audit()
