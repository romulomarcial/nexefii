const puppeteer = require('puppeteer');

(async () => {
  const outPath = 'qa/shell-header.png';
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1365, height: 900 });
    // First visit login to ensure demo session is created (login flow seeds demo session)
    const loginUrl = 'http://127.0.0.1:8004/login.html';
    console.log('Opening', loginUrl);
    await page.goto(loginUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    // If login form exists, perform demo login to seed session
    try {
      const hasUser = await page.$('#user');
      const hasPwd = await page.$('#pwd');
      const hasBtn = await page.$('#btnEnter');
      if (hasUser && hasPwd && hasBtn) {
        await page.evaluate(() => { localStorage.removeItem('nexefii_session'); });
        await page.type('#user', 'demo@nexefii.com', { delay: 30 });
        await page.type('#pwd', 'demo123', { delay: 30 });
        await Promise.all([
          page.click('#btnEnter'),
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {})
        ]);
        console.log('Performed demo login');
      }
    } catch (e) {
      console.warn('Login attempt failed or not needed:', e.message || e);
    }

    const url = 'http://127.0.0.1:8004/shell.html';
    console.log('Opening', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('.shell-header', { timeout: 10000 });

    // get header bounding box
    const rect = await page.$eval('.shell-header', el => {
      const r = el.getBoundingClientRect();
      return { x: Math.max(0, Math.floor(r.x)), y: Math.max(0, Math.floor(r.y)), width: Math.floor(r.width), height: Math.floor(r.height) };
    });

    // clamp width/height to viewport
    rect.width = Math.min(rect.width, 1365 - rect.x);
    rect.height = Math.min(rect.height, 900 - rect.y);

    await page.screenshot({ path: outPath, clip: rect });
    console.log('Saved header screenshot to', outPath);
  } catch (err) {
    console.error('Screenshot failed:', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();
