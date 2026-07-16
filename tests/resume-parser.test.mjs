import test from "node:test";
import assert from "node:assert/strict";
import { parseResume } from "../src/resume-parser.mjs";

test("parses a plain-text resume and infers keywords", async () => {
  const text = "Robotics Engineer\nDeveloped ROS2 and Python tools for embedded sensors, validation, and field testing.";
  const result = await parseResume({ filename: "resume.txt", mimeType: "text/plain", data: Buffer.from(text).toString("base64") });
  assert.match(result.text, /Robotics Engineer/);
  assert.ok(result.keywords.includes("python"));
  assert.ok(result.keywords.includes("ros2"));
});
