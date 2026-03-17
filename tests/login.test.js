const assert = require("node:assert/strict");
const test = require("node:test");

const handler = require("../api/login.js");

function createResponseRecorder() {
  const response = {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };

  return response;
}

test("rejects non-POST requests and sends hardening headers", () => {
  const response = createResponseRecorder();

  handler({ method: "GET", body: null }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "POST");
  assert.equal(response.headers["Cache-Control"], "no-store");
  assert.equal(response.headers["X-Content-Type-Options"], "nosniff");
  assert.deepEqual(response.body, { error: "Method not allowed." });
});

test("returns unauthorized for bad credentials without caching the result", () => {
  const response = createResponseRecorder();
  const previousUsername = process.env.LOGIN_USERNAME;
  const previousPassword = process.env.LOGIN_PASSWORD;

  process.env.LOGIN_USERNAME = "demo";
  process.env.LOGIN_PASSWORD = "secret";

  handler(
    {
      method: "POST",
      body: { username: "demo", password: "wrong" },
    },
    response
  );

  assert.equal(response.statusCode, 401);
  assert.equal(response.headers["Cache-Control"], "no-store");
  assert.equal(response.headers["X-Content-Type-Options"], "nosniff");
  assert.deepEqual(response.body, { ok: false });

  process.env.LOGIN_USERNAME = previousUsername;
  process.env.LOGIN_PASSWORD = previousPassword;
});
