import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const skip = new Set(["node_modules", ".git", "media"]);
const files = [];
async function walk(dir) {
  for (const name of await readdir(dir)) {
    if (skip.has(name)) continue;
    const full = path.join(dir, name);
    const info = await stat(full);
    if (info.isDirectory()) await walk(full); else files.push(full);
  }
}
await walk(root);
const forbidden = ["s"+"k-", "AI"+"za", "anthropic"+"_api_key", "BEGIN"+" PRIVATE KEY", "Jordan Lee"+" Doe"];
const findings = [];
for (const file of files.filter(file => /\.(js|mjs|json|html|css|md|yml|yaml|txt|example)$/.test(file))) {
  const text = await readFile(file, "utf8");
  for (const token of forbidden) if (text.includes(token)) findings.push(`${path.relative(root, file)} contains forbidden token ${token}`);
}
if (findings.length) {
  console.error(findings.join("\n"));
  process.exit(1);
}
console.log(`Checked ${files.length} files: no obvious secrets or forbidden personal markers found.`);
