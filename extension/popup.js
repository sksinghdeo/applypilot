const $ = id => document.getElementById(id);
let lastJob = null;
let routineProfile = null;

chrome.storage.local.get(["routineProfile", "lastJob"], data => {
  routineProfile = data.routineProfile || null;
  lastJob = data.lastJob || null;
  renderProfile();
  renderJob();
});

$("openApp").onclick = () => chrome.tabs.create({ url: "http://localhost:4173" });
$("reviewInApp").onclick = () => chrome.tabs.create({ url: "http://localhost:4173/#analyze" });

$("sync").onclick = async () => {
  try {
    const response = await fetch("http://localhost:4173/api/profile-sync");
    const data = await response.json();
    if (!data.profile) throw new Error("Save your candidate profile and click “Sync to extension” in ApplyPilot first.");
    routineProfile = data.profile;
    await chrome.storage.local.set({ routineProfile });
    renderProfile();
    setStatus("Routine contact profile synced from the local app.", "ok");
  } catch (error) { setStatus(error.message, "error"); }
};

$("capture").onclick = async () => {
  $("capture").disabled = true;
  setStatus("Reading structured job data and visible page text...", "");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error("No active browser tab was found.");
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: capturePage
    });
    const response = await fetch("http://localhost:4173/api/capture", {
      method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(result)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The local app did not accept the capture.");
    lastJob = data.job;
    await chrome.storage.local.set({ lastJob });
    renderJob();
    setStatus("Job captured. Review every extracted field in ApplyPilot.", "ok");
  } catch (error) { setStatus(`Capture failed: ${error.message}`, "error"); }
  finally { $("capture").disabled = false; }
};

$("fill").onclick = async () => {
  if (!routineProfile) return setStatus("Sync a routine contact profile first.", "error");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id }, args: [routineProfile], func: fillRoutineFields
    });
    setStatus(`Filled ${result.filled} safe field${result.filled === 1 ? "" : "s"}; skipped ${result.skipped} sensitive or unsupported field${result.skipped === 1 ? "" : "s"}.`, "ok");
  } catch (error) { setStatus(`Autofill failed: ${error.message}`, "error"); }
};

