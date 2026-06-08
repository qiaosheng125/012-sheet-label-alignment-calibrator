import { chromium } from "@playwright/test";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:3000";
const allowedHosts = new Set([
  "127.0.0.1",
  "localhost",
  new URL(baseUrl).hostname,
  "www.googletagmanager.com",
  "www.google-analytics.com",
  "region1.google-analytics.com",
  "analytics.google.com",
  "www.clarity.ms",
  "clarity.ms",
  "c.clarity.ms",
  "scripts.clarity.ms",
  "n.clarity.ms",
  "c.bing.com"
]);

const bannedTokens = [
  "customer address",
  "order number",
  "private artwork",
  "raw custom geometry",
  "pageWidthMm",
  "labelWidthMm",
  "marginLeftMm",
  "Original placeholder design"
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const requests = [];
  const leaks = [];

  page.on("request", (request) => {
    const url = new URL(request.url());
    requests.push(request.url());
    const isLocalSample = url.hostname === new URL(baseUrl).hostname && url.pathname.startsWith("/samples/");
    if (!allowedHosts.has(url.hostname) && !isLocalSample) {
      leaks.push(`external_request:${request.url()}`);
    }
    if (!isLocalSample) {
      for (const token of bannedTokens) {
        if (request.url().includes(token)) {
          leaks.push(`request_token:${token}`);
        }
      }
    }
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /2 in round/i }).click();
  await page.getByRole("button", { name: /rows drift down/i }).click();
  await page.getByText("Progressive drift is usually not a one-nudge problem.").waitFor({ timeout: 10000 });
  await page.getByRole("button", { name: /copy checklist/i }).click();
  await page.getByText("Copied").waitFor({ timeout: 5000 });

  const bodyText = await page.locator("body").innerText();
  if (!bodyText.includes("No upload and no raw custom geometry in analytics.")) {
    leaks.push("missing_local_privacy_copy");
  }
  if (!bodyText.includes("Progressive drift is usually not a one-nudge problem.")) {
    leaks.push("missing_report");
  }

  const storageLeak = await page.evaluate((tokens) => {
    const storageText = [
      ...Array.from({ length: localStorage.length }, (_, index) => {
        const key = localStorage.key(index) || "";
        return `${key}:${localStorage.getItem(key) || ""}`;
      }),
      ...Array.from({ length: sessionStorage.length }, (_, index) => {
        const key = sessionStorage.key(index) || "";
        return `${key}:${sessionStorage.getItem(key) || ""}`;
      })
    ].join("\n");
    return tokens.find((token) => storageText.includes(token)) || "";
  }, bannedTokens);
  if (storageLeak) {
    leaks.push(`storage_token:${storageLeak}`);
  }

  await browser.close();

  if (leaks.length > 0) {
    throw new Error(`Privacy smoke failed:\n${leaks.join("\n")}\nRequests:\n${requests.join("\n")}`);
  }

  console.log("Privacy smoke passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
