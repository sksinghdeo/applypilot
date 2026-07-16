const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const deepClone = value => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();

const STORAGE = {
  profile: "applypilot.profile.v1",
  resumes: "applypilot.resumes.v1",
  analysis: "applypilot.analysis.v1",
  job: "applypilot.job.v1",
  applications: "applypilot.applications.v1",
  settings: "applypilot.settings.v1"
};

const providerDefaults = {
  local: "",
  openai: "gpt-5-mini",
  anthropic: "claude-sonnet-5",
  gemini: "gemini-3.5-flash"
};

const sampleProfile = {
  identity: {
    fullName: "Jordan Lee",
    email: "jordan.lee@example.com",
    phone: "+1 555 014 2288",
    location: "Phoenix, Arizona",
    linkedin: "https://www.linkedin.com/in/jordan-lee-demo",
    portfolio: "https://example.com/jordan"
  },
  experienceYears: 4,
  professionalSummary: "Hands-on mechatronics engineer with experience in electromechanical product development, embedded sensing, prototype integration, field testing, and validation.",
  skills: [
    { name: "Python", years: 4 }, { name: "C++", years: 3 }, { name: "ROS2", years: 2 },
    { name: "SolidWorks", years: 4 }, { name: "GD&T", years: 3 }, { name: "Embedded systems", years: 4 },
    { name: "Validation", years: 4 }, { name: "Sensors", years: 4 }, { name: "Field service", years: 2 }
  ],
  workAuthorization: { authorized: true, requiresNow: false, requiresFuture: false, citizen: true, permanentResident: false, usPerson: true, activeClearance: false, refugeeAsylee: false },
  preferences: {
    targetRoles: ["Robotics Engineer", "Mechatronics Engineer", "Systems Integration Engineer", "Application Engineer"],
    excludedRoles: ["Pure Sales", "Pure Software"],
    locations: ["Arizona", "California", "Remote"],
    salaryMin: 95000,
    salaryText: "Open based on role, location, and total compensation",
    remote: true, hybrid: true, onSite: true, relocation: true, travel: true, acceptContract: false
  }
};

const sampleResumes = [
  {
    id: "demo-robotics",
    name: "Robotics & Mechatronics Resume",
    category: "Robotics",
    filename: "Jordan_Lee_Robotics_Resume.pdf",
    keywords: "ROS2, Python, C++, embedded systems, sensors, field validation, customer integration",
    summary: "Emphasizes robotics, embedded sensing, electromechanical integration, field testing, customer-facing technical support, and prototype validation.",
    extractedText: "Robotics engineer. ROS2 Python C++ sensors embedded systems field service validation testing prototype integration customer support.",
    createdAt: now()
  },
  {
    id: "demo-mechanical",
    name: "Mechanical Design Resume",
    category: "Mechanical Design",
    filename: "Jordan_Lee_Mechanical_Resume.pdf",
    keywords: "SolidWorks, CAD, GD&T, FEA, DFM, prototyping",
    summary: "Emphasizes mechanical product design, CAD, GD&T, design for manufacturing, analysis, prototyping, and verification.",
    extractedText: "Mechanical design SolidWorks CAD GD&T FEA DFM prototyping manufacturing verification.",
    createdAt: now()
  }
];

const sampleJob = {
  title: "Robotics Application Engineer",
  company: "Skild AI",
  location: "San Francisco, CA · Hybrid",
  url: "https://example.com/jobs/robotics-application-engineer",
  salaryMin: 120000,
  salaryMax: 160000,
  salaryCurrency: "USD",
  salaryUnit: "YEAR",
  workMode: "Hybrid",
  description: `Skild AI is seeking a Robotics Application Engineer to deploy and validate robotic systems with customers.

Responsibilities
• Integrate robotic systems at customer sites and support commissioning.
• Develop Python and C++ tools for diagnostics, validation, and data analysis.
• Work with ROS2, sensors, machine vision, and motion-control systems.
• Translate customer requirements into technical plans and communicate findings to engineering teams.
• Travel up to 25% for deployment and field support.

Qualifications
• Bachelor's or master's degree in robotics, mechatronics, mechanical engineering, electrical engineering, or a related field.
• 3+ years of experience with robotics, automation, or electromechanical product development.
• Hands-on experience with Python, C++, ROS2, embedded systems, sensors, validation, testing, and field service.
• Strong written and verbal communication.

Compensation: $120,000 - $160,000 per year. Hybrid in San Francisco, California.`,
  extraction: { confidence: { title: "high", company: "high", location: "high", salary: "high" }, salarySource: "structured data", capturedAt: now() }
};

