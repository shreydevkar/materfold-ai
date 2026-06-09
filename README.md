# Materfold AI

Materfold AI is an agentic marketing workflow system for briefing, ideation, creative scoring, and post-campaign analysis. It is structured as a Node.js + TypeScript monorepo with a shared core agent layer, an Express API, a React frontend, and a Prisma-backed data layer.

## What It Does

- Collects client briefs and campaign goals.
- Generates campaign ideas with AI agents.
- Scores creatives with diagnostic feedback.
- Pulls post-campaign insights back into client memory.
- Keeps campaign context isolated by client and organization.

## Architecture At A Glance

- `packages/core`: shared agent logic, workflow state, guardrails, and domain types.
- `packages/api`: Express API, request scoping, context management, token usage tracking, and campaign endpoints.
- `packages/frontend`: React/Vite UI for brief review and workflow visibility.
- `packages/data`: Prisma schema, SQL/data model definitions, and schema files for campaign context.
- `context-store`: local campaign memory files used by the context manager.

### Main Flow

1. Client brief is submitted.
2. Context is initialized for that client and campaign.
3. Ideation agent generates campaign concepts.
4. Scoring agent evaluates creative and returns a score.
5. Analysis agent processes campaign performance.
6. Learnings are stored and reused in later campaigns.

## Project Status

### Done

- Monorepo scaffold created.
- Core shared types, agents, guardrails, and workflow skeleton added.
- API routes, token meter, context manager, client scoping, and hybrid Prisma-backed persistence added.
- Frontend shell with a styled landing page and local Anthropic API key settings panel added.
- Prisma schema, migration SQL, data repositories, seed flow, and context schema added.
- Dockerfile and `.env.example` added.
- DOCX specs were read directly and compared against TXT conversions.
- Workspace installs cleanly and passes `typecheck`, `test`, and `build`.

### Left To Do

- Wire the API routes fully to Prisma-backed persistence instead of the current in-memory services.
- Add production database setup and run the initial migrations against a live PostgreSQL instance.
- Expand request validation and error handling across routes.
- Add more integration tests for full campaign flows.
- Wire the frontend to the API with real data fetching and state management.
- Add production deployment wiring and hosting-specific config if you want to ship it.

### Frontend Convenience

- The dashboard includes a local API key input that stores the Anthropic key in browser `localStorage`.
- This makes it easier to prototype after downloading the project from GitHub without editing env files first.

## Requirements

### Prerequisites

- Node.js 24 LTS or newer.
- npm.
- A PostgreSQL database if you want to move beyond the current in-memory service layer.

### Environment Variables

- `DATABASE_URL`
- `CONTEXT_STORE_PATH`
- `JWT_SECRET`
- `ANTHROPIC_API_KEY`
- `META_APP_ID`
- `META_APP_SECRET`
- `GOOGLE_ADS_DEVELOPER_TOKEN`
- `TIKTOK_CLIENT_ID`
- `TIKTOK_CLIENT_SECRET`

## How To Run

### Install Dependencies

```bash
npm install
```

### Typecheck

```bash
npm run typecheck
```

### Test

```bash
npm run test
```

### Build

```bash
npm run build
```

### Start The API In Development

```bash
npm run dev
```

## Useful Package Scripts

- `npm run build -w @materfold/core`
- `npm run build -w @materfold/api`
- `npm run build -w @materfold/frontend`
- `npm run build -w @materfold/data`

## Notes

- The current API services are intentionally lightweight so the project can be built and validated in this environment.
- The advanced learning and context selection logic is implemented in a minimal form and can be expanded into real persistence next.