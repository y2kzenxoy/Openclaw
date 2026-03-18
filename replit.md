# iPad AI Agent Workspace

## Overview

Full-stack AI agent web app optimized for iPad control. Powered by Groq (llama-3.3-70b-versatile). Dark terminal-hacker UI with 6 panels navigated by a bottom tab bar.

## Features

1. **AI Chat** - Talk to the agent powered by Groq LLM. It can guide terminal, browser, and file operations.
2. **Terminal** - Execute commands on the server or via SSH on an iPad running a-Shell.
3. **Browser Automation** - Navigate URLs with Playwright server-side, or control Safari on iPad via Apple Shortcuts webhook.
4. **File Manager** - Upload, download, delete files with drag & drop support.
5. **Camera** - Access iPad camera via browser MediaDevices API, capture photos, analyze with Groq vision.
6. **Settings** - Configure SSH, API keys, feature toggles, view iPad setup guide with QR code.

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