const state = {
  profile: load(STORAGE.profile, {}),
  resumes: load(STORAGE.resumes, []),
  analysis: load(STORAGE.analysis, null),
  job: load(STORAGE.job, {}),
  applications: load(STORAGE.applications, []),
  settings: load(STORAGE.settings, { provider: "local", model: "" }),
  currentView: "dashboard",
  captured: null
};

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  flashSaved();
}
function flashSaved() {
  const pill = $("#saveState");
  if (!pill) return;
  pill.innerHTML = "<i></i>Saved locally";
}
function toast(message, kind = "success") {
  const el = $("#toast");
  el.textContent = message;
  el.className = `toast show ${kind === "error" ? "error" : ""}`;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.className = "toast", 2600);
}
function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}
function splitList(value) { return String(value || "").split(/[,\n]/).map(item => item.trim()).filter(Boolean); }
function formatDate(value) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)); }
function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined || value === "") return "";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value));
}
function statusClass(recommendation = "") {
  const lower = recommendation.toLowerCase();
  if (lower.includes("block") || lower.includes("skip —")) return "blocked";
  if (lower.includes("review")) return "review";
  if (lower.includes("ready") || lower.includes("proceed")) return "ready";
  return "review";
}
function uuid() { return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }

const viewTitles = {
  dashboard: "Dashboard", profile: "Candidate profile", resumes: "Resume library", analyze: "Analyze a job", review: "Review answers", applications: "Application log", settings: "AI settings"
};
function navigate(view) {
  state.currentView = view;
  $$(".view").forEach(section => section.classList.toggle("active", section.id === `view-${view}`));
  $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  $("#pageTitle").textContent = viewTitles[view] || "ApplyPilot";
  history.replaceState(null, "", `#${view}`);
  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (view === "dashboard") renderDashboard();
  if (view === "resumes") renderResumes();
  if (view === "review") renderReview();
  if (view === "applications") renderApplications();
}

$("#nav").addEventListener("click", event => {
  const button = event.target.closest("[data-view]");
  if (button) navigate(button.dataset.view);
});
document.addEventListener("click", event => {
  const go = event.target.closest("[data-go]");
  if (go) navigate(go.dataset.go);
});
$("#menuButton").addEventListener("click", () => $("#sidebar").classList.toggle("open"));

function setPath(target, path, value) {
  const parts = path.split(".");
  let cursor = target;
  parts.slice(0, -1).forEach(part => cursor = cursor[part] ??= {});
  cursor[parts.at(-1)] = value;
}
function getPath(target, path) { return path.split(".").reduce((value, key) => value?.[key], target); }
function boolFromForm(value) { return value === "true" ? true : value === "false" ? false : ""; }

function fillProfileForm() {
  const form = $("#profileForm");
  $$('[name]', form).forEach(input => {
    if (input.id === "skillsInput") return;
    const value = getPath(state.profile, input.name);
    if (input.type === "checkbox") input.checked = Boolean(value);
    else if (value !== undefined && value !== null) input.value = Array.isArray(value) ? value.join(", ") : value;
  });
  $("#skillsInput").value = (state.profile.skills || []).map(skill => typeof skill === "string" ? skill : `${skill.name}${skill.years ? `: ${skill.years}` : ""}`).join("\n");
}

