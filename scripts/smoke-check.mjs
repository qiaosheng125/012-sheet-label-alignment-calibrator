import dns from "node:dns";

dns.setDefaultResultOrder("ipv4first");

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const requestTimeoutMs = Number(process.env.SMOKE_TIMEOUT_MS || 30000);
const maxAttempts = Number(process.env.SMOKE_ATTEMPTS || 3);

async function fetchWithRetry(url) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fetch(url, { signal: AbortSignal.timeout(requestTimeoutMs) });
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  return fetchWithBrowser(url, lastError);
}

async function fetchWithBrowser(url, originalError) {
  const { chromium } = await import("@playwright/test");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: requestTimeoutMs });
    if (!response) {
      throw originalError;
    }
    const text = await page.content();
    return {
      ok: response.ok(),
      status: response.status(),
      text: async () => text
    };
  } finally {
    await browser.close();
  }
}

async function assertOk(path, expectedText) {
  const response = await fetchWithRetry(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`);
  }
  const text = await response.text();
  if (expectedText && !text.includes(expectedText)) {
    throw new Error(`${path} did not include expected text: ${expectedText}`);
  }
  return text;
}

async function main() {
  const homepage = await assertOk("/", "Label Alignment Tool");
  const checks = [
    "Fix labels not lining up before you waste sticker sheets.",
    "printable label layout",
    "No file upload",
    "Print grid",
    "Print calibration grid",
    "Measure drift",
    "Right and down are positive",
    "Example drift values are prefilled",
    "+X right",
    "30-up address",
    "2 in round",
    "Rows drift down",
    "Copy checklist",
    "Private by design",
    "Daycare labels"
  ];

  for (const check of checks) {
    if (!homepage.includes(check)) {
      throw new Error(`Homepage missing: ${check}`);
    }
  }

  await assertOk("/about", "About Label Alignment Tool");
  const barcodePage = await assertOk("/barcode-print-check", "Check barcode label size before you print a batch.");
  for (const check of [
    "Barcode label print check",
    "quiet-zone",
    "X-dimension",
    "203 DPI risk",
    "Copy checklist",
    "Not a verifier"
  ]) {
    if (!barcodePage.includes(check)) {
      throw new Error(`/barcode-print-check missing: ${check}`);
    }
  }
  const daycarePage = await assertOk("/daycare-bottle-labels", "Plan printable bottle labels and a drop-off checklist.");
  for (const check of [
    "Daycare bottle labels",
    "No child name",
    "Food containers",
    "Backup labels",
    "Missing fields",
    "not daycare compliance advice"
  ]) {
    if (!daycarePage.includes(check)) {
      throw new Error(`/daycare-bottle-labels missing: ${check}`);
    }
  }
  await assertOk("/privacy", "Browser-local label calibration");
  await assertOk("/contact", "Send sanitized label alignment feedback");
  const robots = await assertOk("/robots.txt", "Allow: /");
  if (!robots.includes("User-Agent: *")) {
    throw new Error("robots.txt missing User-Agent");
  }
  if (!robots.includes("Sitemap:")) {
    throw new Error("robots.txt missing Sitemap");
  }
  const sitemap = await assertOk("/sitemap.xml", "<loc>");
  if (!sitemap.includes("/daycare-bottle-labels")) {
    throw new Error("sitemap.xml missing daycare bottle labels route");
  }

  console.log("Smoke check passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
