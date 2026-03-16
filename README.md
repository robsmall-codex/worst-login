# Worst Login

This project is a tiny Vercel-ready login demo:

- Static frontend: `index.html`, `styles.css`, `script.js`
- Serverless credential check: `api/login.js`
- Accepted credentials come from Vercel environment variables

## Deploy to Vercel

1. Create a GitHub repository and push this project to it.
2. In Vercel, create a new project and import that repository.
3. Add these environment variables in the Vercel project settings:
   - `LOGIN_USERNAME`
   - `LOGIN_PASSWORD`
4. Redeploy the project after setting the variables.
5. Open the generated Vercel URL and test the login form.

## How it works

- The browser sends a `POST` request to `/api/login`.
- The serverless function compares the submitted values against the configured environment variables.
- On a match, it returns `{ "ok": true }`.
- On a mismatch, it returns a `401` response.

## Local notes

This repo does not require a package manager to exist as a Vercel deployment target, but local preview and CLI deployment are easier if Node.js is installed.
