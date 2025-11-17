const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const outDir = path.join(__dirname);
  const screenshotPath = path.join(outDir, 'puppeteer-click-inner-create.png');
  const logPath = path.join(outDir, 'puppeteer-click-inner-create.log');
  const reqPath = path.join(outDir, 'puppeteer-click-inner-create-requests.json');

  const logs = [];
  const requests = [];

  const browser = await puppeteer.launch({ headless: false, args: ['--no-sandbox','--disable-setuid-sandbox'], slowMo: 20 });
  const page = await browser.newPage();
  page.setViewport({ width: 1280, height: 900 });
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);

  // capture console
  page.on('console', msg => { const text = `[console:${msg.type()}] ${msg.text()}`; logs.push(text); console.log(text); });
  page.on('pageerror', err => { const text = `[pageerror] ${err.message}`; logs.push(text); console.error(text); });
  page.on('requestfailed', req => { const r = { url: req.url(), method: req.method(), failure: req.failure() ? req.failure().errorText : null }; requests.push(r); logs.push(`[requestfailed] ${r.method} ${r.url} ${r.failure}`); });
  page.on('requestfinished', async req => { try { const res = req.response(); requests.push({ url: req.url(), method: req.method(), status: res ? res.status() : null }); } catch (e) {} });

  try {
    // set demo master session
    await page.evaluateOnNewDocument(() => {
      try {
        const demo = { id: 'demo-master', username: 'master', name: 'Master User', email: 'master@example.com', role: 'MASTER', properties: [] };
        localStorage.setItem('nexefii_session', JSON.stringify(demo));
      } catch (e) {}
    });

    // open master-control
    await page.goto('http://127.0.0.1:8004/master-control.html', { waitUntil: 'networkidle2', timeout: 60000 });

    // wait for properties tab button and click it
    await page.waitForSelector('.tab-btn[data-tab="properties"]', { timeout: 15000 });
    await page.click('.tab-btn[data-tab="properties"]');

    // wait for tab content to be visible
    await page.waitForSelector('#tab-properties .properties-section', { timeout: 15000 });

    // find inner create button inside properties tab and click it
    const innerBtn = await page.$('#tab-properties #btnCreateProperty');
    if (!innerBtn) {
      logs.push('[test] inner create button not found inside #tab-properties');
      throw new Error('Inner create button not found');
    }
    await innerBtn.click();

    // wait for wizard page to load (wizard may be a separate page at pages/wizard.html)
    await page.waitForFunction(() => {
      try { return !!(document.querySelector('.wizard-page') || document.getElementById('name') || typeof window.createProperty === 'function'); } catch(e) { return false; }
    }, { timeout: 60000 });

    // fill minimal fields if present (similar to existing script)
    await page.evaluate(() => {
      const setIf = (selector, value) => { const el = document.querySelector(selector); if (el) { el.focus(); el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); } };
      setIf('#name', 'InnerBtn Test Property');
      setIf('#slug', 'innerbtn-test-property-' + Date.now());
      setIf('#description', 'Created by inner button test');
      setIf('#roomsCount', '5');
      try { if (window.wizard && (!window.wizard.data.roomCategories || window.wizard.data.roomCategories.length === 0)) { window.wizard.data.roomCategories = [{ name: 'Std', price: 100, count: 5, capacity: 2 }]; } } catch(e) {}
    });

    // small pause
    await page.waitForTimeout(500);

    // trigger create (call window.createProperty if available or click wizard finish button)
    const createResult = await page.evaluate(async () => {
      try {
        if (typeof window.createProperty === 'function') { await window.createProperty(); return { ok: true }; }
        const btn = document.querySelector('#wizardFinish') || document.querySelector('[data-action="wizard-finish"]') || document.querySelector('.wizard-finish');
        if (btn) { btn.click(); return { ok: true, used: 'button' }; }
        return { ok: false, err: 'create trigger not found' };
      } catch (err) { return { ok: false, err: err.message }; }
    });
    logs.push('[test] create trigger result ' + JSON.stringify(createResult));

    // wait for navigation to master-control with selectedProperty
    try {
      await page.waitForFunction(() => {
        try { return (window.location && window.location.href && window.location.href.indexOf('/master-control.html') !== -1 && window.location.href.indexOf('selectedProperty=') !== -1); } catch(e) { return false; }
      }, { timeout: 30000 });
      const finalUrl = await page.evaluate(() => window.location.href);
      logs.push('[test] finalUrl: ' + finalUrl);
      console.log('[test] finalUrl:', finalUrl);
    } catch (e) {
      logs.push('[test] final URL did not match expected pattern');
    }

    await page.waitForTimeout(800);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    fs.writeFileSync(logPath, logs.join('\n'));
    fs.writeFileSync(reqPath, JSON.stringify(requests, null, 2));

    console.log('Saved screenshot:', screenshotPath);
    console.log('Saved logs:', logPath);
    console.log('Saved requests:', reqPath);

  } catch (err) {
    console.error('Puppeteer click-inner test failed:', err);
    logs.push('[fatal] ' + (err && err.stack ? err.stack : String(err)));
    fs.writeFileSync(logPath, logs.join('\n'));
    fs.writeFileSync(reqPath, JSON.stringify(requests, null, 2));
  } finally {
    await browser.close();
  }
})();
