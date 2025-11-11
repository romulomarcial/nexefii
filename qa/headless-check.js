const fs = require('fs');
const puppeteer = require('puppeteer');

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

(async ()=>{
  const report = { timestamp: new Date().toISOString(), pages: [] };
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(30000);

    const urls = [
      {name:'index', url:'http://127.0.0.1:8004/index.html'},
      {name:'login', url:'http://127.0.0.1:8004/login.html'},
      {name:'shell', url:'http://127.0.0.1:8004/shell.html'}
    ];

    for (const u of urls) {
      const entry = { name: u.name, url: u.url, console: [], errors: [], requestsFailed: [] };

      page.on('console', msg => {
        try{ entry.console.push({type: msg.type(), text: msg.text(), location: msg.location()}); }catch(e){}
      });
      page.on('pageerror', err => entry.errors.push({message: err.message, stack: err.stack}));
      page.on('requestfailed', req => entry.requestsFailed.push({url: req.url(), method: req.method(), failure: req.failure() && req.failure().errorText}));

      try {
        const res = await page.goto(u.url, { waitUntil: 'networkidle2' });
        entry.status = res && res.status ? res.status() : null;
      } catch (e) {
        entry.gotoError = e.message;
      }

      // Small wait to capture late console logs
      await sleep(700);

      // If this is login page, try demo login if inputs exist
      if (u.name === 'login'){
        try{
          const hasUser = await page.$('#user');
          const hasPwd  = await page.$('#pwd');
          const hasBtn  = await page.$('#btnEnter');
          if (hasUser && hasPwd && hasBtn) {
            await page.evaluate(()=>{ localStorage.removeItem('nexefii_session'); localStorage.removeItem('nexefii_lang'); });
            await page.type('#user','demo@nexefii.com',{delay:50});
            await page.type('#pwd','demo123',{delay:50});
            await Promise.all([ page.click('#btnEnter'), page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(()=>{}) ]);
            // capture post-login URL
            entry.postLoginUrl = page.url();
          } else {
            entry.loginAttempt = 'login form not found';
          }
        }catch(e){ entry.loginAttemptError = e.message }
      }

      report.pages.push(entry);

      // detach event handlers to avoid duplicates
      page.removeAllListeners('console');
      page.removeAllListeners('pageerror');
      page.removeAllListeners('requestfailed');
    }

    // Extra: navigate to index after login to see dashboard console state
    try{
      const page2 = await browser.newPage();
      const entry = { name: 'post-login-index', url: 'http://127.0.0.1:8004/index.html', console: [], errors: [], requestsFailed: [] };
      page2.on('console', msg => { try{ entry.console.push({type: msg.type(), text: msg.text(), location: msg.location()}); }catch(e){} });
      page2.on('pageerror', err => entry.errors.push({message: err.message, stack: err.stack}));
      page2.on('requestfailed', req => entry.requestsFailed.push({url: req.url(), method: req.method(), failure: req.failure() && req.failure().errorText}));
      const r = await page2.goto('http://127.0.0.1:8004/index.html', { waitUntil: 'networkidle2' }).catch(()=>null);
      entry.status = r && r.status ? r.status() : null;
      await sleep(700);
      report.pages.push(entry);
    }catch(e){ report.postIndexError = e.message }

    // write report
    const out = JSON.stringify(report, null, 2);
    fs.mkdirSync('qa', { recursive: true });
    fs.writeFileSync('qa/headless-report.json', out, 'utf8');
    console.log('Headless report saved to qa/headless-report.json');
    console.log(out);

  } catch (e) {
    console.error('Fatal error running headless check:', e);
  } finally {
    await browser.close();
  }
})();
