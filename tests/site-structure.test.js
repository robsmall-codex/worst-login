const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const rootDir = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
const css = fs.readFileSync(path.join(rootDir, "styles.css"), "utf8");

test("login page copy uses the updated sentence-case labels", () => {
  assert.match(html, /Demo auth/);
  assert.match(html, /Proof of humanity/);
  assert.match(html, /Policy review/);
  assert.match(html, /Executive identity check/);
});

test("styles expose Redis-aligned font tokens", () => {
  assert.match(css, /--primary-font:\s*"Space Grotesk", sans-serif;/);
  assert.match(css, /--secondary-font:\s*"Space Mono", monospace;/);
  assert.match(css, /font-family:\s*var\(--primary-font\);/);
});
