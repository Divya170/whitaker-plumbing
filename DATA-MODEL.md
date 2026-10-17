# Whitaker Plumbing — data model extracted from the design comp

Sources: `design-source/Whitaker Plumbing v2.dc.html` (**built from this one**) and `Whitaker Plumbing.dc.html` (v1, kept for reference).
v2 only restyles v1 (warm cream palette, rounded "bento" service tiles, pill navigation, hero "What's going on?" card, coloured step/benefit tiles). The pages, copy, form rules and admin are identical in both.

## Identity
- Business: Whitaker Plumbing — contact Asher Whitaker · +1 (602) 833-3185 · asher.whitaker@gmail.com
- Address: 600 E Trade St, Charlotte, NC 28202 — **"publish only after the business approves it"** → setting `showAddress` (off by default).
- Fonts: Bricolage Grotesque 500–800 (display), Figtree 400–700 (body), system monospace (review tags, placeholders).
- Colours: page `#FFFDF9`, ink `#23201C`, text `#3E3933`, muted `#5E5850` / `#4A453E`, sand `#F6F0E7` / `#F1E8DB` / `#EDE6DB`, lines `#EAE3D8` / `#E8DFD2` / `#D9D0C3`, blue `#1F5FAD` (hover `#184E8F`, tint `#E7EFF9`, on-blue `#E2ECF8` / `#D4E3F6`), teal `#2A8C7E` / `#1D6B60` / mint `#E3F2EE` / `#CFE6DF`, amber dot `#B7791F`, rust dot `#C2553A`, error `#B42318` / `#8A1C12` / `#FDF1F0` / `#E7B4AE`, success `#1E7B4F` / `#E3F2E9`, review tag `#FFF6E0` / `#B7791F` / `#6B4200`.
- Admin palette: deep teal `#103F43`, accent `#36B7A5`, bg `#F3F6F5`, lines `#D9E2E0` / `#B7C6C3`, text `#263238` / `#3B4A4E` / `#5B6A6E`, link `#1F6BB8`. Status chips: New `#E3EEFA/#174F87`, Contacted `#DDF1EC/#0E5048`, In Progress `#FFF1D6/#784600`, Completed `#E1F1E7/#17603C`, Closed `#ECEFEF/#3F4A4D`.
- Motion: slow zoom on hero/why photos (16s), fade-in on menus/results/success, spinner on submit, hover lift on service tiles; all off with `prefers-reduced-motion`.
- Breakpoints: desktop header ≥ 960px (else Call + Menu button with dropdown, Esc closes); bento lg ≥ 960 / md ≥ 680 / sm; hero card floats ≥ 720px; Call label "Call +1 (602) 833-3185" ≥ 1220px; admin sidebar ≥ 900px (table) else top bar + cards; mobile sticky "Call / Request Service" bar below 960px except on Contact.

## Routes (comp hash → app route)
| Comp | App | Content |
|---|---|---|
| `#/` | `/` | Hero (badge, H1 with highlight, CTAs, photo, "What's going on?" service chips + "Something else") · assurances · "What can we help with?" bento (4 services) · "Why Whitaker Plumbing" (photo + 4 numbered benefits + credentials TO CONFIRM) · service-area check band · FAQ preview (4) · closing CTA "Tell Us What's Going On." |
| `#/services` (`/:id`) | `/services` (`#leak` anchors) | Intro + tools photo + round inset · category pills · one section per service ("0N of 04", long text, "Common signs", "Request {title}", call) · "Other plumbing issues" · "Not Sure Which Service You Need?" |
| `#/about` (`/faqs`) | `/about` (`#faqs`) | About intro · wide photo · "How service requests work" (4 steps) · FAQs with Expand/Collapse all · "Get in touch" (phone / email / online) |
| `#/service-areas` | `/service-areas` | Intro + area check · "Listed service locations" or "No service locations are listed yet." · CTA band |
| `#/contact` (`?service=`) | `/contact?service=` | Request form (4 fieldsets) + aside (call/email, hours/emergency once supplied, helpful details, after you submit) · success card |
| `#/privacy` | `/privacy` | Privacy notice |
| `#/admin/login`, `#/admin/leads`, `#/admin/leads/:id` | `/admin/login`, `/admin/leads`, `/admin/leads/[id]` | Sign in · Service requests (status tabs with counts, search, service filter, sort, 8 per page, table ≥ 900px / cards below) · lead detail (fields, status update, notification card, call / email customer) |

