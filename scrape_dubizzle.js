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
    "button:has-text('Show Number')",
    "button:has-text('Call')",
    "button:has-text('رقم الهاتف')",
    "button:has-text('عرض الهاتف')",
    "button:has-text('اتصال')",
    "button:has-text('إظهار')",
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
    const el = await page.getByText(/(Show Phone|Show Number|Call|رقم الهاتف|عرض الهاتف|اتصال|إظهار)/).first();
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
  const { hydrated, ldjson } = await page.evaluate(() => {
    try {
      const html = document.documentElement.innerHTML;
      const marker = "window.webpackBundles";
      if (html.includes(marker)) {
        // There is JSON in the page before this marker; extract the trailing assignment that contains ad data
        const match = html.match(/\{"adOfTheDay\":[\s\S]*?\};/);
        // Not always present on detail pages
        const hydrated = match ? match[0] : null;
        // Collect JSON-LD blocks as well
        const ld = Array.from(document.querySelectorAll("script[type='application/ld+json']")).map(s => s.textContent || "");
        return { hydrated, ldjson: ld };
      }
    } catch (e) {}
    const ld = Array.from(document.querySelectorAll("script[type='application/ld+json']")).map(s => s.textContent || "");
    return { hydrated: null, ldjson: ld };
  });

  let name = "";
  let phone = "";
  let price = "";
  let location = "";
  let carType = "";
  let description = "";
  let adTitle = "";

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

  // Use JSON-LD if available
  if ((!name || !price || !description || !carType || !location) && ldjson && ldjson.length) {
    const objs = [];
    for (const raw of ldjson) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) parsed.forEach(o => objs.push(o));
        else objs.push(parsed);
      } catch (_) {}
    }
    const find = (pred) => objs.find(pred) || {};
    // Breadcrumbs can contain location
    const breadcrumbs = objs.find(o => o && o['@type'] === 'BreadcrumbList');
    if (breadcrumbs && !location) {
      try {
        const items = breadcrumbs.itemListElement || [];
        const names = items.map(i => (i && (i.name || (i.item && i.item.name))) || "").filter(Boolean);
        // take last 2 as city, province when available
        if (names.length >= 2) {
          location = names.slice(-2).join(", ");
        } else if (names.length === 1) {
          location = names[0];
        }
      } catch (_) {}
    }
    const vehicle = find(o => (o && (o['@type'] === 'Car' || o['@type'] === 'Vehicle' || o['@type'] === 'Product')));
    if (vehicle && !adTitle) adTitle = vehicle.name || vehicle.model || "";
    const offer = vehicle && vehicle.offers ? vehicle.offers : find(o => o && o['@type'] === 'Offer');
    if (!name) {
      let seller = vehicle?.seller || offer?.seller || find(o => o && o.seller)?.seller || find(o => o && o.provider)?.provider || {};
      if (typeof seller === 'string') name = seller;
      else name = seller?.name || name;
    }
    if (!price) {
      price = offer?.price || vehicle?.price || "";
      if (price && offer?.priceCurrency) price = `${price} ${offer.priceCurrency}`;
    }
    if (!description) description = vehicle?.description || find(o => o && o.description)?.description || "";
    if (!carType) carType = vehicle?.bodyType || vehicle?.vehicleConfiguration || [vehicle?.brand?.name, vehicle?.model?.name].filter(Boolean).join(" ");
    if (!location) {
      const addr = vehicle?.address || offer?.availableAtOrFrom || find(o => o && o.address)?.address;
      if (addr && typeof addr === 'object') {
        const locParts = [addr.addressLocality, addr.addressRegion, addr.addressCountry].filter(Boolean);
        location = locParts.join(", ");
      }
    }
  }

  // Meta tag fallbacks (title, price)
  try {
    const meta = await page.evaluate(() => {
      const get = (sel, attr) => {
        const el = document.querySelector(sel);
        return el ? el.getAttribute(attr) || "" : "";
      };
      return {
        ogTitle: get("meta[property='og:title']", "content"),
        ogDesc: get("meta[property='og:description']", "content"),
        productPrice: get("meta[property='product:price:amount']", "content"),
        twitterPrice: get("meta[name='twitter:data1']", "content"),
      };
    });
    if (!adTitle && meta.ogTitle) adTitle = meta.ogTitle;
    if (!description && meta.ogDesc) description = meta.ogDesc;
    if (!price) {
      if (meta.productPrice) price = meta.productPrice;
      else if (meta.twitterPrice) price = meta.twitterPrice;
    }
  } catch (_) {}

  // Fallbacks via DOM
  if (!name) {
    try {
      const n = await page.locator("[data-testid='contact-name'], [class*='contact'] h3, [class*='contact'] .name, [class*='Seller'] h3").first().textContent({ timeout: 1500 });
      name = (n || "").trim();
    } catch (_) {}
  }
  if (!price) {
    try {
      const p = await page.locator("[data-testid='price'], [class*='price'], [itemprop='price']").first().textContent({ timeout: 1500 });
      price = (p || "").replace(/\s+/g, " ").trim();
    } catch (_) {}
  }
  if (!location) {
    try {
      const l = await page.locator("[data-testid='location'], [class*='location'], [itemprop='address']").first().textContent({ timeout: 1500 });
      location = (l || "").replace(/\s+/g, " ").trim();
    } catch (_) {}
  }
  if (!description) {
    try {
      const d = await page.locator("[data-testid='description'], [class*='description'], meta[name='description']").first().textContent({ timeout: 1500 }).catch(async () => (await page.locator("meta[name='description']").first().getAttribute('content')));
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
    if (!carType) {
      try {
        const arSpec = await page.getByText(/نوع الهيكل|هيكل السيارة/).first();
        if (await arSpec.count()) {
          const row = await arSpec.locator("xpath=ancestor::*[contains(@class,'row') or contains(@class,'item')][1]");
          const val = await row.locator("[class*='value']").first().textContent({ timeout: 1000 });
          carType = (val || "").trim();
        }
      } catch (_) {}
    }
    if (!carType && adTitle) {
      carType = adTitle;
    }
  }

  // Phone: find visible numbers
  try {
    const phoneText = await page.evaluate(() => {
      const texts = [];
      const phoneNodes = document.querySelectorAll("a[href^='tel:'], [href*='tel:'], [class*='phone'], [data-testid*='phone'], a[href*='wa.me']");
      phoneNodes.forEach((n) => {
        let t = n.textContent || n.getAttribute("href") || "";
        if (/wa\.me\//.test(t)) {
          const m = t.match(/wa\.me\/(\d+)/);
          if (m) t = `+${m[1]}`;
        }
        if (t) texts.push(t);
      });
      let textContent = document.body.innerText || "";
      // Normalize Arabic-Indic digits to ASCII
      const arabicToAscii = {
        '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'
      };
      textContent = textContent.replace(/[٠-٩]/g, d => arabicToAscii[d] || d);
      // Basic phone regex for Egypt numbers
      const re = /(\+?20\s?1[0-9]{9}|01[0-9]{9}|\+20\s?2\s?\d{8})/g;
      const matches = Array.from(textContent.matchAll(re)).map((m) => m[0]);
      return texts.concat(matches).join(" | ");
    });
    phone = (phoneText || "").split(" | ").filter(Boolean)[0] || "";
  } catch (_) {}

  // Final fallbacks to prevent empty columns
  if (!name) name = "-";
  if (!price) price = "-";
  if (!location) location = "-";
  if (!carType) carType = adTitle || "-";
  if (!description) description = "-";

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

