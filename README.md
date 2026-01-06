# CxTrack – Developer README

## 📖 Project Overview
**CxTrack** is a lightweight CRM built with **React (Next.js/ Vite optional), TypeScript**, and **Supabase** as the backend.  The application supports multi‑tenant organizations, calendar/agenda views, invoicing, and a demo mode that falls back to local storage.

---

## 🛠️ Prerequisites
| Tool | Version |
|------|---------|
| Node.js | >= 18.x |
| npm (or yarn) | latest |
| Git | latest |
| Supabase CLI | `supabase` (>= 2.0) |
| (Optional) Docker | for local Supabase emulation |

---

## ⚙️ Local Development Setup
1. **Clone the repository** (already done for you).
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create a `.env.local` file** at the project root (copy from `.env.example` if present). Required keys:
   ```dotenv
   # Supabase credentials – get these from your Supabase project dashboard
   VITE_SUPABASE_URL=https://<project>.supabase.co
   VITE_SUPABASE_ANON_KEY=public-anon-key
   VITE_SUPABASE_SERVICE_ROLE_KEY=service-role-key   # only needed for server‑side tasks

   # Demo mode – set to `true` to use local storage instead of Supabase
   DEMO_MODE=true
   ```
4. **Run the dev server**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000` (or the port shown in the console).

---

## 🚀 Production Build & Deployment
### 1. Build the app
```bash
npm run build   # creates an optimized production bundle in ./dist (or .next)
```
### 2. Choose a hosting platform
- **Vercel / Netlify** – simply point to the repository and set the same environment variables as in `.env.local`.
- **Static hosting (e.g., Cloudflare Pages, AWS S3 + CloudFront)** – upload the contents of the `dist` folder.
- **Docker** – a `Dockerfile` is provided (or you can create one) to serve the static files via `nginx`.
### 3. Environment variables in production
| Variable | Description |
|----------|-------------|
| VITE_SUPABASE_URL | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | Public anon key |
| VITE_SUPABASE_SERVICE_ROLE_KEY | Service‑role key (keep secret – only needed for server‑side jobs) |
| DEMO_MODE | Must be `false` for production |

---

## 🔗 Connecting to Supabase
1. **Create a Supabase project** at https://app.supabase.com.
2. **Enable Row‑Level Security (RLS)** for every table that stores tenant‑specific data (e.g., `organizations`, `contacts`, `invoices`). The repository already contains migration scripts under `supabase/migrations/` – run them with the CLI:
   ```bash
   supabase db reset   # wipes and recreates the local dev DB
   supabase db push    # applies migrations to the remote project
   ```
3. **Policies** – see `supabase/policies/` for the default policies. Typical pattern:
   ```sql
   CREATE POLICY "org_isolation" ON contacts
   USING (auth.uid() = organization_id);
   ```
   Ensure they reference the `organization_id` column that is stored in the JWT claims (`app_metadata -> organization_id`).
4. **Auth** – the app uses Supabase Auth. Configure the redirect URLs in the Supabase dashboard (`http://localhost:3000` for dev, your production domain for prod).
5. **Service‑role usage** – only server‑side scripts (e.g., cron jobs, edge functions) should use the service‑role key. Never expose it to the browser.

---

## 📁 Repository Structure (high‑level)
```
src/
│   ├─ components/          # Re‑usable UI components
│   ├─ layouts/            # Page layout wrappers (DashboardLayout)
│   ├─ pages/              # Next/Vite page routes (Calendar, Invoices…)
│   ├─ stores/             # Zustand/Pinia stores (organizationStore.ts, …)
│   └─ config/             # demo.config.ts, supabase.config.ts

supabase/
│   ├─ migrations/         # SQL migration files
│   └─ policies/           # RLS policies (SQL)

public/ (or static/)       # static assets, images
```

---

## 🧩 Key Store Logic (Supabase vs Demo)
- Each store (`*.store.ts`) checks `import { DEMO_MODE } from '@/config/demo.config'`.
- When `DEMO_MODE === true` the store falls back to **localStorage** (see `localStorageStore.ts`).
- When `false` the store uses the Supabase client (`supabase.from('table')`).
- Ensure the `organization_id` is attached to every request; the client reads it from the JWT (`auth.session().user.app_metadata.organization_id`).

---

## ✅ Production Checklist
- [ ] `DEMO_MODE` set to `false` in production env vars.
- [ ] All Supabase migration scripts are applied (`supabase db push`).
- [ ] RLS policies reviewed and tested for each table.
- [ ] Environment variables are stored securely (Vercel/Netlify secrets, Docker secrets, etc.).
- [ ] Build passes without TypeScript errors (`npm run lint && npm run build`).
- [ ] CI pipeline runs tests (`npm test`) and lints on each PR.
- [ ] Monitoring/Logging – consider Supabase logs and a front‑end error tracker (Sentry, LogRocket).
- [ ] CDN cache‑busting – ensure the `dist` folder is served with proper cache headers.

---

## 🐞 Debugging Tips
- **Supabase Auth errors** – check that the JWT contains `organization_id` in `app_metadata`.
- **RLS denied** – run the failing query directly in the Supabase SQL editor with `auth.uid()` set to a test user ID.
- **Local dev DB out‑of‑sync** – run `supabase db reset && supabase db push`.
- **Network issues** – verify that the `VITE_SUPABASE_URL` does not have a trailing slash.

---

## 📚 Helpful Links
- Supabase Docs: https://supabase.com/docs
- Supabase CLI: https://github.com/supabase/cli
- Vite Docs (if using Vite): https://vitejs.dev/
- React + TypeScript Best Practices: https://reactjs.org/docs/typescript.html

---

*This README is intended for developers onboarding the CxTrack CRM to a production environment and for connecting it to Supabase. Adjust paths or environment variable names as needed for your specific deployment setup.*
