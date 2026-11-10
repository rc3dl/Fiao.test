# FIA'O

**Your credit notebook, now digital.**

FIA'O is a web app for small shops in Panama that sell on credit (*fiado*). It replaces the paper notebook: the shop owner registers customers, credits and payments, sees who owes what and who is overdue, keeps an inventory, and sends friendly payment reminders by WhatsApp.

It is a student project, built to be free to run: the whole stack below works on free plans.

> The interface is currently in English. Amounts are shown in balboas (`B/.`) and dates use the Panama time zone.

---

## Table of contents

- [Features](#features)
- [How the credit rules work](#how-the-credit-rules-work)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Supabase setup](#supabase-setup)
- [Environment variables](#environment-variables)
- [Deploying to Vercel](#deploying-to-vercel)
- [Project structure](#project-structure)
- [Database overview](#database-overview)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Notes for contributors](#notes-for-contributors)

---

## Features

| Screen | What it does |
|---|---|
| **Landing page** | Public home page that explains the product. |
| **Sign up / Log in** | Email and password, with a 6-digit code sent by email to verify the account, and password reset by email. Google sign-in is optional. |
| **Setup** | First-time screen shown before the dashboard: asks for your name, store name, optional phone/RUC/address, and your credit rules. It only appears while the profile is incomplete. |
| **Dashboard** | Live numbers (outstanding debt, payments today, customers with debt, overdue accounts), who to collect first, recent activity, low-stock alert and quick links. |
| **Clients** | Create, edit, search, filter (On Time / Pending / Overdue) and archive customers. Prepares a WhatsApp reminder for customers who owe. |
| **Credit** | Pick a customer, see their debt, limit and history; register new credits, partial or full payments, or mark an account as paid. Optional automatic blocking when a customer would pass their limit. |
| **Products** | Inventory with price, stock, unit and a low-stock alert. A second tab registers a credit sale straight from the inventory (the stock goes down automatically). |
| **Reports** | Choose a period and a customer or status; see cards with trends, a chart, the status of the credit issued and a paginated list of transactions. Export to **Excel** or **PDF**. |
| **Profile** | Business information, credit rules (default limit, days to pay, automatic blocking) and the notifications switch. |
| **Notifications bell** | Alerts for overdue accounts and products that are running low. Can be turned off in Profile. |
| **Contact** | FAQ and a contact form. Messages are saved in the database. |
| **Light / dark theme** | Toggle in the navigation bar; the choice is remembered on the device. |

The app is responsive and designed to be used from a phone.

## How the credit rules work

These rules live in one place, [`src/lib/credit.js`](src/lib/credit.js), so every screen shows the same numbers. The most important ones are also enforced by the database (see [`supabase/schema.sql`](supabase/schema.sql)).

- **Debt is never stored.** A customer's balance is always `credits − payments`.
- **Payments cover the oldest credit first** (first in, first out).
- **Status of a customer:**
  - `On Time` – no debt.
  - `Pending` – owes money, nothing is past its due date.
  - `Overdue` – owes money that is past its due date.
- **Each credit has a due date.** If none is chosen, it is *today + the default days to pay* from Profile (15 by default).
- **A payment can never be higher than the debt.**
- **Credit limit.** Each customer can have their own limit; otherwise the default limit from Profile applies (B/. 100 by default). With *Automatic blocking* on, a credit that would take the customer over the limit is rejected.
- **Credits and payments cannot be edited or deleted.** A mistake is fixed with a new entry, so the history stays trustworthy.
- **Customers and products with history are archived, not deleted.** A customer who still owes money cannot be archived.
- **Money is handled in cents** internally to avoid decimal errors.

## Tech stack

| Area | Technology |
|---|---|
| Front end | [React 18](https://react.dev), [Vite](https://vite.dev), [React Router 6](https://reactrouter.com) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) components (Radix UI), CSS variables for the light/dark theme |
| Data fetching | [TanStack Query 5](https://tanstack.com/query) |
| Charts and icons | [Recharts](https://recharts.org), [lucide-react](https://lucide.dev) |
| Back end | [Supabase](https://supabase.com): PostgreSQL, Auth and Row Level Security |
| Exports | Excel file built in the browser (`src/lib/xlsxWriter.js`, no library) and PDF with [jsPDF](https://github.com/parallax/jsPDF) |
| Hosting | [Vercel](https://vercel.com) |
| Auth emails | Any SMTP provider configured in Supabase (Gmail with an app password works and is free) |

There is no custom server: the browser talks directly to Supabase, and Row Level Security decides what each user can read or change.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 20.19 or newer (the current LTS is recommended)
- [Git](https://git-scm.com)
- A free [Supabase](https://supabase.com) account

### 1. Clone and install

```bash
git clone https://github.com/rc3dl/Fia-O.git
cd Fia-O
npm install
```

### 2. Set up Supabase

Follow [Supabase setup](#supabase-setup) below. You need the **Project URL** and the **anon / publishable key** of your project.

### 3. Create `.env.local`

Create a file named `.env.local` in the project root (next to `package.json`):

```bash
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_ENABLE_GOOGLE=true
```

This file is ignored by Git. Never commit it.

### 4. Run it

```bash
npm run dev
```

Open <http://localhost:5173>. Stop and restart the command whenever you change `.env.local`.

> **Windows (PowerShell):** if you see *"running scripts is disabled on this system"*, either use `npm.cmd run dev`, or allow scripts for your user once with  
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

### Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the development server with hot reload. |
| `npm run build` | Create the production build in `dist/`. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint. |
| `npm run typecheck` | Run the TypeScript checker over the JavaScript files. |

## Supabase setup

### 1. Create the project

Create a new project at [supabase.com](https://supabase.com). In **Project Settings → API** copy the **Project URL** and the **anon public** (or *publishable*) key. Use only that public key in the front end — never the `service_role` / secret key.

### 2. Create the database

Open **SQL Editor → New query**, paste the whole content of [`supabase/schema.sql`](supabase/schema.sql) and press **Run**. It creates all tables, the security policies, and the database rules (see [Database overview](#database-overview)).

### 3. Configure authentication

In **Authentication**:

1. **Sign In / Providers → Email**
   - Keep the Email provider **enabled** and **Confirm email ON**.
   - Set **Email OTP Length** to **6** (the sign-up screen has six boxes for the code).
2. **Emails → SMTP Settings** — enable a custom SMTP provider. Supabase's built-in email service is meant for testing only (limited recipients and a very low hourly limit), and it does not allow editing the email templates. A free option is Gmail with an [app password](https://support.google.com/accounts/answer/185833) (requires 2-Step Verification):

   | Field | Value |
   |---|---|
   | Sender email | your Gmail address |
   | Sender name | FIA'O |
   | Host | `smtp.gmail.com` |
   | Port | `465` (use `587` if `465` fails) |
   | Username | your full Gmail address |
   | Password | the 16-letter app password, without spaces |

   The SMTP password is entered **only in the Supabase dashboard** — never in the code or in `.env.local`.
3. **Emails → Templates**
   - **Confirm signup** must show the code with `{{ .Token }}`:

     ```html
     <h2>Verify your account</h2>
     <p>Your verification code is:</p>
     <h1>{{ .Token }}</h1>
     <p>Enter it in the app to activate your account.</p>
     ```

   - **Reset Password** must keep `{{ .ConfirmationURL }}`:

     ```html
     <h2>Reset your password</h2>
     <p>Click the link to choose a new password:</p>
     <p><a href="{{ .ConfirmationURL }}">Change my password</a></p>
     ```

4. **URL Configuration**
   - **Site URL:** `http://localhost:5173` while developing (your production URL once deployed).
   - **Redirect URLs:** add `http://localhost:5173/**` and `https://YOUR-APP.vercel.app/**`.

### 4. Google sign-in (optional)

The "Continue with Google" button is hidden by default. To enable it, create OAuth credentials in Google Cloud, add Supabase's callback URL, enable **Authentication → Providers → Google**, and set `VITE_ENABLE_GOOGLE=true`.

### Quick check

Sign up with a real email address, enter the 6-digit code, complete the Setup screen, and add your first customer. In **Table Editor** you should see your rows in `profiles` and `clients`.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | Project URL of your Supabase project. |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public anon (or publishable) key. Safe for the browser because Row Level Security protects the data. |
| `VITE_ENABLE_GOOGLE` | No | `true` shows the Google sign-in button on the web. Default `false`. It is always hidden in the Android app. |
| `VITE_APP_URL` | No | Public address of the web (for example `https://YOUR-USER.github.io/Fia-O`). The Android app uses it for links that open outside the app, such as password reset. |
| `VITE_BASE` | No | Overrides the publishing path. By default it is `/` locally and in Vercel, and `/Fia-O/` in GitHub Pages. |

Vite only exposes variables that start with `VITE_`. They are read when the dev server or the build starts, so restart after changing them. `.env.example` lists all of them.

| Environment | Where the variables come from | Build command |
|---|---|---|
| Local (`npm run dev`) | `.env.local` | `npm run dev` |
| GitHub Pages | Repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the workflow also sets `VITE_ENABLE_GOOGLE`) | automatic on every push to `main` |
| Android app | `.env.local` | `npm run android` |

GitHub Pages builds and Android builds stop with a clear message if the two Supabase variables are missing, so a broken login is never published.

## Android app (Capacitor)

The Android app wraps the same React code. Everything that is specific to Android lives in `src/native/` and only runs when `IS_NATIVE` (`src/native/useIsNative.js`) is true, so the web is never affected.

1. Complete `.env.local` (copy `.env.example`). `VITE_APP_URL` is optional but recommended.
2. `npm install`
3. `npm run android` (builds with `--mode android` and runs `cap sync android`).
4. `npx cap open android`, then **Build → Build APK(s)**. The test APK is `android/app/build/outputs/apk/debug/app-debug.apk`.

After adding or updating Capacitor plugins, run `npm run android` again. Google sign-in is not available inside the app (Google blocks WebViews), so the app uses email and password. In Supabase, add the web address (`VITE_APP_URL`) to **Authentication → URL Configuration → Redirect URLs** so the password reset link works.

## Deploying to Vercel

1. Push the repository to GitHub.
2. In [Vercel](https://vercel.com) choose **Add New → Project** and import the repository.
3. Check the build settings:

   | Setting | Value |
   |---|---|
   | Framework Preset | **Vite** |
   | Build Command | `npm run build` |
   | Output Directory | `dist` |
   | Install Command | `npm install` |

4. Add the three environment variables from the table above.
5. Deploy.
6. In Supabase **Authentication → URL Configuration**, set the Site URL and add the Redirect URL for your new `*.vercel.app` address.

The app uses client-side routing, so the repository includes a `vercel.json` that sends every route to `index.html`:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Every push to the main branch redeploys automatically. After changing environment variables in Vercel, redeploy so the new values are included in the build. Check Vercel's current terms for the free plan (it is meant for non-commercial projects).

## Project structure

```text
.
├── public/                  # Static files: logos (SVG and PNG), manifest.json
├── supabase/
│   └── schema.sql           # Whole database: tables, security policies, triggers, functions
├── src/
│   ├── main.jsx             # App entry point
│   ├── App.jsx              # Providers and routes
│   ├── index.css            # Tailwind + theme colors (light and dark CSS variables)
│   ├── api/                 # Everything that talks to Supabase
│   │   ├── supabaseClient.js    # The Supabase client (reads the VITE_ variables)
│   │   ├── authClient.js        # Sign up, log in, OTP, password reset, profile (see note below)
│   │   ├── creditApi.js         # Credit screen data, settings, saving credit rules
│   │   ├── clientsApi.js        # Customers: list, create, edit, archive, reminders
│   │   ├── productsApi.js       # Products and the credit sale from inventory
│   │   ├── dashboardApi.js      # Everything the dashboard and the bell need
│   │   ├── setupApi.js          # Saves the first-time setup in one step
│   │   └── contactApi.js        # Saves Contact messages
│   ├── contexts/            # Session (AuthContext), language and light / dark theme
│   ├── lib/                 # Business rules and helpers (pure functions, no UI)
│   │   ├── credit.js            # Credit rules: balances, statuses, limits, money and date helpers
│   │   ├── products.js          # Product and cart rules
│   │   ├── reports.js           # All report calculations
│   │   ├── reportExport.js      # Excel and PDF downloads
│   │   ├── xlsxWriter.js        # Minimal .xlsx file writer (no external library)
│   │   ├── alerts.js            # What appears in the notifications bell
│   │   ├── settings.js          # Profile, credit rules and setup validation
│   │   ├── contact.js           # Contact form validation
│   │   ├── env.js               # Every VITE_ variable, read in one place
│   │   ├── translations.js      # Spanish / English texts
│   │   └── query-client.js      # TanStack Query configuration
│   ├── tour/                # The guided tutorial (steps, overlay, provider, translations)
│   ├── native/              # Android app only (Capacitor): bottom bar, splash, back button, mobile screens
│   ├── pages/               # One file per screen
│   └── components/          # Navbar, Footer, NotificationBell, ProtectedRoute, ProfileGate, ui/ (shadcn)
├── vercel.json              # Routing rule for Vercel
├── vite.config.js           # Vite config (includes the "@/" alias for src/)
└── tailwind.config.js
```

**How the pieces fit together:**

```text
Page (src/pages)  →  data file (src/api/*Api.js)  →  Supabase  →  Row Level Security
        ↑
  rules and calculations (src/lib/credit.js and friends) — pure functions, no UI
```

Pages never talk to Supabase directly: they call the `*Api.js` files. The calculations are pure functions, so they are easy to read and to test.

> **A note on naming:** `src/api/authClient.js` exports an object called `base44`. This is a leftover name from the first prototype (it was originally built on Base44). It keeps the same method names the pages already used, so it was left as is. It now talks to Supabase.

## Database overview

The full definition is in [`supabase/schema.sql`](supabase/schema.sql).

| Table | Purpose |
|---|---|
| `profiles` | One row per merchant: name, store, phone, address, RUC, and the credit rules (default limit, days to pay, automatic blocking, notifications). Created automatically at sign-up. |
| `clients` | The merchant's customers, with an optional own credit limit. |
| `products` | Inventory: price, stock, unit, minimum stock (for the alert), optional image link. |
| `credit_entries` | Every credit (`fiado`) and every payment (`pago`). Insert-only. |
| `credit_entry_items` | Which products were taken in each credit sale, with the price at that moment. |
| `reminders` | Log of payment reminders prepared for customers. |
| `contact_messages` | Messages sent from the Contact page. |

Database rules (triggers and functions):

| Name | What it enforces |
|---|---|
| `check_credit_entry` | A payment cannot exceed the debt; automatic blocking by credit limit; default due date. |
| `register_fiado_sale` | One atomic step for a credit sale from the inventory: checks stock, uses the stored prices, creates the credit and its items, and lowers the stock. If anything fails, nothing is saved. |
| `handle_new_user` | Creates the `profiles` row when someone signs up. |
| `limit_contact_messages` | One Contact message per minute per user. |

Every table has Row Level Security: a merchant only reads and changes rows where `owner_id = auth.uid()`.

## Security

- The **anon key is public by design**. What protects the data is Row Level Security, which is enabled on every table.
- Never put the `service_role` key, the SMTP/app password, or any secret in the repository or in a `VITE_` variable.
- `.env.local` is ignored by Git. The repository can be public.
- Credit rules are enforced in the database as well as on screen, so they cannot be skipped from the browser.
- Customers' names and phone numbers are personal data. Ask for permission before storing real customers' information.

## Troubleshooting

| Problem | What to check |
|---|---|
| **"Invalid API key"** when signing up | The app is not reading `.env.local`. The file must be named exactly `.env.local`, live next to `package.json`, use the exact variable names above, and the dev server must be restarted. Use the public anon/publishable key and the Project URL of the same project. |
| **"Error sending confirmation email"** | Open **Logs → Auth** in Supabase and read the exact error. `535 Username and Password not accepted` means the Gmail app password is wrong (16 letters, no spaces, from the same account, with 2-Step Verification on). A message about a domain not being verified means Supabase is still using another email provider. |
| **The email code is longer than the boxes** | Set **Email OTP Length** to 6 in **Authentication → Sign In / Providers → Email**, then request a new code. |
| **Cannot edit the email templates** | Templates can only be edited after a custom SMTP provider is enabled. |
| **Vercel shows `404: NOT_FOUND`** | Framework Preset must be **Vite** and Output Directory `dist`; then redeploy. Also make sure `vercel.json` is committed so routes like `/clients` work on refresh. |
| **Build fails on Vercel but works locally** | Vercel runs on Linux, where file names are case-sensitive. Make sure imports match the exact file names (`git ls-files` shows the names Git knows). |
| **`npm` is blocked in PowerShell** | Use `npm.cmd`, or run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once. |
| **Password reset link does not work** | Add your site URL to **Redirect URLs** (`http://localhost:5173/**` and your production URL). |
| **The page is blank after a change** | Open the browser console (F12) and the terminal running `npm run dev`; the error names the file and line. |

## Known limitations

- The interface is only in English.
- There is no offline mode: an internet connection is required.
- Payment reminders are not sent automatically. FIA'O prepares the WhatsApp message and opens WhatsApp with it ready; the merchant presses send. (Fully automatic messages require the paid WhatsApp Business API.)
- Customers do not have accounts and cannot pay inside the app; the merchant records the payment.
- Product images are added by link; uploading photos is not available yet.
- The *Digital Catalog* card in Products is a placeholder for a future feature.
- Notifications appear only inside the app (the bell); there are no push notifications or emails.
- There is no automated test suite yet.

## Notes for contributors

- Put business rules in `src/lib/credit.js` (or the matching file in `src/lib/`), not inside the pages, so every screen stays consistent.
- Each area has its own `*Api.js` file for database access. After changing data, invalidate the related queries (`LEDGER_KEYS` and `PRODUCT_KEYS` are exported for that purpose).
- Colors come from CSS variables defined in `src/index.css` (`var(--text)`, `var(--surface)`, `var(--page-bg)`…), each with a light and a dark value. Use them instead of fixed colors so the dark theme keeps working.
- Imports use the `@/` alias for `src/`.
- Comments in the source are written for beginners: explain the *why*, not just the *what*.
- Before opening a pull request run `npm run lint` and `npm run build`.

## License

No license has been chosen yet. Until one is added, all rights are reserved by the author.
volver a actualizar la web