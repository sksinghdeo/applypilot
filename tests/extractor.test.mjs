import test from "node:test";
import assert from "node:assert/strict";
import { extractJobFields, parseSalary } from "../src/extractor.mjs";

test("extracts structured JobPosting location and annual salary", () => {
  const job = extractJobFields({
    url: "https://example.com/job",
    text: "Robotics Application Engineer\nSkild AI\nSan Francisco, CA",
    structured: { schemaJob: {
      "@type": "JobPosting",
      title: "Robotics Application Engineer",
      hiringOrganization: { name: "Skild AI" },
      jobLocation: { address: { addressLocality: "San Francisco", addressRegion: "CA", addressCountry: "US" } },
      baseSalary: { currency: "USD", value: { minValue: 120000, maxValue: 160000, unitText: "YEAR" } }
    } }
  });
  assert.equal(job.title, "Robotics Application Engineer");
  assert.equal(job.company, "Skild AI");
  assert.equal(job.location, "San Francisco, CA, US");
  assert.equal(job.salaryMin, 120000);
  assert.equal(job.salaryMax, 160000);
  assert.equal(job.salaryUnit, "YEAR");
  assert.equal(job.extraction.confidence.salary, "high");
});

test("extracts hourly range from visible text", () => {
  const salary = parseSalary("Compensation range: $42.50 - $61.00 per hour");
  assert.equal(salary.min, 42.5);
  assert.equal(salary.max, 61);
  assert.equal(salary.unit, "HOUR");
});

test("uses DOM location and salary before text fallback", () => {
  const job = extractJobFields({
    title: "Jobs",
    text: "Senior Controls Engineer",
    structured: { dom: { title: "Senior Controls Engineer", company: "Northstar Robotics", location: "Austin, TX · Hybrid", salary: "$130K–$170K a year" } }
  });
  assert.equal(job.company, "Northstar Robotics");
  assert.match(job.location, /Austin/);
  assert.equal(job.salaryMin, 130000);
  assert.equal(job.salaryMax, 170000);
  assert.equal(job.workMode, "Hybrid");
});
