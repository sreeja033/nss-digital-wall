A civic-tech platform where community members anonymously report local problems, and NSS (National Service Scheme) volunteers claim, act on, and resolve them — with full public visibility from **Report → Action → Impact**.

🔗 **Live app:** https://nss-digital-problem-wall.vercel.app/

 What This Is
Most "report a civic problem" apps stop at the complaint. This one closes the loop:
🔴 Reported  →  🟡 NSS Working  →  🟢 Solved
Every problem gets a public timeline, a real assigned team, and before/after photo proof once it's fixed — so the community can actually see that reporting something leads to real action, not a black hole.

Design theme: "Community Corkboard"
The app is deliberately styled as a warm neighborhood noticeboard rather than a government dashboard — pinned index cards, ink rubber-stamp status badges, and a terracotta/teal/mustard palette instead of generic civic-tech blue.

👥 Roles

| Role | Access | What they do |
|---|---|---|
| Community Member| login | Report problems anonymously, browse the public wall, upvote, adopt a problem to follow it, view before/after results |
| NSS Volunteer| Login via Volunteer ID (issued by a coordinator only — no self sign-up) | Claim or get assigned problems, log progress updates, upload before/after photos, mark problems solved |
| NSS Coordinator (Admin)| Login via coordinator account | Review and approve/reject new reports, assign volunteers to problems, issue/suspend Volunteer IDs, monitor analytics |

✨ Key Features

- Anonymous reporting — no account required to report a problem
- Photo + GPS location capture — auto-detects location via the browser, with manual fallback
- Duplicate detection — similar reports get merged into one problem instead of cluttering the wall
- Moderation gate — every new report starts `pending_review` and is invisible on the public wall until a coordinator approves it (enforced at the database/RLS level, not just the UI)
- AI photo-relevance check — flags photos that don't appear to match the reported category, for coordinator review
- Volunteer ID system — volunteers can only log in with an ID issued by a coordinator; no public volunteer sign-up
- Real-time status tracking — Reported → In Progress → Solved, with a public action timeline per problem
- Before/after impact gallery — every solved problem shows photo proof
- Interactive map — real map with pins colored by status (via Leaflet + OpenStreetMap, no API key required)

 🛠️ Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React (built via Google AI Studio) |
| Backend / Database | Supabase (PostgreSQL, Auth, Storage, Row Level Security) |
| Maps | Leaflet.js + OpenStreetMap tiles, Nominatim (reverse geocoding) |
| Hosting | Vercel |
| AI features | Gemini (photo-relevance check on submission) |

 🚀 Getting Started
 Prerequisites
- Node.js (v18+ recommended)
- A Supabase project ([supabase.com](https://supabase.com))

### Setup

```bash
# Clone the repo
git clone <your-repo-url>
cd nss-voice-of-the-community

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

Fill in `.env` with your Supabase project credentials:

```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ Never commit `.env` or expose the Supabase **service role key** anywhere in frontend code — it belongs only in server-side edge functions.

```bash
# Run the database schema (see /supabase-schema.sql) in your Supabase SQL editor,
# or via the Supabase CLI, to create all tables, RLS policies, and functions.

# Start the dev server
npm run dev
```

Deploying
The app is deployed on Vercel. Push to `main` to trigger a redeploy, or connect the repo directly in the Vercel dashboard.

 🗄️ Database Schema (overview)

| Table | Purpose |
|---|---|
| `problems` | Core reports — title, category, status, location, photo, linked-duplicate count |
| `teams` / `team_members` | Volunteer teams assigned to a problem |
| `actions` | Progress log entries, including before/after photos |
| `community_users` | Optional community accounts |
| `volunteers` | Volunteer accounts, created only by coordinators |
| `coordinators` | Admin/coordinator accounts |
| `upvotes` / `adoptions` | Community engagement on a problem |

Full schema, RLS policies, and triggers live in [`supabase-schema.sql`](./supabase-schema.sql).

Security note: Row Level Security is enabled on every table. Public read access explicitly excludes `pending_review` and `rejected` reports, and interaction tables (upvotes, comments, actions) block writes on unapproved reports — enforced at the database level, verified via direct anonymous-role queries, not just hidden in the UI.

---

 📁 Project Structure

```
/src
  /components     → Reusable UI (ProblemCard, StatusStamp, etc.)
  /screens        → Page-level views (Home, Wall, Report, Dashboard, Admin...)
  /lib            → Supabase client, helpers
  /context        → App-wide state
supabase-schema.sql → Full DB schema + RLS policies
```

---

🤝 Contributing

This project is run by NSS student volunteers. If you'd like to contribute:
1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Open a pull request with a clear description of the change



---

## 🙏 About NSS

The National Service Scheme (NSS) is a government-backed student volunteer program in India focused on community service. This app is an independent tool built by NSS volunteers to make local civic action more transparent and trackable — it is not an official NSS national platform.