$("#profileForm").addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const profile = {};
  $$('[name]', event.currentTarget).forEach(input => {
    if (input.id === "skillsInput") return;
    let value;
    if (input.type === "checkbox") value = input.checked;
    else if (input.tagName === "SELECT" && input.name.startsWith("workAuthorization.")) value = boolFromForm(input.value);
    else if (input.type === "number") value = input.value === "" ? "" : Number(input.value);
    else value = input.value.trim();
    if (["preferences.targetRoles", "preferences.excludedRoles", "preferences.locations"].includes(input.name)) value = splitList(value);
    setPath(profile, input.name, value);
  });
  profile.skills = $("#skillsInput").value.split(/\n/).map(line => line.trim()).filter(Boolean).map(line => {
    const [name, years] = line.split(/:\s*/);
    return { name: name.trim(), years: Number(years) || 0 };
  });
  state.profile = profile;
  save(STORAGE.profile, state.profile);
  renderDashboard();
  toast("Candidate profile saved");
});

$("#exportProfileBtn").addEventListener("click", () => downloadJson("applypilot-profile.json", state.profile));
$("#importProfileBtn").addEventListener("click", () => $("#importProfileFile").click());
$("#importProfileFile").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    state.profile = parsed;
    save(STORAGE.profile, state.profile);
    fillProfileForm();
    toast("Profile imported");
  } catch { toast("That file is not valid JSON", "error"); }
  event.target.value = "";
});
$("#syncExtensionBtn").addEventListener("click", async () => {
  const identity = state.profile.identity || {};
  try {
    const response = await fetch("/api/profile-sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ fullName: identity.fullName, email: identity.email, phone: identity.phone, location: identity.location, linkedin: identity.linkedin, portfolio: identity.portfolio }) });
    if (!response.ok) throw new Error("Sync failed");
    toast("Routine contact fields are ready for the extension");
  } catch (error) { toast(error.message, "error"); }
});
function downloadJson(filename, value) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  downloadBlob(filename, blob);
}
function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = Object.assign(document.createElement("a"), { href: url, download: filename });
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const resumeDialog = $("#resumeDialog");
function openResumeDialog(resume = null) {
  const form = $("#resumeForm");
  form.reset();
  $("#resumeDialogTitle").textContent = resume ? "Edit resume" : "Add resume";
  if (resume) Object.entries(resume).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value || ""; });
  resumeDialog.showModal();
}
$("#addResumeBtn").addEventListener("click", () => $("#resumeFile").click());
$("#resumeDropzone").addEventListener("click", () => $("#resumeFile").click());
["dragenter", "dragover"].forEach(name => $("#resumeDropzone").addEventListener(name, event => { event.preventDefault(); event.currentTarget.classList.add("dragging"); }));
["dragleave", "drop"].forEach(name => $("#resumeDropzone").addEventListener(name, event => { event.preventDefault(); event.currentTarget.classList.remove("dragging"); }));
$("#resumeDropzone").addEventListener("drop", event => handleResumeFile(event.dataTransfer.files[0]));
$("#resumeFile").addEventListener("change", event => { handleResumeFile(event.target.files[0]); event.target.value = ""; });

async function handleResumeFile(file) {
  if (!file) return;
  if (file.size > 8_000_000) return toast("Resume files are limited to 8 MB", "error");
  toast("Reading resume...");
  try {
    const data = await readAsDataUrl(file);
    const response = await fetch("/api/resume/extract", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ filename: file.name, mimeType: file.type, data }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "Resume parsing failed");
    const parsed = payload.resume;
    openResumeDialog({ id: "", name: file.name.replace(/\.[^.]+$/, ""), category: inferCategory(parsed.keywords), filename: file.name, keywords: parsed.keywords.join(", "), summary: parsed.summary, extractedText: parsed.text });
    toast(`Resume read: ${parsed.characterCount.toLocaleString()} characters`);
  } catch (error) { toast(error.message, "error"); }
}
function readAsDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); }); }
function inferCategory(keywords = []) {
  const text = keywords.join(" ").toLowerCase();
  if (/robot|ros2|ros/.test(text)) return "Robotics";
  if (/mechat|automation|controls/.test(text)) return "Mechatronics";
  if (/electrical|embedded|wiring|can|bms/.test(text)) return "Electrical / Electronics";
  if (/solidworks|catia|creo|cad|gd&t|fea/.test(text)) return "Mechanical Design";
  return "General";
}
$("#resumeForm").addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const resume = Object.fromEntries(form.entries());
  resume.id = resume.id || uuid();
  resume.createdAt = state.resumes.find(item => item.id === resume.id)?.createdAt || now();
  const index = state.resumes.findIndex(item => item.id === resume.id);
  if (index >= 0) state.resumes[index] = resume; else state.resumes.unshift(resume);
  save(STORAGE.resumes, state.resumes);
  resumeDialog.close();
  renderResumes();
  toast("Resume saved");
});

