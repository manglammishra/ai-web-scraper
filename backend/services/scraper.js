import * as cheerio from "cheerio";
import dns from "node:dns/promises";
import net from "node:net";

const MAX_CHARS = 15000; // keep the prompt small and fast
const TIMEOUT_MS = 10000;

class HttpError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function isPrivateIp(ip) {
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    return v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 || a === 127 || a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

async function assertSafeUrl(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new HttpError("That doesn't look like a valid URL.");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new HttpError("Only http and https URLs are supported.");
  }
  try {
    const { address } = await dns.lookup(parsed.hostname);
    if (isPrivateIp(address)) throw new HttpError("Private or local addresses are not allowed.");
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError("Could not resolve that website.");
  }
  return parsed.toString();
}

export async function scrapePage(rawUrl) {
  const url = await assertSafeUrl(rawUrl);

  let res;
  try {
    res = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AIWebScraper/1.0)" },
    });
  } catch {
    throw new HttpError("Could not fetch the page (timeout or network error).", 502);
  }

  if (!res.ok) throw new HttpError(`The website responded with status ${res.status}.`, 502);

  const type = res.headers.get("content-type") || "";
  if (!type.includes("text/html")) throw new HttpError("That URL is not an HTML page.");

  const html = await res.text();
  const $ = cheerio.load(html);

  const title = $("title").first().text().trim() || $("h1").first().text().trim() || url;

  // Remove everything that isn't main content
  $("script, style, noscript, iframe, svg, nav, header, footer, aside, form, button").remove();

  // Prefer the main content area when the page has one
  const root = $("main").length ? $("main") : $("article").length ? $("article") : $("body");

  const text = root.text().replace(/\s+/g, " ").trim().slice(0, MAX_CHARS);

  if (text.length < 50) {
    throw new HttpError("Not enough readable text found (the page may need JavaScript to render).", 422);
  }
  return { title, text };
}
