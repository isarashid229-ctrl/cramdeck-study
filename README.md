# EagleCram

An intelligent homework and assignment organizer for students. Upload screenshots, PDFs, syllabus pages, or paste instructions — AI extracts deadlines, requirements, and builds a step-by-step completion plan.

## Tech Stack

- **Next.js 15** (App Router) + TypeScript
- **Tailwind CSS** + shadcn/ui components
- **Supabase** (Auth, Postgres, Storage)
- **OpenAI API** for assignment extraction and quiz generation
- **TanStack Query**, React Hook Form, Zod, date-fns, Recharts, FullCalendar, Framer Motion

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up Supabase

The app cannot create Supabase tables from the browser. You can use either the automatic setup script or the manual SQL Editor steps.

#### Automatic setup

1. Open Supabase at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **Project Settings**
3. Go to **Database**
4. Copy the project database connection string
5. Add it to `.env.local` as `SUPABASE_DB_URL`
6. Run:

```bash
npm run setup:supabase
```

7. Restart the app with:

```bash
npm run dev
```

#### Easiest manual setup

1. Open Supabase at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Click **New Query**
4. Open `supabase/full-setup.sql` in Cursor
5. Copy all of it
6. Paste it into Supabase SQL Editor
7. Click **Run**
8. Restart the app with `npm run dev`

#### Existing project learning upgrade

If the main database is already set up and `npm run diagnose` only reports these tables as missing:

- `study_resources`
- `topic_mastery`
- `flashcards`
- `study_plans`

run the shorter upgrade file instead:

1. Open Supabase at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Click **New Query**
4. Open `supabase/learning-upgrade.sql` in Cursor
5. Copy all of it
6. Paste it into Supabase SQL Editor
7. Click **Run**
8. Restart the app with `npm run dev`
9. Run `npm run diagnose` again and confirm the four learning tables show `ok`

#### Manual setup with separate files

1. Open Supabase at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Click **New Query**
4. Open `supabase/schema.sql` in Cursor
5. Copy all of it
6. Paste it into Supabase SQL Editor
7. Click **Run**
8. Click **New Query**
9. Open `supabase/policies.sql` in Cursor
10. Copy all of it
11. Paste it into Supabase SQL Editor
12. Click **Run**
13. Restart the app with `npm run dev`

You can also open `/setup` in the app for copy buttons and the same checklist.

Run `supabase/schema.sql` first, then `supabase/policies.sql`. Or run `supabase/full-setup.sql`, which combines schema, policies, and storage bucket setup. After setup runs successfully and the app restarts, the database setup warning should disappear.

Optional: create a storage bucket named `assignments` for file uploads. `supabase/full-setup.sql` creates it automatically. If only uploads are failing with a row-level security error, run `supabase/storage-policies.sql` in the Supabase SQL Editor.

<!-- Legacy short checklist:
1. Open Supabase
2. Go to SQL Editor
3. Open `supabase/schema.sql` in Cursor
4. Copy all of it
5. Paste it into Supabase SQL Editor
6. Click **Run**
7. Open `supabase/policies.sql` in Cursor
8. Copy all of it
9. Paste it into Supabase SQL Editor
10. Click **Run**
11. Restart the app with `npm run dev`
-->

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in your Supabase URL and anon key. `OPENAI_API_KEY` is optional; without it, EagleCram uses fallback assignment extraction and fallback quiz/game questions.

Live Google Classroom and Canvas sync are optional. Manual import works without these variables, including on GitHub Pages. For real connected-account sync on a server deployment such as local Next.js or Vercel, add:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
CANVAS_CLIENT_ID=
CANVAS_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
```

The updated `supabase/full-setup.sql` includes the integration tables: `connected_accounts`, `external_courses`, `external_assignments`, `sync_runs`, `import_batches`, and `import_candidates`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a local health report, run:

```bash
npm run diagnose
```

## Features

- **Landing page** with SaaS-style design
- **Auth** — email/password signup & login with persistent Supabase sessions
- **Dashboard** — stats, points, avatar preview, rewards, urgent assignments, progress by course
- **Add Assignment** — paste, upload, or manual entry with AI extraction
- **Assignment detail** — steps checklist, study timer, requirements
- **Calendar** — month/week/list views via FullCalendar
- **Courses** — CRUD with color picker
- **Test Me** — AI/fallback practice quizzes with saved attempts
- **Games** — study minigames against fallback AI opponents
- **Avatar** — point-based cosmetics and title unlocks
- **Analytics** — Recharts productivity charts
- **Settings & Profile** — theme toggle, timezone, grade level

## Project Structure

```
app/                  # Next.js App Router pages
components/           # UI and feature components
lib/                  # Supabase, AI, validators, hooks
types/                # TypeScript types
supabase/             # SQL schema and RLS policies
```

## API Routes

- `POST /api/ai/extract-assignment` — structured assignment extraction (server-side only)
- `POST /api/ai/generate-quiz` — OpenAI quiz generation with a local fallback

## Deployment

Repository:

```text
https://github.com/isarashid229-ctrl/cramdeck-study
```

### GitHub Pages preview

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.
It builds a static export with:

```bash
GITHUB_PAGES=true npm run build
```

GitHub Pages is useful for a public preview of the app UI at:

```text
https://isarashid229-ctrl.github.io/cramdeck-study/
```

The GitHub Pages workflow uses the publishable Supabase browser variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Because GitHub Pages is static hosting, it disables Next.js middleware and API routes. That means the Pages build can show the app shell, public pages, responsive layout, and client-side Supabase screens, but it is not the recommended production host for protected middleware, server API routes, and OpenAI-backed actions.

### Production deployment

Use Vercel for the full Next.js app. Vercel supports the middleware, API routes, and server runtime that EagleCram uses.

Required Vercel environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Optional:

```env
OPENAI_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Security

- Row Level Security on all Supabase tables
- OpenAI API key never exposed to client
- Input sanitization and 10MB upload limit
- Protected routes via middleware
