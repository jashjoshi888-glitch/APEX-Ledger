# APEX Ledger

A professional, multi-profile finance telemetry dashboard built with **React + Vite + TypeScript + Tailwind CSS**, powered by local-first browser storage.

## Features

- **Multi-account support** — create and switch between local profiles on the same device, each with a completely isolated ledger.
- **Dashboard overview** — net liquid position, period inflows/outflows, savings lockout, and a Chart.js asset velocity graph.
- **Transactions ledger** — add, edit, delete, search, and filter income/expense records with custom categories and notes.
- **Reserves & savings** — create target reserves, deposit liquid assets into them, reassign them back, mark as bought (creates an expense), or retire them.
- **Reports** — compile a printable monthly balance sheet and browse read-only archived periods.
- **Settings** — currency symbol configuration, dynamic income/expense categories, JSON import/export, and a hard reset.

## Storage model

All data lives in `localStorage`, namespaced per account:

| Key | Purpose |
| --- | --- |
| `apex_ledger_v1_users` | Local account profiles |
| `apex_ledger_v1_session` | Current active session |
| `apex_ledger_v1_data_<userId>` | Per-user ledger transactions/reserves/archives/config |

> Passwords are hashed locally with SHA-256 for this browser-only demo. For production, use a server-side, salted KDF (bcrypt/argon2) and a real API.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

The output is written to `dist/`.
