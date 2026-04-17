"""
Authenticated QA test for the Sunday Task Management app.
Logs in with provided credentials and tests all protected pages.
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

def test_page(page, name, url, checks=None):
    record = {"page": name, "url": url, "status": "ok", "errors": [], "console_errors": []}
    console_errors = []

    def on_console(msg):
        if msg.type in ("error",):
            console_errors.append(msg.text)

    page.on("console", on_console)

    try:
        resp = page.goto(url, wait_until="networkidle", timeout=30000)
        if resp:
            record["http_status"] = resp.status
            if resp.status >= 400:
                record["errors"].append(f"HTTP {resp.status}")
                record["status"] = "error"

        page.wait_for_timeout(2000)

        screenshot_path = os.path.join(SCREENSHOT_DIR, f"{name}.png")
        page.screenshot(path=screenshot_path, full_page=True)
        record["screenshot"] = screenshot_path

        # Check for Next.js error overlay
        error_overlay = page.locator('[data-nextjs-dialog]').count()
        if error_overlay > 0:
            record["errors"].append("Next.js error overlay detected")
            record["status"] = "error"

        # Check for error text
        body_text = page.inner_text("body")
        for pattern in ["Application error", "Internal Server Error", "Unhandled Runtime Error", "TypeError", "ReferenceError"]:
            if pattern in body_text:
                record["errors"].append(f"Error text: '{pattern}'")
                record["status"] = "warning"

        # Check if we got redirected back to login (auth failed)
        current_url = page.url
        if "/login" in current_url and "/login" not in url:
            record["errors"].append("Redirected to login — auth may have failed")
            record["status"] = "warning"

        # Custom checks
        if checks:
            for check_name, check_fn in checks.items():
                try:
                    result = check_fn(page)
                    if not result:
                        record["errors"].append(f"Check failed: {check_name}")
                        record["status"] = "warning"
                except Exception as e:
                    record["errors"].append(f"Check error ({check_name}): {str(e)[:100]}")
                    record["status"] = "warning"

    except Exception as e:
        record["status"] = "error"
        record["errors"].append(str(e)[:200])
        try:
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"{name}_ERROR.png"))
        except:
            pass

    record["console_errors"] = console_errors
    if console_errors:
        record["status"] = "warning" if record["status"] == "ok" else record["status"]

    page.remove_listener("console", on_console)
    results.append(record)

    icon = "✓" if record["status"] == "ok" else ("⚠" if record["status"] == "warning" else "✗")
    print(f"  {icon} {name}: {record['status']}")
    if record["errors"]:
        for err in record["errors"]:
            print(f"    → {err}")
    if console_errors:
        for ce in console_errors[:3]:
            print(f"    [console] {ce[:150]}")

    return record


def main():
    print("=" * 60)
    print("Sunday Task Management - Authenticated QA Test")
    print("=" * 60)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1440, "height": 900}, locale="en-US")
        page = context.new_page()

        # ─── Login ───
        print("\n🔐 Logging in...")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=30000)
        page.wait_for_timeout(1000)

        # Fill email
        email_input = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]')
        if email_input.count() > 0:
            email_input.first.fill(EMAIL)
        else:
            # Try generic text input
            inputs = page.locator("input").all()
            if len(inputs) >= 1:
                inputs[0].fill(EMAIL)

        # Fill password
        pw_input = page.locator('input[type="password"], input[name="password"]')
        if pw_input.count() > 0:
            pw_input.first.fill(PASSWORD)
        else:
            inputs = page.locator("input").all()
            if len(inputs) >= 2:
                inputs[1].fill(PASSWORD)

        page.wait_for_timeout(500)
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "00_login_filled.png"))

        # Submit
        submit_btn = page.locator('button[type="submit"], button:has-text("Sign in"), button:has-text("Log in"), button:has-text("Login")')
        if submit_btn.count() > 0:
            submit_btn.first.click()
        else:
            pw_input.first.press("Enter")

        # Wait for navigation after login
        page.wait_for_timeout(5000)
        page.wait_for_load_state("networkidle")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_after_login.png"))

        current_url = page.url
        print(f"  After login, current URL: {current_url}")

        if "/login" in current_url:
            # Check if there's an error message
            body = page.inner_text("body")
            print(f"  ⚠ Still on login page. Checking for error messages...")
            error_el = page.locator('[role="alert"], .error, .text-red, .text-destructive').all()
            for el in error_el:
                print(f"    Error: {el.inner_text()[:100]}")
            print("  Continuing with tests anyway (pages will show login redirects)...")
        else:
            print(f"  ✓ Login successful! Redirected to: {current_url}")

        # ─── Test Protected Pages ───
        print("\n📋 Testing Dashboard...")
        test_page(page, "dashboard", f"{BASE_URL}/dashboard", {
            "has_content": lambda p: len(p.inner_text("body")) > 100,
        })

        print("\n📋 Testing Tasks...")
        test_page(page, "tasks", f"{BASE_URL}/tasks", {
            "has_content": lambda p: len(p.inner_text("body")) > 100,
        })

        print("\n📋 Testing Board...")
        test_page(page, "board", f"{BASE_URL}/board", {
            "has_content": lambda p: len(p.inner_text("body")) > 100,
        })

        print("\n📋 Testing Team...")
        test_page(page, "team", f"{BASE_URL}/team", {
            "has_content": lambda p: len(p.inner_text("body")) > 100,
        })

        print("\n📋 Testing Plan...")
        test_page(page, "plan", f"{BASE_URL}/plan")

        print("\n📋 Testing Reports...")
        test_page(page, "reports", f"{BASE_URL}/reports")

        print("\n📋 Testing Settings...")
        test_page(page, "settings", f"{BASE_URL}/settings")

        print("\n📋 Testing Check-in...")
        test_page(page, "checkin", f"{BASE_URL}/checkin")

        print("\n📋 Testing Wrap-up...")
        test_page(page, "wrapup", f"{BASE_URL}/wrapup")

        print("\n📋 Testing Admin...")
        test_page(page, "admin", f"{BASE_URL}/admin")

        print("\n📋 Testing Onboarding...")
        test_page(page, "onboarding", f"{BASE_URL}/onboarding")

        # ─── Mobile Viewport ───
        print("\n📋 Testing Mobile Viewport (authenticated)...")
        mobile_ctx = browser.new_context(viewport={"width": 375, "height": 812}, locale="en-US",
                                          storage_state=context.storage_state())
        mobile_page = mobile_ctx.new_page()
        test_page(mobile_page, "mobile_dashboard", f"{BASE_URL}/dashboard")
        test_page(mobile_page, "mobile_tasks", f"{BASE_URL}/tasks")
        mobile_page.close()
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
        print("\n  Errors:")
        for r in results:
            if r["status"] == "error":
                print(f"    ✗ {r['page']}: {', '.join(r['errors'][:3])}")

    if warn > 0:
        print("\n  Warnings:")
        for r in results:
            if r["status"] == "warning":
                all_issues = r["errors"] + [f"console: {c[:80]}" for c in r.get("console_errors", [])[:2]]
                print(f"    ⚠ {r['page']}: {', '.join(all_issues[:3])}")

    results_path = os.path.join(SCREENSHOT_DIR, "results.json")
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n  Screenshots: {SCREENSHOT_DIR}")

    return 0 if err == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
