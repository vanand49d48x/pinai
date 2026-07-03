# PicAI Scheduler

AI-powered Pinterest pin scheduler. Upload or link pin images, generate SEO-optimized titles/descriptions/hashtags with Claude, and auto-publish to Pinterest at scheduled times.

## Stack

- **Next.js 14** (App Router, TypeScript, Tailwind CSS, shadcn/ui)
- **Supabase** (Postgres, Auth, Storage)
- **Vercel Cron** (publish every 10 minutes)
- **Anthropic API** (claude-haiku-4-5)
- **Pinterest API v5**

## Setup

### 1. Clone and install

```bash
cd pinai
npm install
cp .env.example .env.local
```

Fill in all environment variables in `.env.local`.

### 2. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** and run the full contents of `supabase/schema.sql`.
3. Enable **Google** auth provider under Authentication → Providers (optional).
4. Set **Site URL** to `http://localhost:3000` and add `http://localhost:3000/auth/callback` to redirect URLs.
5. Copy your project URL, anon key, and service role key into `.env.local`.

### 3. Pinterest Developer App

1. Go to [developers.pinterest.com](https://developers.pinterest.com) and create an app.
2. Add redirect URI: `{NEXT_PUBLIC_APP_URL}/api/pinterest/callback`
   - Local: `http://localhost:3000/api/pinterest/callback`
   - Production: `https://your-domain.vercel.app/api/pinterest/callback`
3. Request scopes: `boards:read`, `pins:read`, `pins:write`.
4. Copy **App ID** → `PINTEREST_CLIENT_ID` and **App secret** → `PINTEREST_CLIENT_SECRET`.
5. For development, set `PINTEREST_API_BASE=https://api-sandbox.pinterest.com`.
6. For production, set `PINTEREST_API_BASE=https://api.pinterest.com`.

### 4. Anthropic

1. Get an API key from [console.anthropic.com](https://console.anthropic.com).
2. Set `ANTHROPIC_API_KEY` in `.env.local`.

### 5. Cron secret

Generate a random string for `CRON_SECRET`:

```bash
openssl rand -hex 32
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 7. Deploy to Vercel

1. Push to GitHub and import into [Vercel](https://vercel.com).
2. Add all environment variables from `.env.example`.
3. Set `NEXT_PUBLIC_APP_URL` to your production URL.
4. Set `PINTEREST_API_BASE` to `https://api.pinterest.com` for production.
5. The `vercel.json` cron config runs `/api/cron/publish` every 10 minutes automatically.

> **Note:** Vercel Cron sends `Authorization: Bearer {CRON_SECRET}`. Ensure `CRON_SECRET` is set in Vercel env vars.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `PINTEREST_CLIENT_ID` | Pinterest app client ID |
| `PINTEREST_CLIENT_SECRET` | Pinterest app client secret |
| `PINTEREST_API_BASE` | `https://api-sandbox.pinterest.com` or `https://api.pinterest.com` |
| `CRON_SECRET` | Secret for cron endpoint auth |
| `NEXT_PUBLIC_APP_URL` | App base URL (no trailing slash) |

## Features

- **Pinterest OAuth** — Connect account, auto-refresh tokens, sync boards
- **Pin creation** — Upload to Supabase Storage or paste image URL
- **Bulk CSV import** — Import many pins at once as drafts
- **AI metadata** — Claude generates title, description, alt text from image + topic/keywords
- **Generate All** — Batch generate metadata for all drafts with rate-limit delay
- **Dashboard** — Filter by status, inline edit title/description, schedule pins
- **Calendar** — Weekly grid view of scheduled pins
- **Auto-publish** — Cron job publishes scheduled pins every 10 minutes

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── cron/publish/       # Vercel cron publisher
│   │   ├── pinterest/          # OAuth + board sync
│   │   └── pins/               # CRUD + AI generation
│   ├── dashboard/
│   ├── calendar/
│   ├── pins/new/
│   ├── settings/
│   └── login/
├── components/
├── lib/
│   ├── supabase/
│   ├── pinterest.ts
│   ├── anthropic.ts
│   └── encryption.ts
└── types/
supabase/schema.sql
```

## CSV Bulk Import Format

```csv
image_url,topic,keywords,link,board_name,scheduled_at
https://example.com/pin.jpg,Summer decor,home summer minimalist,https://site.com/post,Home Ideas,2026-07-10 14:00
```

Board names are matched case-insensitively against synced Pinterest boards.

## License

MIT
