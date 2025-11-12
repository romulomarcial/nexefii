from playwright.sync_api import sync_playwright
import json, sys


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        console_messages = []

        def on_console(msg):
            try:
                loc = None
                try:
                    loc = msg.location()
                except Exception:
                    loc = None
                console_messages.append({"type": msg.type, "text": msg.text, "location": loc})
            except Exception as _:
                console_messages.append({"type": "console", "text": str(msg), "location": None})

        def on_page_error(err):
            try:
                console_messages.append({"type": "pageerror", "text": str(err), "stack": err.stack if hasattr(err, 'stack') else None})
            except Exception:
                console_messages.append({"type": "pageerror", "text": str(err), "stack": None})

        page.on("console", on_console)
        page.on("pageerror", on_page_error)

        page.add_init_script("""
            window.__pageErrors = window.__pageErrors || [];
            window.addEventListener('error', function(e){
                try { window.__pageErrors.push({type:'error', message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno, error: (e.error && e.error.stack) || null}); } catch (_) {}
            });
            window.addEventListener('unhandledrejection', function(e){
                try { window.__pageErrors.push({type:'unhandledrejection', message: (e.reason && e.reason.message) || String(e.reason), stack: (e.reason && e.reason.stack) || null}); } catch(_) {}
            });
        """)

        url = "http://localhost:8000/pages/wizard.html"
        print(f"Visiting: {url}")
        page.goto(url, wait_until="networkidle", timeout=15000)

        # Wait for key selectors
        try:
            page.wait_for_selector('#currency', timeout=5000)
        except Exception:
            pass

        # Inspect select contents
        currency_options = []
        try:
            currency_options = page.eval_on_selector_all('#currency option', "nodes => nodes.map(n => ({value: n.value, text: n.innerText}))")
        except Exception:
            currency_options = []

        type_options = []
        try:
            type_options = page.eval_on_selector_all('#type option', "nodes => nodes.map(n => ({value: n.value, text: n.innerText}))")
        except Exception:
            type_options = []

        # retrieve collected page errors from the page
        try:
            page_errors = page.evaluate('window.__pageErrors || []')
        except Exception:
            page_errors = []

        out = {"currency_options": currency_options, "type_options": type_options, "console": console_messages, "page_errors": page_errors}
        print(json.dumps(out, ensure_ascii=False, indent=2))

        browser.close()


if __name__ == '__main__':
    try:
        run()
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
