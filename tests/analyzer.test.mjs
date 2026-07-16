import test from "node:test";
import assert from "node:assert/strict";
import { analyzeJobLocally } from "../src/analyzer.mjs";

const profile = {
  identity: { fullName: "Jordan Lee", email: "jordan@example.com" },
  experienceYears: 4,
  skills: [{ name: "Python", years: 4 }, { name: "C++", years: 3 }, { name: "ROS2", years: 2 }, { name: "Sensors", years: 4 }, { name: "Validation", years: 4 }],
  workAuthorization: { authorized: true, citizen: true, usPerson: true, activeClearance: false, requiresNow: false, requiresFuture: false },
  preferences: { targetRoles: ["Robotics Engineer", "Application Engineer"], locations: ["California", "Remote"], hybrid: true, remote: true, relocation: true, acceptContract: false }
};
const resumes = [{ id: "r1", name: "Robotics Resume", category: "Robotics", keywords: "ROS2 Python C++ sensors validation", summary: "Robotics integration and field validation" }];

test("scores a relevant robotics role and routes resume", () => {
  const result = analyzeJobLocally({ profile, resumes, job: { title: "Robotics Application Engineer", location: "San Francisco, California · Hybrid", description: "3+ years. Python C++ ROS2 sensors validation field service." } });
  assert.ok(result.fitScore >= 7);
  assert.equal(result.recommendedResume.id, "r1");
  assert.equal(result.recommendation, "Proceed to review");
});

test("detects citizenship and clearance blocker", () => {
  const result = analyzeJobLocally({ profile: { ...profile, workAuthorization: { ...profile.workAuthorization, citizen: false, activeClearance: false } }, resumes, job: { title: "Robotics Engineer", description: "U.S. citizenship required. Active Secret clearance required." } });
  assert.equal(result.recommendation, "Skip — eligibility blocker");
  assert.ok(result.blockers.length >= 2);
  assert.ok(result.fitScore <= 4.7);
});

test("sensitive answers are never pre-approved", () => {
  const result = analyzeJobLocally({ profile, resumes, job: { title: "Application Engineer", company: "Example Robotics", description: "Python and validation" } });
  assert.ok(result.answers.some(answer => answer.sensitive));
  assert.ok(result.answers.filter(answer => answer.sensitive).every(answer => answer.approved === false));
});
