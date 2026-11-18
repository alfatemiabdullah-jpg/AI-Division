# Abdullah AI

A browser-based AI chat website by ABDULLAH TECHNOLOGIES.

## Project files

- `index.html` — responsive chat interface.
- `api/chat.js` — server-side chat endpoint. The API key is read only from the hosting environment.

## Run locally

This project uses a serverless API route, so opening `index.html` directly as a file will show the interface but will not run the AI endpoint. Deploy it to a platform that supports Vercel-style Node.js functions, or use the Vercel CLI for local development.

## Deploy

1. Import this GitHub repository into a Vercel project.
2. In the project settings, add an environment variable named `OPENAI_API_KEY`.
3. The project owner should create and manage this key privately. Never paste it into chat, browser code, or GitHub.
4. Optionally set `OPENAI_MODEL` to a model available to the API account. The default in this project is `gpt-6-luna`.
5. Deploy the project.

## Important

- API usage may incur charges. Review current API pricing and set usage limits before enabling it.
- If the developer is under 18, a parent or guardian should handle the API account, billing, and secret key.
- Do not commit `.env` files or API keys.
- This is an early prototype. Add authentication, rate limiting, abuse protection, and privacy controls before inviting public users.
