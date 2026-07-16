import { createRequire } from "node:module";
import mammoth from "mammoth";
import { SKILL_LEXICON } from "./analyzer.mjs";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const clean = value => String(value || "").replace(/\u0000/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();

function inferKeywords(text) {
  const lower = text.toLowerCase();
  return SKILL_LEXICON.filter(skill => lower.includes(skill.toLowerCase())).slice(0, 24);
}

function inferSummary(text) {
  const lines = clean(text).split(/\n+/).map(line => line.trim()).filter(line => line.length > 35 && line.length < 280);
  const preferred = lines.filter(line => /engineer|developer|designer|manager|specialist|experience|developed|designed|built|led|implemented/i.test(line));
  return (preferred.slice(0, 3).join(" ") || lines.slice(0, 3).join(" ")).slice(0, 700);
}

export async function parseResume({ filename = "resume", mimeType = "", data = "" } = {}) {
  const buffer = Buffer.from(String(data).replace(/^data:[^;]+;base64,/, ""), "base64");
  if (!buffer.length) throw new Error("The uploaded file is empty.");
  if (buffer.length > 8_000_000) throw new Error("Resume files are limited to 8 MB in this MVP.");
  const ext = filename.toLowerCase().split(".").pop();
  let text = "";
  if (mimeType === "application/pdf" || ext === "pdf") {
    const parsed = await pdfParse(buffer);
    text = parsed.text || "";
  } else if (mimeType.includes("wordprocessingml") || ext === "docx") {
    const parsed = await mammoth.extractRawText({ buffer });
    text = parsed.value || "";
  } else if (mimeType.startsWith("text/") || ["txt", "md", "rtf"].includes(ext)) {
    text = buffer.toString("utf8");
  } else {
    throw new Error("Supported resume formats: PDF, DOCX, TXT, and MD.");
  }
  text = clean(text).slice(0, 80_000);
  if (!text) throw new Error("No readable text was found in the file.");
  return {
    filename,
    mimeType,
    characterCount: text.length,
    text,
    keywords: inferKeywords(text),
    summary: inferSummary(text)
  };
}
