# Abdullah AI

**Abdullah AI** is a browser-based AI chat product by **ABDULLAH TECHNOLOGIES**. This repository contains an early product build, not a finished commercial service.

## What's included

- Responsive Arabic-first chat interface with an English language toggle.
- Conversation history saved in the current browser, with search, delete, copy, and text export.
- Server-side AI endpoint at \`api/chat.js\`.
- API key kept in the hosting environment, never in browser code or Git.
- Basic request validation, message-size limits, output limits, and request timeout handling.
- App icon and web app manifest.

## Run and deploy

This project uses a Vercel-style serverless Node.js function. Opening \`index.html\` directly as a local file will show the interface, but the AI endpoint will not run.

1. Import this repository into a Vercel project.
2. In the project environment settings, add \`OPENAI_API_KEY\` as a secret environment variable.
3. Optionally set \`OPENAI_MODEL\` to a model enabled for the API account. The current default is \`gpt-6-luna\`.
4. Optionally set \`OPENAI_MAX_OUTPUT_TOKENS\` to a value from 200 to 1500. The default is 900.
5. Deploy and test the chat endpoint on the deployed domain.

The project owner must create and manage the API key privately. Never paste it into chat, browser code, screenshots, or GitHub. If the developer is under 18, a parent or guardian must handle the API account, billing, and secret key.

## Data and product limitations

- Chat history is stored in the visitor's browser using local storage. It is not an account-based sync service and is not available on another device.
- Messages submitted for a response are sent to the configured AI provider. Do not enter passwords, payment information, or sensitive personal details.
- API usage may incur charges. Set a budget/usage limit and monitor usage before enabling the service for anyone else.
- The endpoint has request-size and timeout safeguards, but it does **not** yet have production-grade authentication, persistent rate limiting, user accounts, or per-user quotas. Do not advertise it as a public, unlimited service.
- Before accepting customers or selling access, add an independently reviewed privacy notice and terms, abuse prevention, durable rate limiting, account/security controls, backup and deletion workflows, and operational monitoring. Confirm you have the rights to all code, branding, and assets being transferred.

## Manual release checklist

- [ ] Set a valid API key in the hosting environment (never in Git).
- [ ] Confirm the selected model is enabled for that API account.
- [ ] Test a short Arabic prompt and a short English prompt.
- [ ] Test missing-key, invalid-request, and provider-limit error messages.
- [ ] Check the layout on a phone and desktop.
- [ ] Confirm local chat deletion and export work as expected.
- [ ] Add authentication and persistent rate limiting before any public launch.

This project is a work in progress. A polished interface alone does not establish commercial readiness or guarantee sales.
