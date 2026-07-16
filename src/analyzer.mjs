const STOP = new Set(`a an and are as at be by for from has have in into is it its of on or that the this to with you your our we will must should preferred required experience years year role work working using including ability strong knowledge`.split(/\s+/));

export const SKILL_LEXICON = [
  "python", "c++", "java", "javascript", "typescript", "ros2", "ros", "solidworks", "catia", "creo", "ansys", "matlab", "simulink", "gd&t", "dfm", "dfa", "cad", "fea", "can", "j1939", "bms", "battery", "thermal", "hvac", "embedded", "arduino", "linux", "git", "jira", "plc", "labview", "robotics", "mechatronics", "validation", "verification", "testing", "prototype", "sensors", "imu", "ble", "electrical architecture", "wiring harness", "systems engineering", "product development", "manufacturing", "quality", "controls", "automation", "field service", "commissioning", "customer support", "machine vision", "motion control"
];

const clean = (value = "") => String(value).toLowerCase().replace(/[–—]/g, "-");
const tokens = (value = "") => [...new Set(clean(value).replace(/[^a-z0-9+#.&/-]+/g, " ").split(/\s+/).filter(token => token.length > 1 && !STOP.has(token)))];
const includesPhrase = (text, phrase) => clean(text).includes(clean(phrase));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const bool = value => value === true || value === "true" || value === "yes" || value === "Yes";
const list = value => Array.isArray(value) ? value.filter(Boolean).map(String) : String(value || "").split(/[,\n]/).map(item => item.trim()).filter(Boolean);

function detectBlockers(jobText, profile) {
  const auth = profile.workAuthorization || {};
  const blockers = [];
  const risks = [];
  const text = clean(jobText);
  const rules = [
    { re: /(must|required to) (be )?(a )?u\.?s\.? citizen|u\.?s\.? citizenship (is )?required|us citizens? only/, label: "U.S. citizenship appears required", blocked: !bool(auth.citizen) },
    { re: /(must|required to) (be )?(a )?u\.?s\.? person|u\.?s\.? person status (is )?required|itar[^.\n]{0,80}u\.?s\.? person/, label: "U.S. Person or ITAR eligibility appears required", blocked: !bool(auth.usPerson) },
    { re: /(active|current)[^.\n]{0,40}(security )?clearance|required[^.\n]{0,40}(security )?clearance|secret clearance|top secret|ts\/sci/, label: "Active security clearance appears required", blocked: !bool(auth.activeClearance) },
    { re: /(green card|lawful permanent resident|permanent residency)[^.\n]{0,50}(required|only|must)/, label: "Permanent residency appears required", blocked: !bool(auth.permanentResident) }
  ];
  for (const rule of rules) if (rule.blocked && rule.re.test(text)) blockers.push(rule.label);
  if (/(no (visa )?sponsorship|unable to sponsor|cannot sponsor|will not sponsor|sponsorship is not available)/.test(text) && bool(auth.requiresFuture)) {
    risks.push("The posting says sponsorship is unavailable, while the profile indicates future sponsorship may be required.");
  }
  if (/(contract-to-hire|contract position|\b1099\b|\bc2c\b)/.test(text) && profile.preferences?.acceptContract === false) {
    blockers.push("The role appears contract-based and the profile excludes contract work.");
  }
  return { blockers, risks };
}

function requiredYears(text) {
  const values = [...clean(text).matchAll(/(\d{1,2})\s*\+?\s*(?:years?|yrs?)(?:\s+of)?\s+(?:relevant\s+)?experience/g)].map(match => Number(match[1])).filter(value => value < 30);
  return values.length ? Math.min(...values) : null;
}

function skillMap(profile) {
  const map = new Map();
  for (const item of profile.skills || []) {
    if (typeof item === "string") map.set(clean(item), 0);
    else if (item?.name) map.set(clean(item.name), Number(item.years || 0));
  }
  return map;
}

function chooseResume(resumes = [], jobText = "", title = "") {
  if (!resumes.length) return { resume: null, scores: [] };
  const jobTokens = new Set(tokens(`${title} ${jobText}`));
  const scored = resumes.map(resume => {
    const resumeText = `${resume.category || ""} ${resume.keywords || ""} ${resume.summary || ""} ${resume.name || ""} ${(resume.extractedText || "").slice(0, 30_000)}`;
    const resumeTokens = tokens(resumeText);
    let score = resumeTokens.reduce((sum, token) => sum + (jobTokens.has(token) ? 1 : 0), 0);
    const category = clean(resume.category);
    const combined = clean(`${title} ${jobText}`);
    if (category && includesPhrase(combined, category)) score += 5;
    if (/robot|autonom|ros/.test(category) && /robot|autonom|ros/.test(combined)) score += 4;
    if (/mechat|electromech/.test(category) && /mechat|electromech|automation/.test(combined)) score += 4;
    if (/mechanical|design/.test(category) && /mechanical|design|cad|gd&t/.test(combined)) score += 3;
    if (/electrical|electronics/.test(category) && /electrical|electronics|harness|embedded/.test(combined)) score += 3;
    return { resume, score };
  }).sort((a, b) => b.score - a.score);
  return { resume: scored[0].resume, scores: scored };
}

function buildAnswers(profile, job) {
  const identity = profile.identity || {};
  const auth = profile.workAuthorization || {};
  const preferences = profile.preferences || {};
  const salary = preferences.salaryText || (preferences.salaryMin ? `At least $${Number(preferences.salaryMin).toLocaleString()} annually, depending on location and total compensation` : "Open based on the role, location, and total compensation");
  const rows = [
    ["Full legal name", identity.fullName, "high", false],
    ["Email", identity.email, "high", false],
    ["Phone", identity.phone, "high", false],
    ["Current location", identity.location, "high", false],
    ["LinkedIn profile", identity.linkedin, "high", false],
    ["Portfolio or personal website", identity.portfolio, "high", false],
    ["Authorized to work in the target country?", bool(auth.authorized) ? "Yes" : "No", "high", true],
    ["Require sponsorship now?", bool(auth.requiresNow) ? "Yes" : "No", "high", true],
    ["Require sponsorship now or in the future?", bool(auth.requiresNow) || bool(auth.requiresFuture) ? "Yes" : "No", "high", true],
    ["U.S. citizen?", bool(auth.citizen) ? "Yes" : "No", "high", true],
    ["U.S. Person under ITAR/EAR?", bool(auth.usPerson) ? "Yes" : "No", "high", true],
    ["Active security clearance?", bool(auth.activeClearance) ? "Yes" : "No", "high", true],
    ["Willing to relocate?", bool(preferences.relocation) ? "Yes" : "No", "high", false],
    ["Compensation expectation", salary, preferences.salaryMin ? "medium" : "low", true]
  ];
  if (job?.company) rows.push([`Why ${job.company}?`, `I am interested in ${job.company} because the role aligns with my documented experience and target work. I would tailor this response after reviewing the company and team in more detail.`, "low", true]);
  return rows.filter(([, answer]) => answer !== undefined && answer !== null && String(answer).trim() !== "").map(([question, answer, confidence, sensitive], index) => ({
    id: `answer-${index + 1}`,
    question,
    answer: String(answer),
    confidence,
    sensitive,
    approved: !sensitive
  }));
}

export function analyzeJobLocally({ profile = {}, resumes = [], job = {} } = {}) {
  const description = String(job.description || "");
  const title = String(job.title || "");
  const combined = `${title}\n${job.company || ""}\n${job.location || ""}\n${description}`;
  const map = skillMap(profile);
  const detectedSkills = SKILL_LEXICON.filter(skill => includesPhrase(combined, skill));
  const matchedSkills = detectedSkills.filter(skill => [...map.keys()].some(profileSkill => profileSkill.includes(clean(skill)) || clean(skill).includes(profileSkill)));
  const missingSkills = detectedSkills.filter(skill => !matchedSkills.includes(skill)).slice(0, 9);
  const targetRoles = list(profile.preferences?.targetRoles);
  const excludedRoles = list(profile.preferences?.excludedRoles);
  const titleTokens = tokens(title);
  const targetRoleMatch = targetRoles.some(role => includesPhrase(title, role) || tokens(role).some(token => titleTokens.includes(token)));
  const excludedRoleMatch = excludedRoles.some(role => includesPhrase(title, role));
  const locationText = clean(`${job.location || ""} ${job.workMode || ""} ${description}`);
  const locations = list(profile.preferences?.locations);
  const locationMatch = !locations.length || locations.some(location => locationText.includes(clean(location))) || (/remote/.test(locationText) && bool(profile.preferences?.remote)) || (/hybrid/.test(locationText) && bool(profile.preferences?.hybrid));
  const years = requiredYears(combined);
  const documentedYears = Math.max(0, ...[...map.values()], Number(profile.experienceYears || 0));
  const yearsMatch = years == null || documentedYears >= years;
  const { blockers, risks } = detectBlockers(combined, profile);
  const selected = chooseResume(resumes, combined, title);

  const skillRatio = detectedSkills.length ? matchedSkills.length / detectedSkills.length : 0.55;
  let score = 2.2 + skillRatio * 4.2;
  score += targetRoleMatch ? 1.4 : 0.45;
  score += locationMatch ? 0.75 : 0;
  score += yearsMatch ? 0.75 : -0.85;
  score += selected.resume ? Math.min(0.75, (selected.scores[0]?.score || 0) / 12) : 0;
  if (excludedRoleMatch) score -= 1.3;
  if (risks.length) score -= 0.4;
  if (blockers.length) score = Math.min(score, 4.7);
  score = Math.round(clamp(score, 0, 10) * 10) / 10;

  const strengths = [];
  if (matchedSkills.length) strengths.push(`Matched skills: ${matchedSkills.slice(0, 8).join(", ")}.`);
  if (targetRoleMatch) strengths.push("The job title aligns with a saved target role family.");
  if (locationMatch) strengths.push("The location or work arrangement aligns with the saved preferences.");
  if (yearsMatch && years !== null) strengths.push(`The profile appears to meet the stated ${years}+ years requirement.`);
  if (selected.resume) strengths.push(`${selected.resume.name || selected.resume.category} has the strongest overlap in the resume library.`);

  const concerns = [];
  if (!yearsMatch && years !== null) concerns.push(`The role appears to request ${years}+ years, above the profile's documented ${documentedYears} years.`);
  if (!locationMatch) concerns.push("The location does not clearly match the saved preferences.");
  if (excludedRoleMatch) concerns.push("The title matches an excluded or low-priority role family.");
  concerns.push(...risks);
  if (missingSkills.length) concerns.push(`Potential gaps or terms not verified in the profile: ${missingSkills.join(", ")}.`);

  let recommendation = "Save or skip";
  if (blockers.length) recommendation = "Skip — eligibility blocker";
  else if (score >= 7.2) recommendation = "Proceed to review";
  else if (score >= 6) recommendation = "Needs review";

  return {
    fitScore: score,
    recommendation,
    blockers,
    risks,
    strengths,
    concerns,
    matchedSkills,
    missingSkills,
    requiredYears: years,
    recommendedResume: selected.resume || null,
    resumeReason: selected.resume ? `Highest role-family and keyword overlap among ${resumes.length} saved resume${resumes.length === 1 ? "" : "s"}.` : "Add a resume summary or upload a resume to enable routing.",
    answers: buildAnswers(profile, job),
    warnings: [
      "Fit scoring is a decision aid, not a hiring prediction.",
      "Verify legal, immigration, export-control, compensation, demographic, and attestation answers before use."
    ]
  };
}