## Content (admin-managed)
- **Services** (4, table `services`): slug (leak, drain, pipe, heater), title, short, long, signs[3], image label/alt, published, order. The form adds `other` = "Other Plumbing Issue".
- **FAQs** (8) — 3 answers pending in the design ("Which locations do you serve?", emergencies, business hours). Empty answer = pending: shown as "Answer to be provided by Whitaker Plumbing." with a TO CONFIRM tag while review flags are on, hidden once they are off. Non-pending answers carry a "DRAFT · Describes website behaviour" tag while flags are on.
- **Benefits** (4), **assurances** (3), **steps** (4), **tips** (4).
- **Service areas** — empty in the design (`APPROVED_AREAS = []`); each row is a city with its ZIP codes.
- **Page photos** — hero, why, services-hero, services-detail, about-wide. Service photos are set per service.
- **Settings** — business details, about, privacy notice, credentials, hours, emergency info, follow-up note (all empty = hidden + TO CONFIRM tag), review banner text, flags.

## Request form — exact rules (client + server)
| Field | Rule → message |
|---|---|
| name | required → "Enter your name." · < 2 → "Name should be at least 2 characters." · ≤ 80 |
| phone | required → "Enter a phone number so we can reach you." · chars `+? digits space ( ) . -` → "Use digits, spaces, brackets, dashes or a leading +." · 7–15 digits → "Enter a phone number with 7 to 15 digits." · stored as E.164 |
| email | required → "Enter your email address." · `/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/` → "Enter an email address like name@example.com." · ≤ 120 |
| service | leak · drain · pipe · heater · other → "Choose a service type, or “Other Plumbing Issue.”" |
| issue | required → "Describe the issue in a few words." · < 10 → "Add a little more detail (at least 10 characters)." · ≤ 1500 (counter "N / 1500") |
| location | required → "Enter your city, town or ZIP code." · < 2 → "Enter a city, town or 5-digit ZIP code." · digits that aren't a ZIP → "We couldn’t recognise this location. Enter a city name or a 5-digit ZIP code." (the design's server-validation example) · ≤ 80 |
| preferredDate | optional · ≥ today (America/New_York) → "Choose today or a later date." |
| preferredWindow | morning · afternoon · flexible → "Choose a preferred time of day." |
| extra | optional ≤ 1500 |
| company | honeypot (hidden "Company (leave blank)") → fake success, discarded |

- Errors show on blur (when the field has a value) and on submit; the summary "Please fix N problem(s) before sending" lists "Label: message" buttons that focus each field; server errors use "Please check the highlighted field".
- Draft kept in sessionStorage (never the honeypot); `?service=` preselects the service.
- Success card: "Your service request has been received." + receipt (Reference, Service, Location, Preferred time) + "Back to Home" / "Submit another request".
- Network failure: "We couldn’t send your request." + call link; button becomes "Try again".

## Admin
- Statuses New · Contacted · In Progress · Completed · Closed (+ Spam, hidden unless chosen).
- List: tabs with counts, search name/phone/email/reference, service filter, newest/oldest, 8 per page, "N total · N new", empty state "No requests match these filters." + Clear filters.
- Detail: reference + received, fields, "Update status" (Save disabled until changed, "Status updated to X."), "Internal workflow status. Not shown to the customer.", Notification card, Call / Email customer.

## Flags & simulations
| Prop | Default | Implementation |
|---|---|---|
| `showContentFlags` | true | Setting "Show pre-launch review flags": banner + TO CONFIRM / DRAFT tags + pending FAQs. Turn off to launch. |
| `apiMode` success / network-error / server-validation | success | **Not reproduced** — the form always posts to the real API; real errors drive those states. |

Not reproduced (prototype-only): localStorage demo leads and the 12 sample rows, the "password: demo" login, the 550 ms fake loading, `window.dataLayer` tracking (kept as a no-op hook), JS width checks (real CSS breakpoints).