function renderResumes() {
  const list = $("#resumeList");
  list.innerHTML = state.resumes.map(resume => {
    const keywords = splitList(resume.keywords).slice(0, 5);
    return `<article class="resume-card">
      <div class="resume-card-top"><div class="file-icon">PDF</div><div><h3>${escapeHtml(resume.name)}</h3><span class="category">${escapeHtml(resume.category || "General")}</span></div></div>
      <p>${escapeHtml(resume.summary || "Add a summary so ApplyPilot can route this resume accurately.")}</p>
      <div class="keyword-cloud">${keywords.map(keyword => `<span>${escapeHtml(keyword)}</span>`).join("")}</div>
      <div class="resume-card-actions"><small>${escapeHtml(resume.filename || "Manual entry")}</small><div><button class="mini-action" data-edit-resume="${resume.id}">Edit</button><button class="mini-action danger" data-delete-resume="${resume.id}">Delete</button></div></div>
    </article>`;
  }).join("");
  $("#resumeEmpty").classList.toggle("hidden", state.resumes.length > 0);
  list.classList.toggle("hidden", state.resumes.length === 0);
}
$("#resumeList").addEventListener("click", event => {
  const edit = event.target.closest("[data-edit-resume]");
  const del = event.target.closest("[data-delete-resume]");
  if (edit) openResumeDialog(state.resumes.find(resume => resume.id === edit.dataset.editResume));
  if (del && confirm("Delete this resume from the local library?")) {
    state.resumes = state.resumes.filter(resume => resume.id !== del.dataset.deleteResume);
    save(STORAGE.resumes, state.resumes);
    renderResumes();
    toast("Resume deleted");
  }
});

function fillJobForm(job = state.job) {
  const form = $("#jobForm");
  ["title", "company", "location", "url", "salaryMin", "salaryMax", "salaryCurrency", "salaryUnit", "workMode", "description"].forEach(key => {
    if (form.elements[key] && job[key] !== undefined && job[key] !== null) form.elements[key].value = job[key];
  });
  $("#descriptionCount").textContent = `${String(form.elements.description.value || "").length.toLocaleString()} characters`;
  updateConfidence(job.extraction?.confidence || {});
}
function readJobForm() {
  const form = $("#jobForm");
  return {
    title: form.elements.title.value.trim(), company: form.elements.company.value.trim(), location: form.elements.location.value.trim(), url: form.elements.url.value.trim(),
    salaryMin: form.elements.salaryMin.value ? Number(form.elements.salaryMin.value) : null,
    salaryMax: form.elements.salaryMax.value ? Number(form.elements.salaryMax.value) : null,
    salaryCurrency: form.elements.salaryCurrency.value, salaryUnit: form.elements.salaryUnit.value, workMode: form.elements.workMode.value,
    description: form.elements.description.value.trim(), extraction: state.job.extraction || null
  };
}
function updateConfidence(confidence = {}) {
  $$('[data-confidence]').forEach(dot => { const value = confidence[dot.dataset.confidence] || ""; dot.dataset.state = value; dot.title = value ? `${value} confidence extraction` : "Entered manually"; });
  const values = Object.values(confidence).filter(Boolean);
  $("#extractionSummary").textContent = values.length ? `${values.filter(value => value === "high").length} high-confidence fields extracted` : "Enter manually or capture a page";
}
$("#jobForm textarea[name='description']").addEventListener("input", event => $("#descriptionCount").textContent = `${event.target.value.length.toLocaleString()} characters`);
$("#loadJobSampleBtn").addEventListener("click", () => {
  state.job = deepClone(sampleJob);
  save(STORAGE.job, state.job);
  fillJobForm();
  toast("Fictional sample job loaded");
});

