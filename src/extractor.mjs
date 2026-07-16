const MONEY_TOKEN = String.raw`(?:US\$|USD\s*)?\$?\s*\d{2,3}(?:[,.]\d{3})*(?:\.\d+)?\s*[kKmM]?`;
const RANGE_RE = new RegExp(`(${MONEY_TOKEN})\\s*(?:-|–|—|to|through)\\s*(${MONEY_TOKEN})(?:\\s*(?:per|/|a|an)?\\s*(year|yr|annual|annually|hour|hr|hourly|month|mo|week|wk|day))?`, "i");
const SINGLE_RE = new RegExp(`(?:from|starting at|up to|salary|compensation|base pay|pay range)?\\s*(${MONEY_TOKEN})(?:\\s*(?:per|/|a|an)?\\s*(year|yr|annual|annually|hour|hr|hourly|month|mo|week|wk|day))`, "i");

const clean = (value = "") => String(value).replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").trim();
const lower = (value = "") => clean(value).toLowerCase();

function first(...values) {
  for (const value of values.flat(Infinity)) {
    if (value !== undefined && value !== null && clean(value)) return clean(value);
  }
  return "";
}

function moneyToNumber(token) {
  if (!token) return null;
  const normalized = String(token).replace(/US\$|USD|\$|,/gi, "").trim();
  const suffix = normalized.slice(-1).toLowerCase();
  const number = Number.parseFloat(normalized.replace(/[km]$/i, ""));
  if (!Number.isFinite(number)) return null;
  if (suffix === "k") return Math.round(number * 1_000);
  if (suffix === "m") return Math.round(number * 1_000_000);
  return Number(number.toFixed(2));
}

function normalizeUnit(value = "") {
  const v = lower(value);
  if (/hour|hr/.test(v)) return "HOUR";
  if (/month|mo/.test(v)) return "MONTH";
  if (/week|wk/.test(v)) return "WEEK";
  if (/day/.test(v)) return "DAY";
  return "YEAR";
}

function normalizeCurrency(value = "", text = "") {
  const v = `${value} ${text}`.toUpperCase();
  if (/\bCAD\b|C\$/.test(v)) return "CAD";
  if (/\bGBP\b|£/.test(v)) return "GBP";
  if (/\bEUR\b|€/.test(v)) return "EUR";
  if (/\bAUD\b|A\$/.test(v)) return "AUD";
  return "USD";
}

function parseStructuredSalary(baseSalary) {
  if (!baseSalary) return null;
  const items = Array.isArray(baseSalary) ? baseSalary : [baseSalary];
  for (const item of items) {
    const value = item?.value ?? item;
    const min = Number(value?.minValue ?? value?.value ?? item?.minValue);
    const max = Number(value?.maxValue ?? value?.value ?? item?.maxValue);
    if (Number.isFinite(min) || Number.isFinite(max)) {
      return {
        min: Number.isFinite(min) ? min : Number.isFinite(max) ? max : null,
        max: Number.isFinite(max) ? max : Number.isFinite(min) ? min : null,
        currency: normalizeCurrency(item?.currency || value?.currency),
        unit: normalizeUnit(value?.unitText || item?.unitText),
        source: "structured data",
        confidence: "high"
      };
    }
  }
  return null;
}

export function parseSalary(text = "", structuredSalary = null, domSalary = "") {
  const structured = parseStructuredSalary(structuredSalary);
  if (structured) return structured;
  const candidates = [domSalary, ...clean(text).split(/\n/).filter(line => /\$|USD|salary|compensation|base pay|pay range|per hour|hourly/i.test(line)).slice(0, 60)];
  for (const line of candidates) {
    const match = clean(line).match(RANGE_RE);
    if (!match) continue;
    const min = moneyToNumber(match[1]);
    const max = moneyToNumber(match[2]);
    if (!min || !max) continue;
    return {
      min: Math.min(min, max),
      max: Math.max(min, max),
      currency: normalizeCurrency("", line),
      unit: normalizeUnit(match[3] || line),
      source: line === domSalary ? "page salary element" : "visible page text",
      confidence: line === domSalary ? "high" : "medium"
    };
  }
  for (const line of candidates) {
    const match = clean(line).match(SINGLE_RE);
    if (!match) continue;
    const value = moneyToNumber(match[1]);
    if (!value) continue;
    const isMax = /up to|max(?:imum)?/i.test(line);
    return {
      min: isMax ? null : value,
      max: isMax ? value : null,
      currency: normalizeCurrency("", line),
      unit: normalizeUnit(match[2] || line),
      source: line === domSalary ? "page salary element" : "visible page text",
      confidence: "medium"
    };
  }
  return { min: null, max: null, currency: "USD", unit: "YEAR", source: "not detected", confidence: "low" };
}

