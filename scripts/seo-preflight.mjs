import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const canonicalBaseUrl = process.env.CANONICAL_BASE_URL || "https://labelalignmenttool.com";
const requestTimeoutMs = Number(process.env.SEO_PREFLIGHT_TIMEOUT_MS || 30000);

async function fetchPage(path) {
  const url = `${baseUrl}${path}`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(requestTimeoutMs) });
    return {
      status: response.status,
      ok: response.ok,
      text: await response.text()
    };
  } catch {
    return fetchWithBrowser(url);
  }
}

async function fetchWithBrowser(url) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: requestTimeoutMs });
    return {
      status: response?.status() || 0,
      ok: response?.ok() || false,
      text: await page.content()
    };
  } finally {
    await browser.close();
  }
}

function attr(html, tagPattern, attrName) {
  const tag = html.match(tagPattern)?.[0] || "";
  return tag.match(new RegExp(`${attrName}="([^"]*)"`, "i"))?.[1] || "";
}

function title(html) {
  return html.match(/<title>(.*?)<\/title>/i)?.[1] || "";
}

function description(html) {
  return attr(html, /<meta[^>]+name="description"[^>]*>/i, "content");
}

function robots(html) {
  return attr(html, /<meta[^>]+name="robots"[^>]*>/i, "content");
}

function canonical(html) {
  return attr(html, /<link[^>]+rel="canonical"[^>]*>/i, "href");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function normalizeUrl(url) {
  return url.replace(/\/$/, "");
}

async function main() {
  const pages = [
    { path: "/", canonical: `${canonicalBaseUrl}/` },
    { path: "/barcode-print-check", canonical: `${canonicalBaseUrl}/barcode-print-check` },
    { path: "/daycare-bottle-labels", canonical: `${canonicalBaseUrl}/daycare-bottle-labels` },
    { path: "/about", canonical: `${canonicalBaseUrl}/about` },
    { path: "/privacy", canonical: `${canonicalBaseUrl}/privacy` },
    { path: "/contact", canonical: `${canonicalBaseUrl}/contact` }
  ];

  const seenTitles = new Set();
  const seenDescriptions = new Set();

  for (const page of pages) {
    const response = await fetchPage(page.path);
    assert(response.ok, `${page.path} returned ${response.status}`);

    const pageTitle = title(response.text);
    const pageDescription = description(response.text);
    const pageRobots = robots(response.text).toLowerCase();
    const pageCanonical = canonical(response.text);

    assert(pageTitle, `${page.path} missing title`);
    assert(pageDescription, `${page.path} missing description`);
    assert(!seenTitles.has(pageTitle), `${page.path} duplicates title: ${pageTitle}`);
    assert(!seenDescriptions.has(pageDescription), `${page.path} duplicates description`);
    assert(!pageRobots.includes("noindex"), `${page.path} still has noindex`);
    assert(!pageRobots.includes("nofollow"), `${page.path} still has nofollow`);
    assert(
      normalizeUrl(pageCanonical) === normalizeUrl(page.canonical),
      `${page.path} canonical ${pageCanonical} did not match ${page.canonical}`
    );

    seenTitles.add(pageTitle);
    seenDescriptions.add(pageDescription);
  }

  const robotsResponse = await fetchPage("/robots.txt");
  assert(robotsResponse.ok, "robots.txt missing");
  assert(robotsResponse.text.includes("User-Agent: *"), "robots.txt missing User-Agent");
  assert(robotsResponse.text.includes("Allow: /"), "robots.txt missing Allow");
  assert(robotsResponse.text.includes("Sitemap:"), "robots.txt missing Sitemap");

  const sitemapResponse = await fetchPage("/sitemap.xml");
  assert(sitemapResponse.ok, "sitemap.xml missing");
  assert(sitemapResponse.text.includes(`${canonicalBaseUrl}/`), "sitemap.xml missing homepage canonical");
  assert(
    sitemapResponse.text.includes(`${canonicalBaseUrl}/barcode-print-check`),
    "sitemap.xml missing barcode print check canonical"
  );
  assert(
    sitemapResponse.text.includes(`${canonicalBaseUrl}/daycare-bottle-labels`),
    "sitemap.xml missing daycare bottle labels canonical"
  );

  console.log("SEO preflight passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
