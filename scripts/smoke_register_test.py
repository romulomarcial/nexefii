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
            # pageerror is an Error object; include stack if possible
            try:
                console_messages.append({"type": "pageerror", "text": str(err), "stack": err.stack if hasattr(err, 'stack') else None})
            except Exception:
                console_messages.append({"type": "pageerror", "text": str(err), "stack": None})

        page.on("console", on_console)
        page.on("pageerror", on_page_error)

        # Install an init script to capture global errors with filename/line info
        page.add_init_script("""
            window.__pageErrors = window.__pageErrors || [];
            window.addEventListener('error', function(e){
                try { window.__pageErrors.push({type:'error', message: e.message, filename: e.filename, lineno: e.lineno, colno: e.colno, error: (e.error && e.error.stack) || null}); } catch (_) {}
            });
            window.addEventListener('unhandledrejection', function(e){
                try { window.__pageErrors.push({type:'unhandledrejection', message: (e.reason && e.reason.message) || String(e.reason), stack: (e.reason && e.reason.stack) || null}); } catch(_) {}
            });
        """)

        url = "http://localhost:8000/register.html"
        print(f"Visiting: {url}")
        page.goto(url, wait_until="networkidle", timeout=15000)

        # Wait for form
        try:
            page.wait_for_selector('#registerForm', timeout=5000)
        except Exception:
            pass

        # Fill minimal fields
        try:
            page.fill('#fullName', 'Smoke Test User')
        except Exception:
            pass
        try:
            page.fill('#email', 'smoke@example.com')
        except Exception:
            pass
        try:
            page.fill('#phone', '+1 555 000 0000')
        except Exception:
            pass
        try:
            page.select_option('#country', 'BR')
        except Exception:
            pass

        # Try to select first non-empty property option (if any)
        try:
            page.wait_for_selector('#property option:not([value=""])', timeout=3000)
            opt = page.query_selector('#property option:not([value=""])')
            if opt:
                val = opt.get_attribute('value')
                if val:
                    page.select_option('#property', val)
        except Exception:
            pass

        try:
            page.fill('#position', 'Tester')
        except Exception:
            pass
        try:
            page.fill('#username', 'smoke.test')
        except Exception:
            pass
        try:
            page.fill('#password', 'P@ssw0rd!')
            page.fill('#confirmPassword', 'P@ssw0rd!')
        except Exception:
            pass

        # Click register
        try:
            page.click('#btnRegister')
        except Exception:
            pass

        # Wait for success card
        success = False
        try:
            page.wait_for_selector('#successCard.show', timeout=5000)
            success = True
        except Exception:
            success = False

        # retrieve collected page errors from the page
        try:
            page_errors = page.evaluate('window.__pageErrors || []')
        except Exception:
            page_errors = []

        out = {"success": success, "console": console_messages, "page_errors": page_errors}
        print(json.dumps(out, ensure_ascii=False))

        browser.close()


if __name__ == '__main__':
    try:
        run()
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