function formatAddress(address = {}) {
  if (typeof address === "string") return clean(address);
  return [address.addressLocality, address.addressRegion, address.addressCountry?.name || address.addressCountry]
    .filter(Boolean).map(clean).join(", ");
}

function structuredLocation(schema = {}) {
  const locations = Array.isArray(schema.jobLocation) ? schema.jobLocation : schema.jobLocation ? [schema.jobLocation] : [];
  const names = locations.map(item => first(item?.name, formatAddress(item?.address))).filter(Boolean);
  if (names.length) return names.join(" / ");
  const applicant = Array.isArray(schema.applicantLocationRequirements) ? schema.applicantLocationRequirements : schema.applicantLocationRequirements ? [schema.applicantLocationRequirements] : [];
  const regions = applicant.map(item => first(item?.name, formatAddress(item?.address))).filter(Boolean);
  if (/telecommute|remote/i.test(schema.jobLocationType || "")) return regions.length ? `Remote — ${regions.join(" / ")}` : "Remote";
  return "";
}

function inferLocation(text = "") {
  const lines = clean(text).split(/\n+/).map(clean).filter(Boolean).slice(0, 140);
  const labeled = lines.find(line => /^(location|work location|job location)\s*[:\-]/i.test(line));
  if (labeled) return clean(labeled.replace(/^[^:\-]+[:\-]\s*/, ""));
  const workModeLine = lines.find(line => /\b(remote|hybrid|on[- ]?site)\b/i.test(line) && line.length < 100);
  const cityState = lines.find(line => /\b[A-Z][a-zA-Z .'-]+,\s*(?:[A-Z]{2}|[A-Z][a-z]+)(?:\s+\d{5})?\b/.test(line) && line.length < 100);
  if (cityState && workModeLine && !cityState.includes(workModeLine)) return `${cityState} · ${workModeLine.match(/remote|hybrid|on[- ]?site/i)?.[0] || ""}`;
  return cityState || (workModeLine ? clean(workModeLine) : "");
}

function inferTitle(metaTitle = "", h1 = "", pageTitle = "") {
  const direct = first(h1);
  if (direct && direct.length < 180) return direct;
  const title = first(metaTitle, pageTitle);
  if (!title) return "";
  return clean(title.split(/\s+[|·•]\s+|\s+-\s+(?:LinkedIn|Indeed|Glassdoor|Greenhouse|Lever)/i)[0]);
}

function inferCompany(text = "", title = "") {
  const lines = clean(text).split(/\n+/).map(clean).filter(Boolean).slice(0, 70);
  const labeled = lines.find(line => /^(company|organization|employer)\s*[:\-]/i.test(line));
  if (labeled) return clean(labeled.replace(/^[^:\-]+[:\-]\s*/, ""));
  const titleIndex = lines.findIndex(line => lower(line) === lower(title));
  if (titleIndex >= 0) {
    const candidate = lines.slice(titleIndex + 1, titleIndex + 5).find(line => line.length < 100 && !/apply|save|share|followers?|applicants?|ago|remote|hybrid|on-site|location/i.test(line));
    if (candidate) return candidate;
  }
  return "";
}

function detectWorkMode(text = "", location = "") {
  const v = lower(`${location} ${text.slice(0, 6000)}`);
  if (/\bhybrid\b/.test(v)) return "Hybrid";
  if (/\bremote\b|telecommute|work from home/.test(v)) return "Remote";
  if (/on[- ]?site|in[- ]?person/.test(v)) return "On-site";
  return "Not specified";
}

export function extractJobFields(payload = {}) {
  const schema = payload.structured?.schemaJob || payload.schemaJob || {};
  const dom = payload.structured?.dom || payload.dom || {};
  const text = clean(payload.text || "");
  const title = first(schema.title, dom.title, inferTitle(dom.metaTitle, dom.h1, payload.title));
  const company = first(schema.hiringOrganization?.name, dom.company, inferCompany(text, title));
  const location = first(structuredLocation(schema), dom.location, inferLocation(text));
  const salary = parseSalary(text, schema.baseSalary, dom.salary);
  const workMode = detectWorkMode(`${schema.jobLocationType || ""}\n${text}`, location);

  const confidence = {
    title: schema.title || dom.title ? "high" : title ? "medium" : "low",
    company: schema.hiringOrganization?.name || dom.company ? "high" : company ? "medium" : "low",
    location: structuredLocation(schema) || dom.location ? "high" : location ? "medium" : "low",
    salary: salary.confidence
  };

  return {
    title,
    company,
    location,
    url: clean(payload.url || ""),
    salaryMin: salary.min,
    salaryMax: salary.max,
    salaryCurrency: salary.currency,
    salaryUnit: salary.unit,
    workMode,
    description: text.slice(0, 150_000),
    extraction: {
      confidence,
      salarySource: salary.source,
      capturedAt: new Date().toISOString()
    }
  };
}
