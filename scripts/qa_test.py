"""
Comprehensive QA test for the Sunday Task Management app.
Tests key pages, checks for errors, captures screenshots.
"""
import os
import sys
import json
from playwright.sync_api import sync_playwright

BASE_URL = "http://localhost:3000"
SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), "..", "qa-playwright-screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

results = []

def test_page(page, name, url, checks=None):
    """Test a single page: navigate, wait, screenshot, check for errors."""
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
        
        # Wait a bit for any JS to settle
        page.wait_for_timeout(2000)
        
        # Screenshot
        screenshot_path = os.path.join(SCREENSHOT_DIR, f"{name.replace(' ', '_').replace('/', '_')}.png")
        page.screenshot(path=screenshot_path, full_page=True)
        record["screenshot"] = screenshot_path
        
        # Check for Next.js error overlay
        error_overlay = page.locator('[data-nextjs-dialog]').count()
        if error_overlay > 0:
            record["errors"].append("Next.js error overlay detected")
            record["status"] = "error"
        
        # Check for common error text patterns
        body_text = page.inner_text("body")
        error_patterns = [
            "Application error",
            "Internal Server Error", 
            "500",
            "Unhandled Runtime Error",
            "TypeError",
            "ReferenceError",
        ]
        for pattern in error_patterns:
            if pattern in body_text and pattern != "500":  # skip 500 as it could be in normal text
                record["errors"].append(f"Error text found: '{pattern}'")
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
                    record["errors"].append(f"Check error ({check_name}): {str(e)}")
                    record["status"] = "warning"
        
    except Exception as e:
        record["status"] = "error"
        record["errors"].append(str(e))
        try:
            screenshot_path = os.path.join(SCREENSHOT_DIR, f"{name.replace(' ', '_')}_ERROR.png")
            page.screenshot(path=screenshot_path)
            record["screenshot"] = screenshot_path
        except:
            pass
    
    record["console_errors"] = console_errors
    if console_errors:
        record["status"] = "warning" if record["status"] == "ok" else record["status"]
    
    page.remove_listener("console", on_console)
    results.append(record)
    
    status_icon = "✓" if record["status"] == "ok" else ("⚠" if record["status"] == "warning" else "✗")
    print(f"  {status_icon} {name}: {record['status']}")
    if record["errors"]:
        for err in record["errors"]:
            print(f"    → {err}")
    if console_errors:
        for ce in console_errors[:3]:
            print(f"    [console] {ce[:120]}")
    
    return record


def main():
    print("=" * 60)
    print("Sunday Task Management - QA Test Suite")
    print("=" * 60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            locale="en-US",
        )
        page = context.new_page()
        
        # ─── Auth Pages ───
        print("\n📋 Testing Auth Pages...")
        test_page(page, "login", f"{BASE_URL}/login", {
            "has_form": lambda p: p.locator("form").count() > 0 or p.locator("input").count() > 0,
            "has_heading": lambda p: p.locator("h1, h2, h3").count() > 0,
        })
        test_page(page, "forgot_password", f"{BASE_URL}/forgot-password", {
            "has_form": lambda p: p.locator("form").count() > 0 or p.locator("input").count() > 0,
        })
        test_page(page, "set_password", f"{BASE_URL}/set-password")
        test_page(page, "reset_password", f"{BASE_URL}/reset-password")
        
        # ─── Main App Pages (may redirect to login) ───
        print("\n📋 Testing App Pages (may redirect to login if auth required)...")
        test_page(page, "home", f"{BASE_URL}/")
        test_page(page, "dashboard", f"{BASE_URL}/dashboard")
        test_page(page, "tasks", f"{BASE_URL}/tasks")
        test_page(page, "board", f"{BASE_URL}/board")
        test_page(page, "team", f"{BASE_URL}/team")
        test_page(page, "plan", f"{BASE_URL}/plan")
        test_page(page, "reports", f"{BASE_URL}/reports")
        test_page(page, "settings", f"{BASE_URL}/settings")
        test_page(page, "checkin", f"{BASE_URL}/checkin")
        test_page(page, "wrapup", f"{BASE_URL}/wrapup")
        
        # ─── Admin Pages ───
        print("\n📋 Testing Admin Pages...")
        test_page(page, "admin", f"{BASE_URL}/admin")
        
        # ─── Onboarding ───
        print("\n📋 Testing Onboarding...")
        test_page(page, "onboarding", f"{BASE_URL}/onboarding")
        
        # ─── API Health ───
        print("\n📋 Testing API Routes...")
        api_page = context.new_page()
        # Test a few API routes that might exist
        for api_route in ["api/health", "api/auth"]:
            try:
                resp = api_page.goto(f"{BASE_URL}/{api_route}", timeout=10000)
                status = resp.status if resp else "no response"
                icon = "✓" if resp and resp.status < 500 else "✗"
                print(f"  {icon} {api_route}: {status}")
                results.append({"page": f"API: {api_route}", "url": f"{BASE_URL}/{api_route}", 
                               "status": "ok" if resp and resp.status < 500 else "error",
                               "http_status": resp.status if resp else 0, "errors": [], "console_errors": []})
            except Exception as e:
                print(f"  ✗ {api_route}: {str(e)[:80]}")
                results.append({"page": f"API: {api_route}", "url": f"{BASE_URL}/{api_route}",
                               "status": "error", "errors": [str(e)[:200]], "console_errors": []})
        api_page.close()
        
        # ─── Mobile viewport test ───
        print("\n📋 Testing Mobile Viewport...")
        mobile_context = browser.new_context(
            viewport={"width": 375, "height": 812},
            locale="en-US",
        )
        mobile_page = mobile_context.new_page()
        test_page(mobile_page, "mobile_login", f"{BASE_URL}/login", {
            "viewport_meta": lambda p: p.locator('meta[name="viewport"]').count() > 0,
        })
        test_page(mobile_page, "mobile_home", f"{BASE_URL}/")
        mobile_page.close()
        mobile_context.close()
        
        # Cleanup
        page.close()
        context.close()
        browser.close()
    
    # ─── Summary ───
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    ok_count = sum(1 for r in results if r["status"] == "ok")
    warn_count = sum(1 for r in results if r["status"] == "warning")
    error_count = sum(1 for r in results if r["status"] == "error")
    total = len(results)
    
    print(f"  Total: {total}  |  ✓ OK: {ok_count}  |  ⚠ Warnings: {warn_count}  |  ✗ Errors: {error_count}")
    
    if error_count > 0:
        print("\n  Failed pages:")
        for r in results:
            if r["status"] == "error":
                print(f"    ✗ {r['page']}: {', '.join(r['errors'][:3])}")
    
    if warn_count > 0:
        print("\n  Warnings:")
        for r in results:
            if r["status"] == "warning":
                errs = r["errors"] + [f"console: {ce[:80]}" for ce in r.get("console_errors", [])[:2]]
                print(f"    ⚠ {r['page']}: {', '.join(errs[:3])}")
    
    # Save results to JSON
    results_path = os.path.join(SCREENSHOT_DIR, "results.json")
    with open(results_path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    print(f"\n  Results saved to: {results_path}")
    print(f"  Screenshots saved to: {SCREENSHOT_DIR}")
    
    return 0 if error_count == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