function renderProfile() {
  const root = $("profileSummary");
  if (!routineProfile) {
    root.innerHTML = '<div class="profile-avatar">?</div><div><strong>No profile synced</strong><span>Save your profile in the app, then sync.</span></div>';
    return;
  }
  const initials = String(routineProfile.fullName || "AP").split(/\s+/).map(x => x[0]).join("").slice(0, 2).toUpperCase();
  root.innerHTML = `<div class="profile-avatar">${escapeHtml(initials)}</div><div><strong>${escapeHtml(routineProfile.fullName || "Routine profile")}</strong><span>${escapeHtml(routineProfile.email || routineProfile.location || "Synced locally")}</span></div>`;
}
function renderJob() {
  $("jobPreview").classList.toggle("hidden", !lastJob);
  if (!lastJob) return;
  $("jobTitle").textContent = lastJob.title || "Job title not detected";
  $("jobCompany").textContent = lastJob.company || "Company not detected";
  $("jobLocation").textContent = lastJob.location || "Location not detected";
  $("jobSalary").textContent = salaryText(lastJob);
  const confidence = lastJob.extraction?.confidence || {};
  const high = Object.values(confidence).filter(value => value === "high").length;
  $("confidence").textContent = `${high}/4 high confidence`;
}
function salaryText(job) {
  if (!job.salaryMin && !job.salaryMax) return "Salary not detected";
  const money = value => new Intl.NumberFormat("en-US", { style: "currency", currency: job.salaryCurrency || "USD", maximumFractionDigits: 0 }).format(value);
  const unit = ({ YEAR: "/year", HOUR: "/hour", MONTH: "/month", WEEK: "/week", DAY: "/day" })[job.salaryUnit] || "";
  return job.salaryMin && job.salaryMax ? `${money(job.salaryMin)}–${money(job.salaryMax)}${unit}` : `${money(job.salaryMin || job.salaryMax)}${unit}`;
}
function setStatus(text, kind) { $("status").className = `status ${kind || ""}`; $("status").querySelector("span").textContent = text; }
function escapeHtml(value = "") { return String(value).replace(/[&<>'"]/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;" }[c])); }

function capturePage() {
  const text = (document.body?.innerText || "").replace(/\n{3,}/g, "\n\n").slice(0, 150000);
  const allJson = [];
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try { allJson.push(JSON.parse(script.textContent)); } catch {}
  }
  const walk = value => {
    if (!value) return null;
    if (Array.isArray(value)) { for (const item of value) { const found = walk(item); if (found) return found; } return null; }
    if (typeof value === "object") {
      const type = value["@type"];
      if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) return value;
      if (value["@graph"]) { const found = walk(value["@graph"]); if (found) return found; }
      for (const child of Object.values(value)) { const found = walk(child); if (found) return found; }
    }
    return null;
  };
  const schemaJob = walk(allJson) || {};
  const firstText = selectors => {
    for (const selector of selectors) {
      const node = document.querySelector(selector);
      const value = node?.textContent?.trim();
      if (value && value.length < 400) return value;
    }
    return "";
  };
  const meta = selector => document.querySelector(selector)?.content?.trim() || "";
  const dom = {
    title: firstText(['[data-testid="job-title"]','[data-test="job-title"]','.job-details-jobs-unified-top-card__job-title h1','.jobs-unified-top-card__job-title','h1']),
    h1: firstText(["h1"]),
    company: firstText(['[data-testid*="company"]','[data-test*="company"]','.job-details-jobs-unified-top-card__company-name','.jobs-unified-top-card__company-name','.topcard__org-name-link','.jobsearch-InlineCompanyRating div:first-child','[class*="companyName"]','[class*="company-name"]']),
    location: firstText(['[data-testid*="location"]','[data-test*="location"]','.job-details-jobs-unified-top-card__primary-description-container','.jobs-unified-top-card__primary-description-container','.topcard__flavor--bullet','.jobsearch-JobInfoHeader-subtitle div:last-child','[class*="job-location"]']),
    salary: firstText(['[data-testid*="salary"]','[data-test*="salary"]','[class*="salary"]','[class*="compensation"]']),
    metaTitle: meta('meta[property="og:title"]') || document.title,
    metaDescription: meta('meta[property="og:description"]') || meta('meta[name="description"]')
  };
  return { title: document.title, url: location.href, text, structured: { schemaJob, dom } };
}

function fillRoutineFields(profile) {
  const sensitive = /salary|compensation|pay expectation|sponsor|visa|citizen|citizenship|u\.?s\.? person|itar|export|clearance|security|race|ethnic|gender|sex|disabil|veteran|birth|ssn|social security|signature|attest|password|passcode|demographic|protected class|background check|criminal|convict|pronoun|age|date of birth/i;
  const labelFor = el => {
    const parts = [el.name, el.id, el.placeholder, el.getAttribute("aria-label"), el.getAttribute("autocomplete")];
    if (el.id) { const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (label) parts.push(label.innerText); }
    const parent = el.closest("label"); if (parent) parts.push(parent.innerText);
    const described = el.getAttribute("aria-describedby"); if (described) described.split(/\s+/).forEach(id => parts.push(document.getElementById(id)?.innerText));
    return parts.filter(Boolean).join(" ").toLowerCase();
  };
  const valueFor = label => {
    const names = String(profile.fullName || "").trim().split(/\s+/);
    if (/first.?name|given.?name/.test(label)) return names[0] || "";
    if (/middle.?name/.test(label)) return names.length > 2 ? names.slice(1, -1).join(" ") : "";
    if (/last.?name|surname|family.?name/.test(label)) return names.slice(-1)[0] || "";
    if (/full.?name|legal.?name|candidate.?name/.test(label)) return profile.fullName || "";
    if (/e-?mail/.test(label)) return profile.email || "";
    if (/phone|mobile|telephone/.test(label)) return profile.phone || "";
    if (/linkedin/.test(label)) return profile.linkedin || "";
    if (/portfolio|website|personal.?site|homepage/.test(label)) return profile.portfolio || "";
    if (/location|city.*state|current.?city|address.?city/.test(label)) return profile.location || "";
    return "";
  };
  const setNativeValue = (element, value) => {
    const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    if (setter) setter.call(element, value); else element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  };
  let filled = 0, skipped = 0;
  const fields = document.querySelectorAll('input:not([type="hidden"]):not([type="file"]):not([type="checkbox"]):not([type="radio"]):not([type="submit"]), textarea');
  for (const element of fields) {
    if (element.disabled || element.readOnly) continue;
    const label = labelFor(element);
    if (sensitive.test(label)) { skipped++; continue; }
    const value = valueFor(label);
    if (!value || String(element.value || "").trim()) continue;
    element.focus(); setNativeValue(element, value); filled++;
  }
  return { filled, skipped };
}
