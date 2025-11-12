from playwright.sync_api import sync_playwright
import json, sys

PAGES = ["/index.html","/login.html","/register.html","/master-control.html","/pages/wizard.html"]

def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context()
        results = {}
        for p in PAGES:
            page = context.new_page()
            msgs = []
            def on_console(msg):
                try:
                    msgs.append({"type": msg.type, "text": msg.text})
                except:
                    msgs.append({"type":"console","text":str(msg)})
            page.on('console', on_console)
            try:
                url = f"http://localhost:8000{p}"
                page.goto(url, wait_until='networkidle', timeout=15000)
                # collect page errors
                page_errors = page.evaluate('window.__pageErrors || []')
                results[p] = {"status":"ok", "console": msgs, "page_errors": page_errors}
            except Exception as e:
                results[p] = {"status":"error", "error": str(e), "console": msgs}
            try:
                page.close()
            except:
                pass
        browser.close()
        print(json.dumps(results, ensure_ascii=False))

if __name__=='__main__':
    try:
        run()
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
