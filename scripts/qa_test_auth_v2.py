"""
Authenticated QA test v2 — logs in via API, uses cookies for all pages.
Uses keyboard typing for react-hook-form compatibility.
"""
import os
import sys
import json
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "qa-playwright-screenshots", "authenticated")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

EMAIL = "admin@email.com"
PASSWORD = "123admin"

results = []


def test_page(page, name, url, timeout=20000):
    record = {"page": name, "url": url, "status": "ok", "errors": [], "console_errors": []}
    console_errors = []

    def on_console(msg):
        if msg.type == "error":
            console_errors.append(msg.text)

    page.on("console", on_console)

    try:
        resp = page.goto(url, wait_until="domcontentloaded", timeout=timeout)
        # Wait for network to settle, but with shorter timeout
        try:
            page.wait_for_load_state("networkidle", timeout=10000)
        except:
            pass  # Some pages have persistent connections

        if resp:
            record["http_status"] = resp.status
            if resp.status >= 400:
                record["errors"].append(f"HTTP {resp.status}")
                record["status"] = "error"

        page.wait_for_timeout(1500)

        screenshot_path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
        page.screenshot(path=screenshot_path, full_page=True)
        record["screenshot"] = screenshot_path

        # Check for Next.js error overlay
        if page.locator('[data-nextjs-dialog]').count() > 0:
            record["errors"].append("Next.js error overlay detected")
            record["status"] = "error"

        # Check if redirected to login
        current = page.url
        if "/login" in current and "/login" not in url:
            record["errors"].append(f"Redirected to login (auth failed)")
            record["status"] = "error"

        # Check for error text
        body_text = page.inner_text("body")
        for pattern in ["Application error", "Internal Server Error", "Unhandled Runtime Error"]:
            if pattern in body_text:
                record["errors"].append(f"Error text: '{pattern}'")
                record["status"] = "error"

    except Exception as e:
        record["status"] = "error"
        record["errors"].append(str(e)[:200])
        try:
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"{name}_ERROR.png"))
        except:
            pass

    record["console_errors"] = console_errors[:5]
    if console_errors and record["status"] == "ok":
        record["status"] = "warning"

    page.remove_listener("console", on_console)
    results.append(record)

    icon = {"ok": "✓", "warning": "⚠", "error": "✗"}[record["status"]]
    print(f"  {icon} {name}: {record['status']}", end="")
    if record.get("http_status"):
        print(f" (HTTP {record['http_status']})", end="")
    print()
    for err in record["errors"]:
        print(f"    → {err}")
    for ce in console_errors[:2]:
        print(f"    [console] {ce[:120]}")

    return record


def main():
    print("=" * 60)
    print("Sunday Task Management - Authenticated QA Test v2")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, locale="en-US")
        page = context.new_page()

        # ─── Step 1: Login via form with keyboard typing ───
        print("\n🔐 Logging in via form...")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1500)

        # Use keyboard typing for react-hook-form compatibility
        email_input = page.locator('#email')
        email_input.click()
        email_input.press_sequentially(EMAIL, delay=30)

        pw_input = page.locator('#password')
        pw_input.click()
        pw_input.press_sequentially(PASSWORD, delay=30)

        page.wait_for_timeout(500)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "00_login_filled.png"))

        # Click submit
        submit_btn = page.locator('button[type="submit"]')
        submit_btn.click()

        # Wait for navigation
        try:
            page.wait_for_url("**/!(login)*", timeout=10000)
            print(f"  ✓ Login successful! Navigated to: {page.url}")
        except:
            # Maybe still on login — check for errors
            page.wait_for_timeout(3000)
            print(f"  Current URL after login attempt: {page.url}")
            body = page.inner_text("body")
            
            # Try to find error messages
            if "deactivated" in body.lower():
                print("  ✗ Account deactivated")
            elif "invalid" in body.lower() or "wrong" in body.lower():
                print("  ✗ Invalid credentials")
            else:
                # Screenshot the state
                page.screenshot(path=os.path.join(SCREENSHOT_DIR, "00_login_after_submit.png"))
                
                # If still on login, try direct API login
                print("  Form login didn't redirect. Trying API login...")
                resp = page.request.post(f"{BASE_URL}/api/auth/login", data={
                    "email": EMAIL,
                    "password": PASSWORD,
                })
                print(f"  API response: {resp.status} — {resp.text()[:200]}")
                
                if resp.ok:
                    # Reload to pick up cookies
                    page.reload(wait_until="networkidle")
                    page.wait_for_timeout(2000)
                    print(f"  After reload: {page.url}")

        page.wait_for_timeout(1000)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_after_login.png"))

        logged_in = "/login" not in page.url
        print(f"\n  Auth status: {'✓ Logged in' if logged_in else '✗ Not logged in'}")
        print(f"  Current URL: {page.url}")

        # ─── Step 2: Test all protected pages ───
        pages_to_test = [
            ("dashboard", f"{BASE_URL}/dashboard"),
            ("tasks", f"{BASE_URL}/tasks"),
            ("board", f"{BASE_URL}/board"),
            ("team", f"{BASE_URL}/team"),
            ("plan", f"{BASE_URL}/plan"),
            ("reports", f"{BASE_URL}/reports"),
            ("settings", f"{BASE_URL}/settings"),
            ("checkin", f"{BASE_URL}/checkin"),
            ("wrapup", f"{BASE_URL}/wrapup"),
            ("admin", f"{BASE_URL}/admin"),
            ("onboarding", f"{BASE_URL}/onboarding"),
        ]

        print("\n📋 Testing Protected Pages...")
        for name, url in pages_to_test:
            test_page(page, name, url)

        # ─── Step 3: Mobile viewport ───
        if logged_in:
            print("\n📋 Testing Mobile Viewport...")
            mobile_ctx = browser.new_context(
                viewport={"width": 375, "height": 812}, locale="en-US",
                storage_state=context.storage_state(),
            )
            mobile = mobile_ctx.new_page()
            test_page(mobile, "mobile_dashboard", f"{BASE_URL}/dashboard")
            test_page(mobile, "mobile_tasks", f"{BASE_URL}/tasks")
            mobile.close()
            mobile_ctx.close()

        page.close()
        context.close()
        browser.close()

    # ─── Summary ───
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)

    ok = sum(1 for r in results if r["status"] == "ok")
    warn = sum(1 for r in results if r["status"] == "warning")
    err = sum(1 for r in results if r["status"] == "error")
    total = len(results)

    print(f"  Total: {total}  |  ✓ OK: {ok}  |  ⚠ Warnings: {warn}  |  ✗ Errors: {err}")

    if err > 0:
        print("\n  ✗ Errors:")
        for r in results:
            if r["status"] == "error":
                print(f"    {r['page']}: {', '.join(r['errors'][:3])}")

    if warn > 0:
        print("\n  ⚠ Warnings:")
        for r in results:
            if r["status"] == "warning":
                all_issues = r["errors"] + [f"console: {c[:80]}" for c in r.get("console_errors", [])[:2]]
                print(f"    {r['page']}: {', '.join(all_issues[:3])}")

    results_path = os.path.join(SCREENSHOT_DIR, "results.json")
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n  Screenshots: {SCREENSHOT_DIR}")
    return 0 if err == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