async function refreshCapture(silent = false) {
  try {
    const response = await fetch("/api/capture");
    const data = await response.json();
    state.captured = data.capture;
    $("#captureBanner").classList.toggle("hidden", !state.captured);
    if (state.captured) $("#captureBannerText").textContent = `${state.captured.job?.title || "Job page"} • captured ${new Date(state.captured.capturedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    if (!silent && !state.captured) toast("No browser capture found", "error");
    return state.captured;
  } catch (error) { if (!silent) toast("Start the local app before using the extension", "error"); return null; }
}
$("#useCaptureBtn").addEventListener("click", async () => {
  const capture = await refreshCapture();
  if (!capture) return;
  state.job = capture.job;
  save(STORAGE.job, state.job);
  fillJobForm();
  toast("Captured job loaded with extracted fields");
});
$("#clearCaptureBtn").addEventListener("click", async () => { await fetch("/api/capture", { method: "DELETE" }); state.captured = null; $("#captureBanner").classList.add("hidden"); toast("Browser capture cleared"); });

$("#jobForm").addEventListener("submit", async event => {
  event.preventDefault();
  if (!state.profile.identity?.fullName) return toast("Add a candidate profile before analyzing", "error");
  state.job = readJobForm();
  save(STORAGE.job, state.job);
  const button = $("#analyzeButton");
  button.classList.add("loading"); button.disabled = true;
  try {
    const response = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile: state.profile, resumes: state.resumes, job: state.job, settings: getSettingsForRequest() }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Analysis failed");
    state.analysis = data;
    save(STORAGE.analysis, state.analysis);
    renderAnalysis(); renderReview(); renderDashboard();
    toast(data.engine === "local-fallback" ? "Provider failed; local analysis completed" : "Job analysis complete");
  } catch (error) { toast(error.message, "error"); }
  finally { button.classList.remove("loading"); button.disabled = false; }
});

function renderAnalysis() {
  const analysis = state.analysis;
  $("#analysisEmpty").classList.toggle("hidden", Boolean(analysis));
  $("#analysisResult").classList.toggle("hidden", !analysis);
  if (!analysis) return;
  $("#resultScore").textContent = Number(analysis.fitScore || 0).toFixed(1);
  $("#resultRecommendation").textContent = analysis.recommendation || "Review required";
  $("#resultRole").textContent = [state.job.title, state.job.company, state.job.location].filter(Boolean).join(" • ");
  $("#resultEngine").textContent = String(analysis.engine || "local").toUpperCase();
  $("#resultTags").innerHTML = [state.job.workMode, formatSalary(state.job), analysis.requiredYears ? `${analysis.requiredYears}+ years requested` : "Experience flexible"].filter(Boolean).map(tag => `<span>${escapeHtml(tag)}</span>`).join("");
  renderList("#strengthList", analysis.strengths, "No strong matches were detected from the current profile.");
  renderList("#concernList", analysis.concerns, "No material concerns were detected by the local rules engine.");
  $("#recommendedResume").innerHTML = analysis.recommendedResume ? `<h4>${escapeHtml(analysis.recommendedResume.name || analysis.recommendedResume.category)}</h4><p>${escapeHtml(analysis.resumeReason || "")}</p><span class="route-category">${escapeHtml(analysis.recommendedResume.category || "General")}</span>` : `<h4>No resume routed</h4><p>${escapeHtml(analysis.resumeReason || "Add a resume to enable routing.")}</p>`;
  const blockers = [...(analysis.blockers || []).map(text => ({ text, kind: "bad", icon: "×" })), ...(analysis.risks || []).map(text => ({ text, kind: "risk", icon: "!" }))];
  if (!blockers.length) blockers.push({ text: "No hard eligibility blocker was detected. Verify the original posting before applying.", kind: "ok", icon: "✓" });
  $("#blockerList").innerHTML = blockers.map(item => `<div class="blocker-item ${item.kind}"><b>${item.icon}</b><span>${escapeHtml(item.text)}</span></div>`).join("");
  $("#matchedSkills").innerHTML = tags(analysis.matchedSkills, "No matched skills detected");
  $("#missingSkills").innerHTML = tags(analysis.missingSkills, "No unverified skills detected");
}
function renderList(selector, items = [], fallback) { $(selector).innerHTML = (items.length ? items : [fallback]).map(item => `<li>${escapeHtml(item)}</li>`).join(""); }
function tags(items = [], fallback) { return (items.length ? items : [fallback]).map(item => `<span>${escapeHtml(item)}</span>`).join(""); }
function formatSalary(job = {}) {
  if (!job.salaryMin && !job.salaryMax) return "Compensation not detected";
  const unit = ({ YEAR: "/year", HOUR: "/hour", MONTH: "/month", WEEK: "/week", DAY: "/day" })[job.salaryUnit] || "";
  if (job.salaryMin && job.salaryMax) return `${formatMoney(job.salaryMin, job.salaryCurrency)}–${formatMoney(job.salaryMax, job.salaryCurrency)}${unit}`;
  return `${formatMoney(job.salaryMin || job.salaryMax, job.salaryCurrency)}${unit}`;
}

function renderReview() {
  const answers = state.analysis?.answers || [];
  $("#reviewEmpty").classList.toggle("hidden", answers.length > 0);
  $("#reviewFooter").classList.toggle("hidden", answers.length === 0);
  const list = $("#reviewList");
  list.innerHTML = answers.map(answer => `<article class="review-card ${answer.sensitive ? "sensitive" : ""}" data-answer-id="${answer.id}">
    <label class="review-toggle"><input type="checkbox" ${answer.approved ? "checked" : ""} aria-label="Approve answer"></label>
    <div><p class="review-question">${escapeHtml(answer.question)}</p><textarea class="review-answer" rows="2">${escapeHtml(answer.answer)}</textarea><div class="review-meta"><span class="confidence-chip ${answer.confidence}">${escapeHtml(answer.confidence)} confidence</span>${answer.sensitive ? '<span class="review-sensitive">sensitive review</span>' : ""}</div></div>
    <span class="review-state ${answer.approved ? "approved" : ""}">${answer.approved ? "Approved" : "Review"}</span>
  </article>`).join("");
  updateReviewCounts();
}
$("#reviewList").addEventListener("change", event => {
  const card = event.target.closest("[data-answer-id]");
  if (!card || !state.analysis) return;
  const answer = state.analysis.answers.find(item => item.id === card.dataset.answerId);
  if (event.target.matches("input[type='checkbox']")) answer.approved = event.target.checked;
  if (event.target.matches("textarea")) answer.answer = event.target.value;
  save(STORAGE.analysis, state.analysis);
  renderReview(); renderDashboard();
});
$("#reviewList").addEventListener("input", event => {
  if (!event.target.matches("textarea") || !state.analysis) return;
  const card = event.target.closest("[data-answer-id]");
  const answer = state.analysis.answers.find(item => item.id === card.dataset.answerId);
  answer.answer = event.target.value;
  save(STORAGE.analysis, state.analysis);
});
$("#approveRoutineBtn").addEventListener("click", () => {
  if (!state.analysis) return;
  state.analysis.answers.forEach(answer => { if (!answer.sensitive) answer.approved = true; });
  save(STORAGE.analysis, state.analysis); renderReview(); renderDashboard(); toast("Routine factual answers approved");
});
function updateReviewCounts() {
  const answers = state.analysis?.answers || [];
  const approved = answers.filter(answer => answer.approved).length;
  $("#reviewApprovedCount").textContent = `${approved} / ${answers.length}`;
  const unresolved = answers.length - approved;
  $("#reviewBadge").textContent = unresolved;
  $("#reviewBadge").classList.toggle("hidden", unresolved === 0);
  $("#reviewFooterText").textContent = unresolved ? `${unresolved} answer${unresolved === 1 ? "" : "s"} still require review` : "All proposed answers reviewed";
}

$("#saveDecisionBtn").addEventListener("click", () => {
  if (!state.analysis) return;
  const unapprovedAnswers = (state.analysis.answers || []).filter(answer => !answer.approved).length;
  const recommendation = !(state.analysis.blockers || []).length && Number(state.analysis.fitScore) >= 7.2 && unapprovedAnswers === 0
    ? "Ready to apply"
    : state.analysis.recommendation;
  const record = {
    id: uuid(), title: state.job.title, company: state.job.company, location: state.job.location, url: state.job.url,
    salary: formatSalary(state.job), fitScore: state.analysis.fitScore, recommendation,
    resume: state.analysis.recommendedResume?.name || "Not selected", blockers: state.analysis.blockers || [],
    unapprovedAnswers, createdAt: now()
  };
  state.applications.unshift(record);
  save(STORAGE.applications, state.applications);
  renderDashboard(); renderApplications(); toast("Decision saved to application log");
});

function renderDashboard() {
  const applications = state.applications;
  $("#statReviewed").textContent = applications.length;
  $("#statReady").textContent = applications.filter(item => statusClass(item.recommendation) === "ready").length;
  $("#statReview").textContent = applications.filter(item => statusClass(item.recommendation) === "review").length;
  $("#statBlocked").textContent = applications.filter(item => statusClass(item.recommendation) === "blocked").length;
  if (state.analysis) {
    $("#heroScore").textContent = Number(state.analysis.fitScore || 0).toFixed(1);
    $("#heroRecommendation").textContent = state.analysis.recommendation;
    $("#heroResume").textContent = state.analysis.recommendedResume?.name || "No resume selected";
    const unresolved = (state.analysis.answers || []).filter(answer => !answer.approved).length;
    $("#heroReview").textContent = unresolved ? `${unresolved} answer${unresolved === 1 ? "" : "s"} pending` : "All answers reviewed";
  }
  const recent = applications.slice(0, 4);
  $("#recentApplications").innerHTML = recent.length ? `<div class="table-wrap"><table><tbody>${recent.map(item => `<tr><td><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.company || "Company not saved")}</small></td><td class="fit-cell">${Number(item.fitScore).toFixed(1)}</td><td><span class="decision-chip ${statusClass(item.recommendation)}">${escapeHtml(item.recommendation)}</span></td><td><small>${formatDate(item.createdAt)}</small></td></tr>`).join("")}</tbody></table></div>` : `<div class="empty-icon">◫</div><strong>No applications logged yet</strong><p>Analyze a role and save the decision to start your history.</p>`;
}

function renderApplications() {
  const query = $("#applicationSearch").value.trim().toLowerCase();
  const filter = $("#applicationFilter").value;
  const items = state.applications.filter(item => {
    const matchesQuery = !query || `${item.title} ${item.company} ${item.location}`.toLowerCase().includes(query);
    const matchesFilter = filter === "all" || statusClass(item.recommendation) === filter;
    return matchesQuery && matchesFilter;
  });
  $("#applicationTable").innerHTML = items.map(item => `<tr>
    <td><strong>${escapeHtml(item.title || "Untitled role")}</strong><small>${escapeHtml([item.company, item.location].filter(Boolean).join(" • "))}</small></td>
    <td class="fit-cell">${Number(item.fitScore || 0).toFixed(1)}</td>
    <td><span class="decision-chip ${statusClass(item.recommendation)}">${escapeHtml(item.recommendation)}</span><small>${item.unapprovedAnswers || 0} unapproved answers</small></td>
    <td>${escapeHtml(item.resume || "Not selected")}</td><td>${formatDate(item.createdAt)}</td>
    <td><button class="mini-action danger" data-delete-application="${item.id}">Delete</button></td>
  </tr>`).join("");
  $("#applicationEmpty").classList.toggle("hidden", items.length > 0);
  $("#applicationTable").closest(".table-wrap").classList.toggle("hidden", items.length === 0);
}
$("#applicationSearch").addEventListener("input", renderApplications);
$("#applicationFilter").addEventListener("change", renderApplications);
$("#applicationTable").addEventListener("click", event => {
  const button = event.target.closest("[data-delete-application]");
  if (!button) return;
  state.applications = state.applications.filter(item => item.id !== button.dataset.deleteApplication);
  save(STORAGE.applications, state.applications); renderApplications(); renderDashboard(); toast("Log entry deleted");
});
$("#clearLogBtn").addEventListener("click", () => {
  if (!state.applications.length || !confirm("Clear the entire local application log?")) return;
  state.applications = []; save(STORAGE.applications, state.applications); renderApplications(); renderDashboard(); toast("Application log cleared");
});
$("#exportCsvBtn").addEventListener("click", () => {
  const headers = ["Date", "Company", "Title", "Location", "Fit Score", "Recommendation", "Resume", "Salary", "URL"];
  const rows = state.applications.map(item => [item.createdAt, item.company, item.title, item.location, item.fitScore, item.recommendation, item.resume, item.salary, item.url]);
  const csv = [headers, ...rows].map(row => row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  downloadBlob("applypilot-application-log.csv", new Blob([csv], { type: "text/csv" }));
});

function fillSettings() {
  $("#providerSelect").value = state.settings.provider || "local";
  $("#modelInput").value = state.settings.model || providerDefaults[state.settings.provider] || "";
  const remembered = localStorage.getItem("applypilot.apiKey");
  const session = sessionStorage.getItem("applypilot.apiKey");
  $("#apiKeyInput").value = remembered || session || "";
  $("#rememberKey").checked = Boolean(remembered);
  updateProviderUi();
}
function updateProviderUi() {
  const provider = $("#providerSelect").value;
  const local = provider === "local";
  $("#modelInput").disabled = local;
  $("#apiKeyInput").disabled = local;
  $("#rememberKey").disabled = local;
  $("#modelHint").textContent = local ? "Local mode uses deterministic heuristics." : "Model names can change; use a model available in your provider account.";
  $("#analysisEngineLabel").textContent = local ? "Local analysis" : `${provider[0].toUpperCase()}${provider.slice(1)} analysis`;
  $("#analysisEngineHelp").textContent = local ? "No API key required" : "Falls back to local analysis if the provider call fails";
}
$("#providerSelect").addEventListener("change", event => {
  $("#modelInput").value = providerDefaults[event.target.value] || "";
  updateProviderUi();
});
$("#settingsForm").addEventListener("submit", event => {
  event.preventDefault();
  const provider = $("#providerSelect").value;
  state.settings = { provider, model: $("#modelInput").value.trim() };
  save(STORAGE.settings, state.settings);
  const key = $("#apiKeyInput").value.trim();
  if ($("#rememberKey").checked) { localStorage.setItem("applypilot.apiKey", key); sessionStorage.removeItem("applypilot.apiKey"); }
  else { sessionStorage.setItem("applypilot.apiKey", key); localStorage.removeItem("applypilot.apiKey"); }
  updateProviderUi(); toast("AI settings saved");
});
function getSettingsForRequest() { return { ...state.settings, apiKey: localStorage.getItem("applypilot.apiKey") || sessionStorage.getItem("applypilot.apiKey") || "" }; }

$("#loadSample").addEventListener("click", () => {
  state.profile = deepClone(sampleProfile);
  state.resumes = deepClone(sampleResumes);
  state.job = deepClone(sampleJob);
  state.analysis = null;
  state.applications = [];
  save(STORAGE.profile, state.profile); save(STORAGE.resumes, state.resumes); save(STORAGE.job, state.job); save(STORAGE.analysis, null); save(STORAGE.applications, []);
  fillProfileForm(); fillJobForm(); renderResumes(); renderAnalysis(); renderReview(); renderApplications(); renderDashboard();
  navigate("profile"); toast("Fictional demo workspace loaded");
});

function init() {
  const hash = location.hash.replace("#", "");
  fillProfileForm(); renderResumes(); fillJobForm(); renderAnalysis(); renderReview(); renderApplications(); renderDashboard(); fillSettings(); refreshCapture(true);
  navigate(viewTitles[hash] ? hash : "dashboard");
}
init();
