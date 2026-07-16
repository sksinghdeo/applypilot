const SYSTEM = `You are ApplyPilot, a privacy-first job application analysis assistant.
Compare only the supplied job, candidate profile, and resume summaries.
Never invent experience, education, authorization, salary, citizenship, clearance, or demographic facts.
Mark uncertainty explicitly. Treat sponsorship, citizenship, export control, clearance, salary, demographics, signatures, and legal attestations as sensitive.
Never recommend bypassing CAPTCHA, 2FA, website restrictions, or final human approval.
Return only a valid JSON object with these keys: fitScore, recommendation, blockers, risks, strengths, concerns, matchedSkills, missingSkills, recommendedResume, resumeReason, answers, warnings.
Each answer must contain id, question, answer, confidence, sensitive, approved. Sensitive answers must have approved=false.`;

function extractJson(text) {
  if (!text) throw new Error("Provider returned no text.");
  const cleaned = String(text).trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(cleaned); } catch {}
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
  throw new Error("The provider did not return valid JSON.");
}

function inputFor(body, local) {
  const safeSettings = { ...body.settings };
  delete safeSettings.apiKey;
  return JSON.stringify({
    task: "Analyze this opportunity and propose reviewable application answers.",
    candidateProfile: body.profile,
    resumeSummaries: (body.resumes || []).map(({ extractedText, ...resume }) => ({ ...resume, extractedText: String(extractedText || "").slice(0, 20_000) })),
    job: { ...body.job, description: String(body.job?.description || "").slice(0, 80_000) },
    localBaseline: local,
    settings: safeSettings
  });
}

async function callOpenAI({ apiKey, model, input }) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model, instructions: SYSTEM, input })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `OpenAI HTTP ${response.status}`);
  let text = data.output_text;
  if (!text && Array.isArray(data.output)) {
    text = data.output.flatMap(item => item.content || []).filter(content => content.type === "output_text" || content.text).map(content => content.text).join("\n");
  }
  return extractJson(text);
}

async function callAnthropic({ apiKey, model, input }) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model, max_tokens: 5000, system: SYSTEM, messages: [{ role: "user", content: input }] })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Anthropic HTTP ${response.status}`);
  const text = (data.content || []).filter(item => item.type === "text").map(item => item.text).join("\n");
  return extractJson(text);
}

async function callGemini({ apiKey, model, input }) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey, "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: input }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || `Gemini HTTP ${response.status}`);
  const text = data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("\n");
  return extractJson(text);
}

function normalize(result, local) {
  const merged = { ...local, ...result };
  merged.fitScore = Math.max(0, Math.min(10, Number(merged.fitScore ?? local.fitScore)));
  merged.blockers = Array.isArray(merged.blockers) ? merged.blockers : local.blockers;
  merged.risks = Array.isArray(merged.risks) ? merged.risks : local.risks;
  merged.strengths = Array.isArray(merged.strengths) ? merged.strengths : local.strengths;
  merged.concerns = Array.isArray(merged.concerns) ? merged.concerns : local.concerns;
  merged.matchedSkills = Array.isArray(merged.matchedSkills) ? merged.matchedSkills : local.matchedSkills;
  merged.missingSkills = Array.isArray(merged.missingSkills) ? merged.missingSkills : local.missingSkills;
  merged.answers = Array.isArray(merged.answers) ? merged.answers.map((answer, index) => ({
    id: answer.id || `answer-${index + 1}`,
    question: String(answer.question || "Application question"),
    answer: String(answer.answer || ""),
    confidence: ["high", "medium", "low"].includes(answer.confidence) ? answer.confidence : "low",
    sensitive: Boolean(answer.sensitive),
    approved: Boolean(answer.sensitive) ? false : Boolean(answer.approved ?? true)
  })) : local.answers;
  merged.warnings = [...new Set([...(local.warnings || []), ...(result.warnings || []), "AI output must be reviewed against the source profile and job posting."])];
  return merged;
}

export async function analyzeWithProvider(body, local) {
  const provider = body.settings?.provider;
  const apiKey = String(body.settings?.apiKey || "").trim();
  const model = String(body.settings?.model || "").trim();
  if (!apiKey) throw new Error("No API key was provided.");
  if (!model) throw new Error("No model ID was provided.");
  const input = inputFor(body, local);
  let result;
  if (provider === "openai") result = await callOpenAI({ apiKey, model, input });
  else if (provider === "anthropic") result = await callAnthropic({ apiKey, model, input });
  else if (provider === "gemini") result = await callGemini({ apiKey, model, input });
  else throw new Error(`Unsupported provider: ${provider}`);
  return normalize(result, local);
}
