const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const outDir = path.join(__dirname);
  const screenshotPath = path.join(outDir, 'puppeteer-create-property.png');
  const logPath = path.join(outDir, 'puppeteer-create-property.log');
  const reqPath = path.join(outDir, 'puppeteer-requests.json');

  const logs = [];
  const requests = [];

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 900 });

  // small helper for sleeps (compatibility across puppeteer versions)
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // capture console
  page.on('console', msg => {
    const text = `[console:${msg.type()}] ${msg.text()}`;
    logs.push(text);
    console.log(text);
  });

  // capture page errors
  page.on('pageerror', err => {
    const text = `[pageerror] ${err.message}`;
    logs.push(text);
    console.error(text);
  });

  // capture failed requests
  page.on('requestfailed', req => {
    const r = {
      url: req.url(),
      method: req.method(),
      failure: req.failure() ? req.failure().errorText : null
    };
    requests.push(r);
    logs.push(`[requestfailed] ${r.method} ${r.url} ${r.failure}`);
  });

  // capture all requests/responses (light)
  page.on('requestfinished', async req => {
    try {
      const res = req.response();
      requests.push({ url: req.url(), method: req.method(), status: res ? res.status() : null });
    } catch (e) { /* ignore */ }
  });

  try {
    // Ensure demo session exists before any page scripts execute
    await page.evaluateOnNewDocument(() => {
      try {
        const demo = { id: 'demo-user', username: 'Demo User', name: 'Demo User', email: 'demo@example.com', properties: [] };
        localStorage.setItem('nexefii_session', JSON.stringify(demo));
        localStorage.setItem('nexefii_session', JSON.stringify(demo));
      } catch (e) { /* ignore */ }
    });

    // Visit the shell entrypoint so the SPA router and shell initialize
    await page.goto('http://localhost:8004/shell.html', { waitUntil: 'networkidle2' });

    // wait until the in-app router is ready, then navigate to wizard route
    await page.waitForFunction(() => {
      return !!(window.NEXEFII && window.NEXEFII.router && typeof window.NEXEFII.router.navigate === 'function');
    }, { timeout: 30000 });

    // navigate to wizard route using the in-app router so shell loads the page fragment
    await page.evaluate(() => window.NEXEFII.router.navigate('/wizard'));

    // wait for wizard to render: be robust by waiting for one of these signals:
    // - the #name input exists, OR
    // - a global createProperty function is present, OR
    // - the window.wizard manager object exists
    await page.waitForFunction(() => {
      try {
        if (document.querySelector('#name')) return true;
        if (typeof window.createProperty === 'function') return true;
        if (window.wizard) return true;
        return false;
      } catch (e) { return false; }
    }, { timeout: 20000 });

    // fill minimal fields
    await page.evaluate(() => {
      // Prefer DOM id `name` if exists
      const setIf = (selector, value) => {
        const el = document.querySelector(selector);
        if (el) { el.focus(); el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }
      };
      setIf('#name', 'Puppeteer Test Property');
      setIf('#slug', 'puppeteer-test-property');
      setIf('#description', 'Created by Puppeteer test');
      // set rooms count
      setIf('#roomsCount', '10');
      // ensure a minimum room category exists
      try {
        if (window.wizard && (!window.wizard.data.roomCategories || window.wizard.data.roomCategories.length === 0)) {
          window.wizard.data.roomCategories = [{ name: 'Standard', price: 100, count: 10, capacity: 2 }];
        }
      } catch (e) { /* ignore */ }
    });

  // small pause to let any bindings update
  await sleep(400);

    // call the create action directly (guards included)
    const createResult = await page.evaluate(async () => {
      try {
        if (typeof window.createProperty === 'function') {
          await window.createProperty();
          return { ok: true };
        }
        return { ok: false, err: 'createProperty not found' };
      } catch (err) {
        return { ok: false, err: err.message };
      }
    });

    logs.push(`[test] createProperty result ${JSON.stringify(createResult)}`);
    console.log('[test] createProperty result', createResult);

    // wait for dashboard to load (either route change or dashboard DOM)
    try {
      await page.waitForSelector('.dashboard-page, #property-title, .dashboard-header', { timeout: 15000 });
    } catch (e) {
      logs.push('[test] dashboard selector not found after create - check network logs');
    }

  // give a moment and capture screenshot
  await sleep(800);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // write logs and requests
    fs.writeFileSync(logPath, logs.join('\n'));
    fs.writeFileSync(reqPath, JSON.stringify(requests, null, 2));

    console.log('Saved screenshot:', screenshotPath);
    console.log('Saved logs:', logPath);
    console.log('Saved requests:', reqPath);

  } catch (err) {
    console.error('Puppeteer script failed:', err);
    logs.push('[fatal] ' + (err && err.stack ? err.stack : String(err)));
    fs.writeFileSync(logPath, logs.join('\n'));
    fs.writeFileSync(reqPath, JSON.stringify(requests, null, 2));
  } finally {
    await browser.close();
  }

})();

