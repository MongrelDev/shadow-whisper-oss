# ShadowWhisper (Open Source)

Voice-to-text transcription that inserts text wherever your cursor is. Record with a global hotkey, get AI-powered transcription, and the text appears instantly in any app.

> Open source release. Licensed under the [MIT License](./LICENSE).

## How It Works

1. Press the global hotkey (default: `Cmd+Shift+Option+W`)
2. Speak, then press again to stop
3. Transcribed text is inserted at your cursor position, in any app

## Features

- **Instant transcription** — Cloudflare Workers AI (Whisper) with server-side voice activity detection
- **Works anywhere** — text is inserted at the cursor via native input simulation
- **Personal dictionary** — teach the model your names, terms, and abbreviations
- **Formatting modes** — Default, Message, Email, Code, List
- **Transcription history** — cloud-synced with search
- **Custom shortcuts** — configurable global hotkeys with conflict detection

## Tech Stack

- **Desktop** — Electron + React 19, electron-vite, Tailwind CSS v4, shadcn/ui, TanStack Query/Router
- **Backend** — Cloudflare Workers, Hono, Effect TS, D1 (SQLite), Workers AI (Whisper + VAD)
- **Platform** — Better Auth, Stripe, pnpm + Turborepo monorepo, TypeScript

## Getting Started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm** 11 — enable via Corepack: `corepack enable && corepack prepare pnpm@11.3.0 --activate`
- A **Cloudflare account** (for `wrangler dev`/deploy of the worker)
- Secrets go in `.dev.vars` (local) and `wrangler secret put` (remote) — see each app's `.env.example`. Never commit real secrets; only the non-sensitive resource IDs in `wrangler.toml` are checked in.

### Setup

```bash
pnpm install        # install dependencies
pnpm dev            # start all apps in dev mode
pnpm build          # build all apps
pnpm typecheck      # type check everything
pnpm lint           # lint all code
```

The repo also ships a [Taskfile](https://taskfile.dev): `task bootstrap` (auth wrangler → migrate D1 → seed R2), then `task dev` (worker) and `task desktop` (desktop app). Run `task --list` to see everything.

## License

Released under the [MIT License](./LICENSE).
