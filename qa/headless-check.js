/**
 * qa/headless-check.js
 * Headless smoke test para Nexefii.
 * - Varre páginas chave
 * - Coleta console, page errors, e respostas 4xx/5xx
 * - Gera qa/headless-report.json
 * - Sai com code 1 se encontrar erro crítico
 *
 * Personalização:
 *  - Base URL: defina env NEXEFII_URL (ex.: http://127.0.0.1:8004)
 *  - Páginas: ajuste o array PAGES
 */

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const BASE = process.env.NEXEFII_URL || "http://127.0.0.1:8004";
const OUT_DIR = path.join(process.cwd(), "qa");
const OUT_FILE = path.join(OUT_DIR, "headless-report.json");

// ajuste as rotas conforme seu app
const PAGES = [
  "/",                 // geralmente resolve para index.html
  "/index.html",
  "/master-control.html",
  "/alerts-control.html",
  "/housekeeping-control.html",
  "/engineering-list.html",
];

function nowISO() {
  return new Date().toISOString();
}

async function run() {
  const report = {
    startedAt: nowISO(),
    baseUrl: BASE,
    pages: [],
    summary: {
      totalPages: 0,
      pageErrors: 0,
      consoleErrors: 0,
      httpErrors: 0,
    },
  };

  let fatalErrors = 0;
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  // Try to seed a demo session by performing a login on /login.html if available.
  async function seedDemoLogin() {
    try {
      const p = await browser.newPage();
      await p.goto(new URL('/login.html', BASE).toString(), { waitUntil: ['domcontentloaded','networkidle2'], timeout: 30000 }).catch(()=>null);
      const hasUser = await p.$('#user');
      const hasPwd = await p.$('#pwd');
      const hasBtn = await p.$('#btnEnter');
      if (hasUser && hasPwd && hasBtn) {
        await p.evaluate(()=>{ localStorage.removeItem('nexefii_session'); });
        await p.type('#user','demo@nexefii.com',{delay:30});
        await p.type('#pwd','demo123',{delay:30});
        await Promise.all([ p.click('#btnEnter'), p.waitForNavigation({ waitUntil: ['networkidle2'], timeout: 15000 }).catch(()=>{}) ]);
        console.log('[headless-check] demo login attempted');
      }
      // Ensure demo properties and session are present for pages that expect them (master-control)
      try {
        await p.evaluate(() => {
          try {
            const demoProps = {
              "nexefiiSaoPaulo": { key: "nexefiiSaoPaulo", name: "São Paulo", active: true },
              "nexefiiMiami": { key: "nexefiiMiami", name: "Miami", active: true }
            };
            localStorage.setItem('nexefii_properties', JSON.stringify(demoProps));
            // Populate currentUser and nexefii_session for compatibility
            const demoSession = { username: 'demo', email: 'demo@nexefii.com', properties: ['nexefiiSaoPaulo','nexefiiMiami'] };
            localStorage.setItem('currentUser', JSON.stringify(demoSession));
            localStorage.setItem('nexefii_session', JSON.stringify(demoSession));
            localStorage.setItem('nexefii_session', JSON.stringify(demoSession));
          } catch (e) { /* ignore */ }
        });
      } catch (e) { /* ignore */ }
      await p.close();
    } catch (e) {
      console.warn('[headless-check] demo login failed:', e?.message || e);
    }
  }

  try {
    // Seed demo session before page checks
    await seedDemoLogin();

    for (const route of PAGES) {
      const url = new URL(route, BASE).toString();
      const page = await browser.newPage();

      const pageResult = {
        url,
        startedAt: nowISO(),
        status: null,
        metrics: {
          console: { error: 0, warn: 0, log: 0 },
          pageErrors: 0,
          http4xx5xx: 0,
        },
        console: [],
        pageErrors: [],
        httpErrors: [],
        ok: true,
      };

      // Console capture
      page.on("console", (msg) => {
        const type = msg.type();
        const text = msg.text();
        pageResult.console.push({ type, text });
        if (type === "error") {
          pageResult.metrics.console.error += 1;
        } else if (type === "warning" || type === "warn") {
          pageResult.metrics.console.warn += 1;
        } else {
          pageResult.metrics.console.log += 1;
        }
      });

      // JS errors on page
      page.on("pageerror", (err) => {
        pageResult.pageErrors.push(String(err));
        pageResult.metrics.pageErrors += 1;
      });

      // Track responses 4xx/5xx
      page.on("response", (res) => {
        const status = res.status();
        if (status >= 400) {
          pageResult.httpErrors.push({
            url: res.url(),
            status,
            statusText: res.statusText?.() || "",
          });
          pageResult.metrics.http4xx5xx += 1;
        }
      });

      // Navigate
      let resp = null;
      try {
        resp = await page.goto(url, {
          waitUntil: ["domcontentloaded", "networkidle2"],
          timeout: 120_000,
        });
      } catch (e) {
        pageResult.gotoError = String(e);
      }

      pageResult.status = resp ? resp.status() : null;

  // Pequeno atraso para capturar logs pós-carregamento
  // Compat: some puppeteer builds expose page.waitForTimeout, others don't.
  // Use a lightweight sleep to remain compatible across puppeteer versions.
  await new Promise((res) => setTimeout(res, 800));

      // Decide sucesso/fracasso da página
      const pageHasErrors =
        pageResult.metrics.pageErrors > 0 ||
        pageResult.metrics.console.error > 0 ||
        pageResult.metrics.http4xx5xx > 0 ||
        (pageResult.status && pageResult.status >= 400);

      if (pageHasErrors) {
        pageResult.ok = false;
        fatalErrors +=
          pageResult.metrics.pageErrors +
          pageResult.metrics.console.error +
          pageResult.metrics.http4xx5xx +
          (pageResult.status && pageResult.status >= 400 ? 1 : 0);
      }

      pageResult.finishedAt = nowISO();
      report.pages.push(pageResult);

      await page.close();
    }
  } finally {
    await browser.close();
  }

  // Summary
  report.summary.totalPages = report.pages.length;
  report.summary.pageErrors = report.pages.reduce(
    (acc, p) => acc + p.metrics.pageErrors,
    0
  );
  report.summary.consoleErrors = report.pages.reduce(
    (acc, p) => acc + p.metrics.console.error,
    0
  );
  report.summary.httpErrors = report.pages.reduce(
    (acc, p) => acc + p.metrics.http4xx5xx,
    0
  );
  report.finishedAt = nowISO();

  // Ensure qa folder exists
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(report, null, 2), "utf8");

  // Exit code: 0 ok, 1 if any error found
  const hasAnyError =
    report.summary.pageErrors > 0 ||
    report.summary.consoleErrors > 0 ||
    report.summary.httpErrors > 0 ||
    report.pages.some((p) => p.status && p.status >= 400);

  if (hasAnyError) {
    console.error(
      `[headless-check] FAIL | pages=${report.summary.totalPages} ` +
        `pageErrors=${report.summary.pageErrors} ` +
        `consoleErrors=${report.summary.consoleErrors} ` +
        `httpErrors=${report.summary.httpErrors}`
    );
    process.exit(1);
  } else {
    console.log(
      `[headless-check] OK | pages=${report.summary.totalPages} ` +
        `pageErrors=0 consoleErrors=0 httpErrors=0`
    );
  }
}

run().catch((e) => {
  console.error("[headless-check] Uncaught runner error:", e);
  process.exit(1);
});

