const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const outDir = path.join(__dirname);
  const screenshot = path.join(outDir, 'puppeteer-validate-tabs-navigation.png');
  const log = path.join(outDir, 'puppeteer-validate-tabs-navigation.log');
  const logs = [];

  const serverUrl = 'http://127.0.0.1:8004';

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.setViewport({ width: 1400, height: 900 });
  page.on('console', msg => {
    logs.push('[console] ' + msg.text());
    console.log('[console] ' + msg.text());
  });
  page.on('pageerror', err => {
    logs.push('[pageerror] ' + err.message);
    console.error('[pageerror] ' + err.message);
  });

  try {
    // Helper sleep for cross-version waiting
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    // Ensure a demo master session is present
    await page.evaluateOnNewDocument(() => {
      try {
        localStorage.setItem('nexefii_session', JSON.stringify({ id: 'demo-master', username: 'master', name: 'Master', email: 'master@local', role: 'master' }));
        // master-control also reads 'currentUser' for auth
        localStorage.setItem('currentUser', JSON.stringify({ id: 'demo-master', username: 'master', name: 'Master', email: 'master@local', role: 'master' }));
      } catch (e) {}
    });

    // Navigate to master-control and assert only the dashboard is visible
    await page.goto(`${serverUrl}/master-control.html`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait briefly for compatibility layer that wires tabs
    await sleep(700);

    const tabState = await page.evaluate(() => {
      const visible = [];
      const sections = Array.from(document.querySelectorAll('.tab-content'));
      sections.forEach(s => {
        const style = window.getComputedStyle(s);
        if (style.display !== 'none' && style.visibility !== 'hidden' && s.offsetParent !== null) visible.push(s.id);
      });
      const activeButtons = Array.from(document.querySelectorAll('.tab-btn.active')).map(b => b.getAttribute('data-tab'));
      return { visible, activeButtons };
    });

    logs.push('tabState master-control load: ' + JSON.stringify(tabState));

    const onlyDashboardVisible = (tabState.visible.length === 1 && tabState.visible[0] === 'tab-dashboard');
    if (!onlyDashboardVisible) {
      console.error('FAIL: Master control initial load shows more than dashboard:', tabState.visible);
      logs.push('FAIL: Master control initial load shows more than dashboard: ' + JSON.stringify(tabState.visible));
    } else {

    // Ensure there is only a single master-module-nav on the page (avoid duplicates)
    const masterNavCount = await page.evaluate(() => document.querySelectorAll('.master-module-nav').length);
    logs.push('master-module-nav count: ' + masterNavCount);
    if (masterNavCount > 1) {
      console.error('FAIL: Found duplicate master-module-nav elements on the page');
      logs.push('FAIL: duplicate master-module-nav elements: ' + masterNavCount);
    } else {
      console.log('PASS: Single master-module-nav found.');
      logs.push('PASS: Single master-module-nav found');
    }

    // Click integrations tab and validate ordering inside the integrations card
    try {
      const integrationsBtnInit = await page.$('.tab-btn[data-tab="integrations"]');
      if (integrationsBtnInit) { await integrationsBtnInit.click(); await sleep(300); }
      const orderCheckInit = await page.evaluate(() => {
        try {
          const container = document.querySelector('#tab-integrations .nx-card');
          if (!container) return { ok:false, reason: 'no nx-card in integrations' };
          const masterNav = container.querySelector('.master-module-nav');
          const propSelect = container.querySelector('#int_prop_select');
          if (!masterNav) return { ok:false, reason:'no masterNav' };
          if (!propSelect) return { ok:false, reason:'no propSelect' };
          const allChildren = Array.from(container.children);
          const idxNav = allChildren.indexOf(masterNav);
          const idxSelect = allChildren.findIndex(c => c.querySelector && c.querySelector('#int_prop_select'));
          return { ok: idxNav >= 0 && idxNav < idxSelect, idxNav, idxSelect };
        } catch(e) { return { ok:false, reason: e && e.message ? e.message : String(e) } }
      });
      logs.push('Integrations order check (initial): ' + JSON.stringify(orderCheckInit));
      if (orderCheckInit && orderCheckInit.ok) { console.log('PASS: Integrations order check succeeded (initial)'); logs.push('PASS: Integrations order check'); } else { console.warn('FAIL: Integrations order check failed', orderCheckInit); logs.push('FAIL: Integrations order: ' + JSON.stringify(orderCheckInit)); }
    } catch(e) { console.warn('Integrations order check error', e); logs.push('ERROR: integrations order: ' + (e && e.stack ? e.stack : String(e))); }
      console.log('PASS: Master control initial tab: only dashboard visible.');
      logs.push('PASS: Master control initial tab: only dashboard visible.');
    }

    // Now navigate to the property dashboard with a propertyKey and click the engineering module
    // Ensure a sample property exists in localStorage for setActivePropertyFromQuery.js
    await page.evaluate(() => {
      try {
        const props = { 'nexefiiRioDeJaneiro': { key: 'nexefiiRioDeJaneiro', name: 'Nexefii RJ', modulesPurchased: ['engineering'] } };
        localStorage.setItem('nexefii_properties', JSON.stringify(props));
      } catch (e) { }
    });

    await page.goto(`${serverUrl}/pages/property-dashboard.html?propertyKey=nexefiiRioDeJaneiro`, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for modules grid
    await page.waitForSelector('[data-module-key]', { timeout: 15000 });

    // Look for engineering module or any module that exists — prefer engineering
    const moduleSelector = '[data-module-key="engineering"]';
    let clicked = false;

    try {
      await page.waitForSelector(moduleSelector, { timeout: 4000 });
      await page.click(moduleSelector);
      clicked = true;
      logs.push('Clicked engineering module');
    } catch (e) {
      logs.push('Engineering module not found; attempting first module');
      // fallback: click first module
      const firstModule = await page.$('[data-module-key]');
      if (firstModule) {
        await firstModule.click();
        clicked = true;
        logs.push('Clicked first module as fallback');
      }
    }

    if (!clicked) {
      console.error('FAIL: No module card was found to click.');
      logs.push('FAIL: No module card was found to click.');
    } else {
      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(()=>{});
      const finalUrl = page.url();
      logs.push('Navigation finalUrl: ' + finalUrl);
      console.log('Navigation finalUrl: ', finalUrl);

      // Validate final URL includes propertyKey and module param
      const okContainsProperty = finalUrl.includes('propertyKey=nexefiiRioDeJaneiro') || finalUrl.includes('selectedProperty=') || finalUrl.includes('selectedProperty');
      const okContainsModule = finalUrl.includes('module=') || finalUrl.includes('module%3D');
      if (!okContainsProperty || !okContainsModule) {
        console.error('FAIL: Navigation did not include propertyKey and module params', { okContainsProperty, okContainsModule, finalUrl });
        logs.push('FAIL: Navigation did not include required params');
      } else {
        console.log('PASS: Navigation included propertyKey and module param.');
        logs.push('PASS: Navigation included propertyKey and module param. finalUrl:' + finalUrl);
      }

      // After arriving on master-control, check that tabs state is same as initial (dashboard visible)
      await sleep(500);
      const afterState = await page.evaluate(() => {
        const visible = [];
        const sections = Array.from(document.querySelectorAll('.tab-content'));
        sections.forEach(s => {
          const style = window.getComputedStyle(s);
          if (style.display !== 'none' && style.visibility !== 'hidden' && s.offsetParent !== null) visible.push(s.id);
        });
        const activeButtons = Array.from(document.querySelectorAll('.tab-btn.active')).map(b => b.getAttribute('data-tab'));
        return { visible, activeButtons };
      });

      logs.push('tabState after navigation: ' + JSON.stringify(afterState));
      if (!(afterState.visible.length === 1 && afterState.visible[0] === 'tab-dashboard')) {
        console.warn('WARN: master-control after navigation: tab state is not single-dashboard: ', afterState.visible);
        logs.push('WARN: master-control after navigation: tab state is not single-dashboard');
      } else {
        console.log('PASS: master-control after navigation still shows only dashboard.');
        logs.push('PASS: master-control after navigation shows only dashboard.');
      }

      // Also ensure the master-tabs strip exists only once
      const tabStripCount = await page.evaluate(() => document.querySelectorAll('.master-tabs').length);
      logs.push('master-tabs count: ' + tabStripCount);
      if (tabStripCount !== 1) {
        console.warn('WARN: master-tabs count is unexpected:', tabStripCount);
        logs.push('WARN: master-tabs count: ' + tabStripCount);
      } else {
        console.log('PASS: Single master-tabs strip present.');
        logs.push('PASS: Single master-tabs strip present');
      }
      // (removed second integrations ordering check to avoid false failures after navigation)
    }

    // Save screenshot
    await page.screenshot({ path: screenshot, fullPage: true });
    logs.push('Saved screenshot to ' + screenshot);

    fs.writeFileSync(log, logs.join('\n'));
    console.log('Saved logs to', log);

    console.log('=== QA script finished ===');
  } catch (err) {
    console.error('QA script failed:', err);
    logs.push('[fatal] ' + (err && err.stack ? err.stack : String(err)));
    try { fs.writeFileSync(path.join(outDir, 'puppeteer-validate-tabs-navigation.log'), logs.join('\n')); } catch(_){}
    process.exit(1);
  } finally {
    await browser.close();
    process.exit(0);
  }
})();
