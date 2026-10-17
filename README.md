# Whitaker Plumbing — website

A residential plumbing website with a service-request form, a service-area check and a staff "lead manager".
**Stack:** Next.js 14 (App Router) frontend · NestJS 10 API · SQLite3 via TypeORM.
Built from the "Whitaker Plumbing" design comp (`design-source/`). Every rule, message and piece of copy taken from it is listed in `DATA-MODEL.md`.

```
whitaker-plumbing/
├── backend/        NestJS API (src/, package.json, .env.example)
├── frontend/       Next.js site + admin (app/, components/, lib/, public/)
├── database/       app.sqlite is created here on first boot
├── design-source/  original .dc.html comps (v1 + v2) and support.js
├── DATA-MODEL.md   what was extracted from the design
├── package.json    root scripts
└── README.md
```

## Run it

```bash
npm install                               # root (concurrently)
npm run install:all                       # backend + frontend dependencies
cp backend/.env.example backend/.env      # set SESSION_SECRET, admin login, optional SMTP
cp frontend/.env.example frontend/.env.local
npm run dev                               # API on :4000, site on :3000
```

On first boot the API creates `database/app.sqlite` and seeds content from the design:
- the business settings
- the four services
- 8 FAQs, three of them with answers still pending, as in the design
- the benefits, steps, assurances and form tips
- the admin account, whose credentials it prints to the console

Seeding never overwrites your edits.

- **Site:** http://localhost:3000
- **Admin:** http://localhost:3000/admin, also linked as "Staff sign-in" in the footer.
  - Default login: `admin@whitakerplumbing.local` / `WhitakerAdmin#2026`.
  - Change it in `backend/.env` before first boot, or later under **Account**.
- **Tests:** `npm test` runs 10 business-rule checks: the form rules with the design's exact messages, phone/E.164, ZIP handling, references, honeypot, the service-area lookup, CSRF/cookie helpers, CSV safety and the seed data.

## What's built

### Public site (v2 design)
| Page | Highlights |
|---|---|
| `/` Home | **Hero:** highlighted headline, Request/Call buttons and a photo slot. Its "What's going on?" card has service chips that open the form with that service preselected.<br>**Sections:** assurances; services bento (sizes change at 960 / 680 px); "Why Whitaker Plumbing" with numbered benefits; a live **service-area check**; a 4-question FAQ preview; the blue "Tell Us What's Going On." CTA. |
| `/services` | Intro with photo and round inset, plus category pills that jump to each section. One alternating section per service ("0N of 04", description, "Common signs", "Request {service}" link to `/contact?service=…`, call link). Then "Other plumbing issues" and "Not Sure Which Service You Need?". |
| `/about` | About text, wide photo, the 4 "How service requests work" steps, the FAQ band with **Expand all / Collapse all**, and "Get in touch" cards. |
| `/service-areas` | Area check and the list of approved locations. With no locations it shows the design's empty state "No service locations are listed yet." Ends with a CTA band. |
| `/contact` | **Request form** in four fieldsets:<br>• Validation uses the design's exact messages, on blur and on submit.<br>• Error summary whose buttons focus each field; green border on valid fields; 1500-character counter.<br>• The draft is kept in the session; `?service=` preselects the service.<br>• **Success card:** "Your service request has been received.", reference `WP-1101`, service, location and preferred time, with **Back to Home** and **Submit another request**.<br>• The aside has call/email, hours and emergency info (once supplied), helpful details and "After you submit". |
| `/privacy` | Privacy notice (admin-editable). |

