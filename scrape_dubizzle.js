#!/usr/bin/env node
"use strict";

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { createObjectCsvWriter } = require("csv-writer");

const BASE_URL = "https://www.dubizzle.com.eg/vehicles/cars-for-sale/";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function extractListingLinks(page) {
  // Wait until links are present instead of strict network idle (which can hang)
  await page.waitForSelector("a[href*='/ad/']", { timeout: 25000, state: "attached" });
  const links = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a[href*='/ad/']"));
    const unique = new Map();
    for (const a of anchors) {
      const href = a.getAttribute("href");
      if (!href) continue;
      // Normalize to absolute URL
      const url = href.startsWith("http") ? href : new URL(href, location.origin).toString();
      // Only keep property/vehicle ad links
      if (/\/ad\//.test(url)) {
        unique.set(url.split("?")[0], true);
      }
    }
    return Array.from(unique.keys());
  });
  return links;
}

async function clickRevealPhoneIfPresent(page) {
  // Dubizzle hides the phone under a button; try common selectors and text
  const candidates = [
    "button[aria-label*='phone']",
    "button:has-text('Show Phone')",
    "button:has-text('رقم الهاتف')",
    "button:has-text('عرض الهاتف')",
    "._06ac9027 button",
  ];
  for (const sel of candidates) {
    const btn = await page.$(sel).catch(() => null);
    if (btn) {
      try {
        await btn.click({ timeout: 2000 });
        await delay(500);
        return true;
      } catch (_) {
        // ignore
      }
    }
  }
  // Try click by text within the page
  try {
    const el = await page.getByText(/(Show Phone|رقم الهاتف|عرض الهاتف)/).first();
    if (await el.isVisible()) {
      await el.click({ timeout: 2000 });
      await delay(500);
      return true;
    }
  } catch (_) {}
  return false;
}

async function extractAdDetails(page, adUrl) {
  await page.goto(adUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("body", { timeout: 20000, state: "attached" });

  // Attempt to reveal phone
  await clickRevealPhoneIfPresent(page);

  // Pull JSON from hydrated state if present; fallback to DOM scraping
  const hydrated = await page.evaluate(() => {
    try {
      const html = document.documentElement.innerHTML;
      const marker = "window.webpackBundles";
      if (html.includes(marker)) {
        // There is JSON in the page before this marker; extract the trailing assignment that contains ad data
        const match = html.match(/\{"adOfTheDay\":[\s\S]*?\};/);
        if (match) {
          return match[0];
        }
      }
    } catch (e) {}
    return null;
  });

  let name = "";
  let phone = "";
  let price = "";
  let location = "";
  let carType = "";
  let description = "";

  if (hydrated) {
    // Best-effort parse: look for fields in JSON string without fully parsing huge object
    const getVal = (re) => {
      const m = hydrated.match(re);
      return m ? m[1] : "";
    };
    name = getVal(/"contactInfo":\{[^}]*"name"\s*:\s*"([^"]+)"/);
    description = getVal(/"description"\s*:\s*"([\s\S]*?)",\s*"documentCount"/);
    price = getVal(/"formattedValue_l1"\s*:\s*"([0-9.,]+)"\s*}\]/) || getVal(/"price"\s*:\s*(\d+)/);
    // location
    const city = getVal(/"location\.lvl2"\:\{[^}]*"name_l1"\s*:\s*"([^"]+)"/);
    const province = getVal(/"location\.lvl1"\:\{[^}]*"name_l1"\s*:\s*"([^"]+)"/);
    location = [city, province].filter(Boolean).join(", ");
    // car type from formattedExtraFields -> Body Type
    carType = getVal(/"Body Type"[\s\S]*?"formattedValue_l1"\s*:\s*"([^"]+)"/);
  }

  // Fallbacks via DOM
  if (!name) {
    try {
      const n = await page.locator("[data-testid='contact-name'], [class*='contact'] h3, [class*='contact'] .name").first().textContent({ timeout: 1000 });
      name = (n || "").trim();
    } catch (_) {}
  }
  if (!price) {
    try {
      const p = await page.locator("[data-testid='price'], [class*='price']").first().textContent({ timeout: 1000 });
      price = (p || "").replace(/\s+/g, " ").trim();
    } catch (_) {}
  }
  if (!location) {
    try {
      const l = await page.locator("[data-testid='location'], [class*='location']").first().textContent({ timeout: 1000 });
      location = (l || "").replace(/\s+/g, " ").trim();
    } catch (_) {}
  }
  if (!description) {
    try {
      const d = await page.locator("[data-testid='description'], [class*='description']").first().textContent({ timeout: 1000 });
      description = (d || "").replace(/\s+/g, " ").trim();
    } catch (_) {}
  }
  if (!carType) {
    try {
      const spec = await page.locator("text=Body Type").first();
      if (await spec.count()) {
        const row = await spec.locator("xpath=ancestor::*[contains(@class,'row') or contains(@class,'item')][1]");
        const val = await row.locator("[class*='value']").first().textContent({ timeout: 1000 });
        carType = (val || "").trim();
      }
    } catch (_) {}
  }

  // Phone: find visible numbers
  try {
    const phoneText = await page.evaluate(() => {
      const texts = [];
      const phoneNodes = document.querySelectorAll("a[href^='tel:'], [href*='tel:'], [class*='phone'], [data-testid*='phone']");
      phoneNodes.forEach((n) => {
        const t = n.textContent || n.getAttribute("href") || "";
        if (t) texts.push(t);
      });
      const textContent = document.body.innerText || "";
      // Basic phone regex for Egypt numbers
      const re = /(\+?20\s?1[0-9]{9}|01[0-9]{9})/g;
      const matches = Array.from(textContent.matchAll(re)).map((m) => m[0]);
      return texts.concat(matches).join(" | ");
    });
    phone = (phoneText || "").split(" | ").filter(Boolean)[0] || "";
  } catch (_) {}

  return {
    name,
    phone,
    price,
    location,
    carType,
    description,
    link: adUrl,
  };
}

