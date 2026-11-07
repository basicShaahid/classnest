# ClassNest

A minimal, cosy class and payment tracker built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Lucide**, and **Motion**. It includes a friendly animated capybara mascot.

## Features

- **Exactly two pages:** Dashboard (`/`) and Classes (`/classes`).
- Dashboard cards for class count, teaching hours, total earnings, money owed, and money collected.
- Payment progress bar and five most recent classes.
- Add, edit, delete, search, filter, and sort classes.
- Quick **Paid / Unpaid** switch that instantly updates all the figures.
- 12-hour AM/PM time selectors with 1-minute precision. Times are stored internally in 24-hour form but **never displayed that way**.
- Automatic calculation of class duration and earnings, including partial hours.
- Configurable default rate (starts at **A$50/hour**). Older class rates aren't changed when you update the default.
- Download all records as a CSV, useful as a backup or to open in Excel.
- Responsive design, subtle animation, confirm-before-delete, and keyboard-friendly forms.
- One example lesson on the first visit (29/10/2026, 12 PM–2 PM, A$100, unpaid). You can edit or remove it; it **won't reappear** after being deleted.

## 1. Run in VS Code

1. Install [Node.js](https://nodejs.org/) (version **20.9 or newer**; an active LTS release recommended).
2. Unzip this project and open the **classnest** folder in VS Code.
3. Open **Terminal → New Terminal** and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open **http://localhost:3000**.

### Production check

```bash
npm test
npm run typecheck
npm run build
npm run start
```

The site should now run at **http://localhost:3000** using the production build.

## 2. Deploy to Vercel

1. Create a new GitHub repository and push this entire folder to it.
2. Sign in to [Vercel](https://vercel.com), select **Add New → Project**, and import your GitHub repository.
3. Vercel detects Next.js automatically. Keep the defaults and click **Deploy**.
4. Open the deployment URL after it finishes.

Cloud sync requires Supabase environment variables. See the cloud sync setup section below.

**Important storage limitation:** This version uses **browser localStorage**, not a cloud database. Each browser/device has its own separate data. Deploying to Vercel does not sync records between your phone and laptop. Clearing browser site data or using private browsing can erase the records. **Export a CSV backup regularly.** A future release could replace `lib/store.tsx`'s persistence with Supabase and add a login.

## 3. Code structure

```text
classnest/
├── app/
│   ├── classes/page.tsx       # List, filter, edit, and payment controls
│   ├── page.tsx               # Dashboard and summaries
│   ├── layout.tsx             # Shared navigation and providers
│   └── globals.css           # Tailwind and animations
├── components/
│   ├── AppShell.tsx           # Navigation and toast notifications
│   ├── LessonModal.tsx        # Add/edit form and AM/PM time picker
│   ├── Mascot.tsx             # CSS/SVG capybara
│   └── PaymentToggle.tsx      # Accessible payment switch
├── lib/
│   ├── store.tsx              # Browser storage and record actions
│   ├── types.ts               # Lesson and dashboard types
│   └── utils.ts               # Formatting, calculations and CSV export
├── public/favicon.svg
├── tailwind.config.ts
├── next.config.ts
├── postcss.config.js
├── tsconfig.json
└── package.json
```

## 4. How the data works

Each lesson stores an ISO date (`YYYY-MM-DD`), times in local `HH:mm`, topic, hourly rate, paid flag, unique ID and timestamps. Displayed dates use Australian `DD/MM/YYYY`; times use `h:mm AM/PM`.

- `duration = end time − start time` (same-day sessions only)
- `class total = duration in hours × rate`, rounded to cents
- `total earnings = paid + unpaid class totals`
- `money owed = sum of unpaid class totals`
- `payments received = sum of paid class totals`
- `payment progress = received / total earnings × 100%`

The UI prevents blank topics, invalid dates, negative rates, and end times at or before start times. Overnight sessions aren't supported in version 1.

## 5. Manual smoke-test checklist

- [ ] First visit shows **1 class**, **2 hours**, **A$100 earned**, **A$100 owed**, **A$0 received**.
- [ ] Open the example class from the dashboard and edit it.
- [ ] Add a new class with times such as **9:15 AM** to **10:45 AM**; confirm the duration and amount.
- [ ] Toggle the record to Paid; check the dashboard increases Received and decreases Owed.
- [ ] Toggle it back to Unpaid.
- [ ] Change the default hourly rate; verify existing records keep their original rate.
- [ ] Search and filter, then clear filters.
- [ ] Delete a class, confirm deletion, refresh, and confirm it stays deleted.
- [ ] Export CSV, open it in Excel, and verify the Australian dates and AM/PM times.
- [ ] Check the layout and forms on a mobile screen.

## Important note about verification

This project was authored in an environment without access to the npm registry, so dependency installation and a real `next build` could not be executed there. Please run `npm install && npm run build` on your machine or in Vercel to verify the build with installed dependencies.


## Cloud sync setup (feature/supabase-sync)

1. In Supabase, create a project and open **SQL Editor**. Paste and run `supabase/schema.sql` once on a new project. This enables user-specific row-level security.
2. In **Authentication → Providers**, enable Email authentication. Use confirmation emails for new sign-ups.
3. In Supabase **Connect**, copy the project URL and **publishable** key. Create `.env.local` locally based on `.env.example`. Never use your database password, secret, or service-role key in any NEXT_PUBLIC variable.
4. Run `npm install` to install `@supabase/supabase-js` and update package-lock.json. Commit that lockfile update before deploying (CI environments using `npm ci` require the updated lockfile).
5. In Vercel **Project → Settings → Environment Variables**, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; redeploy after setting them.
6. Set the allowed Site URL in **Supabase Authentication → URL Configuration** to your Vercel production URL, and add localhost for local development.
7. Sign up or sign in. On the **same browser** that contains your old lessons, use **Import browser classes**. It inserts missing class IDs only, does not overwrite cloud records, and retains the local backup.
8. Sign in with the same account on your phone or another browser to see the same records. Returning to the tab automatically refreshes data.

Notes: This branch is not yet live. It needs the Supabase project configuration, updated lockfile, and a build/test run before merging. The sample lesson is not automatically loaded into new cloud accounts. Existing browser data remains untouched.
