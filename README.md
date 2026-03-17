# Worst Login

This repo is a tiny Vercel-ready login demo with an intentionally hostile front end.

- Static UI: `index.html`, `styles.css`, `script.js`
- Serverless login check: `api/login.js`
- Accepted creds come from Vercel env vars

## Run tests

```bash
npm test
```

The test suite covers the login handler and a few key UI structure checks.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Add these env vars:
   - `LOGIN_USERNAME`
   - `LOGIN_PASSWORD`
4. Redeploy.
5. Open the public Vercel URL and test the flow.

## How it works

- The browser sends a `POST` request to `/api/login`.
- The serverless handler compares the submitted creds against the configured env vars.
- A match returns `{ "ok": true }`.
- A mismatch returns a `401`.

## Local notes

Node is only needed for local testing, the Vercel CLI, and the small test suite.