async function run() {
  const argv = process.argv.slice(2);
  const numPages = Math.max(1, parseInt(argv[0] || "1", 10));
  const outPath = path.resolve("/workspace/dubizzle_cars.csv");

  const browser = await chromium.launch({ headless: true, args: ["--disable-blink-features=AutomationControlled"] });
  const context = await browser.newContext({
    locale: "ar-EG",
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    extraHTTPHeaders: {
      "Accept-Language": "ar-EG,ar;q=0.9,en;q=0.8",
    },
  });
  // Block heavy third-party noise but keep scripts and styles from first-party
  await context.route("**/*", (route) => {
    try {
      const req = route.request();
      const url = req.url();
      const type = req.resourceType();
      const thirdParty = /(googletagmanager|google-analytics|doubleclick|hotjar|facebook|snap|taboola|clarity|sentry|mixpanel|segment|amplitude|criteo|yandex|twitter|bing)\./i.test(url);
      if (thirdParty) return route.abort();
      if (type === "image" || type === "media" || type === "font") return route.abort();
    } catch (_) {}
    return route.continue();
  });
  const page = await context.newPage();

  const allLinks = new Set();
  for (let p = 1; p <= numPages; p++) {
    const url = p === 1 ? BASE_URL : `${BASE_URL}?page=${p}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("a[href*='/ad/']", { timeout: 25000, state: "attached" });
    // scroll to load lazy items
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 2000);
      await delay(400);
    }
    const links = await extractListingLinks(page);
    links.forEach((l) => allLinks.add(l));
  }

  const results = [];
  const adPage = await context.newPage();
  for (const link of allLinks) {
    try {
      const details = await extractAdDetails(adPage, link);
      results.push(details);
    } catch (e) {
      results.push({ name: "", phone: "", price: "", location: "", carType: "", description: "", link });
    }
    if (results.length % 5 === 0) {
      await delay(700);
    }
  }

  await browser.close();

  const csvWriter = createObjectCsvWriter({
    path: outPath,
    header: [
      { id: "name", title: "name" },
      { id: "phone", title: "telephone number" },
      { id: "price", title: "price" },
      { id: "location", title: "location" },
      { id: "carType", title: "type of car" },
      { id: "description", title: "description" },
      { id: "link", title: "link of ad" },
    ],
  });
  await csvWriter.writeRecords(results);
  console.log(`Saved ${results.length} records to: ${outPath}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