- **Every page:** loading skeleton, error page with retry, 404 ("This page isn't available."), and a fallback when the API is down.
- **Header and mobile:** sticky header that gains a shadow on scroll. Below 960 px it switches to Call + Menu; the menu closes on Esc and returns focus to the button. The mobile **Call / Request Service** bar shows everywhere except Contact.
- **Motion:** slow photo zoom, fades and hover lifts. All of it is off with `prefers-reduced-motion`.
- **Pre-launch review mode** (the design's `showContentFlags`) is on by default:
  - the "PRE-LAUNCH REVIEW" banner, dashed **TO CONFIRM** / **DRAFT** tags, and the pending FAQs.
  - Turn it off in **Admin → Business & settings** before launch. Pending FAQs then disappear and the tags are hidden.

### Backend and business logic
- **`POST /api/service-requests`**
  - Validates on the server with exactly the client's rules.
  - The service must be a **published** service or "other".
  - The preferred date must be today or later (America/New_York); the location must be a city or a 5-digit ZIP.
  - Honeypot `company` returns a normal confirmation and the request is discarded.
  - Rate limit: 5 per 10 minutes per IP. The body is capped at 16 KB.
  - Returns `422 {errors}` that the form maps onto its fields. A setting can **pause online requests**.
- **`GET /api/service-areas/check?q=`** checks the entry against the approved list only (city name or ZIP), never distance, as the design requires. It is rate-limited.
- **Notifications:** an optional email to the business for each new request over SMTP. It is sent after the database commit and retried by an outbox (5 attempts). When SMTP isn't configured, the lead is stored and marked "Email provider not configured", as the design's notification card says.
- **Privacy:** an audit log of admin access with no personal data, and the IP stored only as a salted hash. Optional retention purge (`LEAD_RETENTION_MONTHS`).

### Admin (`/admin`, design: deep-teal "Lead manager")
- **Sign in:** HttpOnly session cookie with a CSRF token. Passwords are bcrypt-hashed and login is rate-limited. The message "Email or password is incorrect." matches the design.
- **Leads** — matches the design:
  - Status tabs with counts (New · Contacted · In Progress · Completed · Closed, plus Spam when there is any).
  - Search by name, phone, email or reference; service filter; newest/oldest.
  - 8 per page with "Showing 1–8 of N". A table on wide screens and cards on phones.
  - Empty state with **Clear filters**, and a **CSV export** with spreadsheet formulas neutralised.
- **Lead detail** (`/admin/leads/[id]`):
  - All fields; **Update status** ("Status updated to X.", "Internal workflow status. Not shown to the customer.").
  - **Notification** card with retry; **Call customer** / **Email customer**.
  - Additions beyond the design: internal notes and delete.
- **Services:** add, edit, publish/hide, reorder and delete. Fields: title, summary, description, common signs, photo upload, alt text and placeholder label.
- **FAQs, areas & photos:** FAQs (empty answer = pending; "Show on home"), benefits, hero assurances, steps, form tips, **service areas** (city + ZIP codes) and page photos.
- **Business & settings:**
  - Contact details and footer tagline.
  - **Publish the address** toggle — off by default, as the design asks.
  - Business hours, emergency availability, credentials and follow-up note. Each stays hidden until filled in.
  - About and privacy text, the review flags, the mobile bar and pausing requests.
- **Account:** change your password.

## Missing / not implemented

### Not verified by running
- **Not run end to end.** Package installation was blocked where this was built. It was checked only by a TypeScript typecheck of both apps and the 10 backend rule tests. Run `npm run install:all && npm run dev` and click through every flow before launch.

### Content to supply or confirm before launch (the design's "TO CONFIRM" items)
- **Phone and address don't match.**
  - `+1 (602) 833-3185` is an Arizona area code, but the address is 600 E Trade St, Charlotte, NC.
  - The address is hidden until you turn on "Publish the address".
- **No approved service areas.** The design ships an empty list. The area check answers "Please contact us to confirm…" until cities and ZIP codes are added.
- **Three FAQ answers are pending:** locations served, emergency service and business hours. Hours and emergency availability are also empty in Settings.
- **Not supplied:** licensing, insurance or experience; the follow-up process and timing; the company story and owner photo.
- **No real photos.** Every slot shows the design's labelled placeholder until a photo is uploaded.
- **No full privacy policy, retention or deletion terms.** Only the design's short notice is shown.
- **Additional services:** only the four from the design exist. "Other Plumbing Issue" covers everything else.

### Design items replaced or not reproduced
- **Only v2 is built.** v1 has the same pages and logic in a cooler palette.
- **Prototype-only parts replaced:**
  - the `apiMode` demo switch (success / network-error / server-validation) — real API responses now drive those states;
  - the 12 sample leads in localStorage — real leads are stored in SQLite;
  - the "password: demo" login — real accounts;
  - the "DEMO DATA" banner and the 550 ms fake loading.
- **Analytics:** the design's `dataLayer` events (`form_start`, `phone_click`, `service_request_submitted`, …) are kept as a no-op hook. Nothing is sent unless you add a tag manager.
- **Service detail URLs:** the design's `#/services/leak` maps to `/services#leak` (one page with anchors). There are no separate per-service pages.

### Features not in this build
- **No customer confirmation email or SMS.** The customer sees the on-screen confirmation and reference only; the team gets an email when SMTP is set.
- **No online booking or calendar.** As the design says, a request never confirms an appointment.
- **Single admin role.** There are no separate staff permissions and no password reset by email; use Account, or reset the seeded admin.
- **Admin notes are one editable text box.** They are not a timestamped history.
- **No CRM integration.** Export the leads as CSV.

### Production hardening
- **Rate limits are in memory.** They reset on restart and aren't shared between instances; use Redis behind a load balancer.
- **The schema uses `synchronize: true`.** Switch to TypeORM migrations for production.
- **Uploads are on local disk** (`backend/uploads`). Use object storage on multiple servers.
- **Not built:** E2E or browser tests, `sitemap.xml` / `robots.txt`.
