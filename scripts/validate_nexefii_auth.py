from playwright.sync_api import sync_playwright
import json, sys


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        url = "http://localhost:8000/index.html"
        page.goto(url, wait_until="networkidle", timeout=15000)

        # check NexefiiAuth
        try:
            exists = page.evaluate('typeof window.NexefiiAuth !== "undefined"')
        except Exception:
            exists = False
        # check validatePassword function
        try:
            has_validate = page.evaluate('typeof (window.NexefiiAuth && window.NexefiiAuth.validatePassword) === "function"')
        except Exception:
            has_validate = False

        # language persistence: set via localStorage and reload
        try:
            page.evaluate("localStorage.setItem('nexefii_lang','es')")
            page.reload(wait_until='networkidle')
            lang = page.evaluate("localStorage.getItem('nexefii_lang')")
        except Exception:
            lang = None

        out = {"nexefiiAuth_exists": bool(exists), "validatePassword_exists": bool(has_validate), "lang_persisted": lang}
        print(json.dumps(out, ensure_ascii=False))
        browser.close()

if __name__=='__main__':
    try:
        run()
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
