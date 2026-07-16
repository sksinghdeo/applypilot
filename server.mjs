import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeJobLocally } from "./src/analyzer.mjs";
import { analyzeWithProvider } from "./src/providers.mjs";
import { extractJobFields } from "./src/extractor.mjs";
import { parseResume } from "./src/resume-parser.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
let latestCapture = null;
let routineProfile = null;

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".webmanifest": "application/manifest+json",
  ".mp4": "video/mp4"
};

function commonHeaders(api = false) {
  return {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    ...(api ? {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    } : {
      "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self' data:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com; media-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    })
  };
}

function send(res, status, body, type = "application/json; charset=utf-8", api = true) {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": type,
    "Content-Length": Buffer.byteLength(payload),
    ...commonHeaders(api)
  });
  res.end(payload);
}

async function readJson(req, maxBytes = 2_000_000) {
  let total = 0;
  const chunks = [];
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) throw new Error("Request body is too large.");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  const safePath = path.normalize(pathname).replace(/^([.][.][/\\])+/, "");
  const filePath = path.join(publicDir, safePath);
  if (!filePath.startsWith(publicDir)) return send(res, 403, { error: "Forbidden" });
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("Not a file");
    const data = await readFile(filePath);
    res.writeHead(200, {
      "Content-Type": mime[path.extname(filePath)] || "application/octet-stream",
      "Content-Length": data.length,
      "Cache-Control": path.extname(filePath) === ".html" ? "no-cache" : "public, max-age=3600",
      ...commonHeaders(false)
    });
    res.end(data);
  } catch {
    if (!path.extname(pathname)) {
      try {
        const data = await readFile(path.join(publicDir, "index.html"));
        res.writeHead(200, { "Content-Type": mime[".html"], "Content-Length": data.length, ...commonHeaders(false) });
        return res.end(data);
      } catch {}
    }
    send(res, 404, { error: "Not found" });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === "OPTIONS" && url.pathname.startsWith("/api/")) return send(res, 204, "");
    if (req.method === "GET" && url.pathname === "/api/health") return send(res, 200, { ok: true, name: "ApplyPilot", version: "1.0.0" });

    if (req.method === "POST" && url.pathname === "/api/extract-job") {
      const body = await readJson(req, 2_000_000);
      return send(res, 200, { job: extractJobFields(body) });
    }

    if (req.method === "POST" && url.pathname === "/api/capture") {
      const body = await readJson(req, 2_000_000);
      const extractedJob = extractJobFields(body);
      latestCapture = {
        title: String(body.title || "").slice(0, 300),
        url: String(body.url || "").slice(0, 2_000),
        text: String(body.text || "").slice(0, 150_000),
        structured: body.structured || {},
        job: extractedJob,
        capturedAt: new Date().toISOString()
      };
      return send(res, 200, { ok: true, capturedAt: latestCapture.capturedAt, job: extractedJob });
    }
    if (req.method === "GET" && url.pathname === "/api/capture") return send(res, 200, { capture: latestCapture });
    if (req.method === "DELETE" && url.pathname === "/api/capture") {
      latestCapture = null;
      return send(res, 200, { ok: true });
    }

    if (req.method === "POST" && url.pathname === "/api/profile-sync") {
      const body = await readJson(req, 100_000);
      routineProfile = {
        fullName: String(body.fullName || "").slice(0, 160),
        email: String(body.email || "").slice(0, 240),
        phone: String(body.phone || "").slice(0, 80),
        location: String(body.location || "").slice(0, 200),
        linkedin: String(body.linkedin || "").slice(0, 500),
        portfolio: String(body.portfolio || "").slice(0, 500),
        syncedAt: new Date().toISOString()
      };
      return send(res, 200, { ok: true, profile: routineProfile });
    }
    if (req.method === "GET" && url.pathname === "/api/profile-sync") return send(res, 200, { profile: routineProfile });

    if (req.method === "POST" && url.pathname === "/api/resume/extract") {
      const body = await readJson(req, 12_000_000);
      const parsed = await parseResume(body);
      return send(res, 200, { resume: parsed });
    }

    if (req.method === "POST" && url.pathname === "/api/analyze") {
      const body = await readJson(req, 3_000_000);
      const local = analyzeJobLocally(body);
      const provider = body.settings?.provider || "local";
      if (provider === "local") return send(res, 200, { ...local, engine: "local" });
      try {
        const ai = await analyzeWithProvider(body, local);
        return send(res, 200, { ...ai, localBaseline: local, engine: provider });
      } catch (error) {
        return send(res, 200, {
          ...local,
          engine: "local-fallback",
          warnings: [...(local.warnings || []), `AI provider failed; local analysis was used: ${error.message}`]
        });
      }
    }

    return serveStatic(req, res);
  } catch (error) {
    console.error("ApplyPilot request error:", error.message);
    return send(res, 400, { error: error.message || "Request failed" });
  }
});

server.listen(port, host, () => console.log(`ApplyPilot running at http://${host === "0.0.0.0" ? "localhost" : host}:${port}`));
