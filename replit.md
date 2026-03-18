# iPad AI Agent Workspace

## Overview

Full-stack AI agent web app optimized for iPad control. Powered by Groq (llama-3.3-70b-versatile). OpenClaw dark UI (red/orange accent, near-black) with left sidebar on desktop and bottom nav on mobile. 6 functional panels + comprehensive permissions system.

## Features

1. **AI Chat** - Groq LLM chat with tool-call visualization (colored badges), session sidebar, thinking traces, voice input (SpeechRecognition), text-to-speech toggle, clipboard paste button.
2. **Terminal** - SSH or local command execution, command history (arrow keys), emerald terminal output.
3. **Browser Automation** - Navigate URLs with Playwright, CSS selector actions, screenshots, Apple Shortcuts webhook for Safari on iPad.
4. **File Manager** - Upload, download, delete files with drag & drop, file preview, all file types supported.
5. **Camera & Vision** - Front/back camera, capture & AI analysis via Groq llama-4-scout, corner bracket viewfinder overlay.
6. **Settings** - Two-tab layout: General (SSH, model, module toggles, QR code) + Permissions (full dashboard).

## Permissions System (new)

- **First-launch onboarding** — full-screen welcome with 13 permission cards, "Grant All" button, skip option.
- **`usePermissions` hook** — central state in localStorage (`oc_permissions`), re-checks on open, individual request functions for each API.
- **Permissions Dashboard** (Settings → Permissions tab) — every permission listed with colored status dot, description, usage, Allow/Retry/Open Settings buttons, "Request All" at top.
- **Permissions covered**: Camera, Microphone, Location, Notifications, Clipboard, Persistent Storage, Screen Wake Lock, Device Motion, Bluetooth, Speech Recognition, Contacts, Screen Capture, Battery, Background Sync, Biometrics (Face ID/Touch ID).
- **`useSpeech` hook** — SpeechRecognition for voice input, SpeechSynthesis for TTS.
- **`useDeviceStatus` hook** — battery level/charging state, online/offline detection, wake lock management.
- **`NetworkStatusBar`** — shown when offline or battery/location data available; offline banner in red.
- Wake lock auto-acquired after onboarding to prevent iPad screen sleep.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Frontend**: React + Vite (artifacts/ipad-agent)
- **Backend**: Express API server (artifacts/api-server)
- **AI**: Groq SDK (llama-3.3-70b-versatile for chat, llama-4-scout-17b for vision)
- **Browser automation**: Playwright (server-side), Apple Shortcuts webhook (iPad Safari)
- **Terminal**: node-ssh (SSH to iPad a-Shell) or local exec fallback
- **File storage**: Local disk (uploads/ directory)
- **Database**: Not used (stateless, in-memory state)
- **Validation**: Zod (via generated OpenAPI schemas)
- **API codegen**: Orval (from OpenAPI spec)

## Structure

```text
artifacts/
├── api-server/         # Express API server
│   ├── src/routes/     # All route handlers
│   │   ├── agent.ts    # AI chat (Groq LLM)
│   │   ├── terminal.ts # SSH + local command execution
│   │   ├── browser.ts  # Playwright + Shortcuts webhook
│   │   ├── files.ts    # Multer file upload/download
│   │   ├── camera.ts   # Groq vision image analysis
│   │   ├── settings.ts # App configuration
│   │   └── setup.ts    # iPad setup guide
│   ├── src/lib/        # Shared state/utilities
│   │   ├── settings.ts # In-memory settings
│   │   ├── chatHistory.ts # Conversation history
│   │   └── browserState.ts # Browser automation state
│   └── uploads/        # Uploaded file storage
├── ipad-agent/         # React + Vite frontend (previewPath: /)
│   └── src/pages/      # ChatPanel, TerminalPanel, BrowserPanel, etc.
lib/
├── api-spec/openapi.yaml  # Full OpenAPI 3.1 spec
├── api-client-react/   # Generated React Query hooks
└── api-zod/            # Generated Zod schemas
```

## Environment Variables

- `GROQ_API_KEY` - Required secret for AI features
- `LLM_MODEL` - Model for chat (default: llama-3.3-70b-versatile)
- `MAX_LOOPS` - Agent max iterations (default: 20)
- `AGENT_TIMEOUT` - Agent timeout seconds (default: 180)
- `ENABLE_CAMERA/TERMINAL/FILE_ACCESS/BROWSER` - Feature flags

## iPad Setup

1. Install a-Shell on iPad → run `sshd`
2. Find iPad IP, configure SSH in Settings tab
3. Create Apple Shortcut to POST to `/api/browser/shortcuts-webhook`
4. Open web app in Safari on iPad for camera access
