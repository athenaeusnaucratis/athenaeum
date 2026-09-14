# Athenaeum Deipnon

A personal cookbook library — cataloging, valuation, and browsing built for a growing collection of 2,000+ cookbooks, many of them out-of-print, non-English, or without ISBNs.

**Live:** [athenaeum-deipnon.com](https://www.athenaeum-deipnon.com)

Public visitors can browse everything read-only. Editing is restricted to the admin account.

---

## What it does

**Adding books**
- Scan an ISBN barcode with the phone camera → Google Books / Open Library auto-fills metadata
- Photograph the cover → OCR (Google Vision + Claude Vision) extracts title, author, publisher, year, edition, ISBN, then enriches from catalogs
- Manual entry when neither scan nor OCR is possible

**Cover imaging**
- CamScanner-style perspective correction with 4-corner drag
- Auto edge detection via Claude Vision
- Bilinear-interpolated warp + auto-levels + unsharp mask post-processing
- Uploaded to Cloudinary (Supabase Storage fallback)
- Up to 4 photos per book, one designated cover

**Discovery**
- Books browsable by author, chef, language, category (tags), location (SF / PH), and named collections
- Table view and grid view of the collection with search across title, subtitle, author, publisher, ISBN, language, condition, format
- Sort by title, author, year, or estimated value

**Metadata enrichment**
- "Refresh from APIs" — pulls missing fields from Open Library → Google Books → Library of Congress → Claude (in that priority)
- "Refine with AI" on any book description or author/chef bio — synthesizes clean cataloger-tone prose from Open Library, Wikipedia, Google Books, plus the collection's own book list as grounding
- Language codes automatically normalized (`"en"` → `"English"`) across all entry paths

**Valuation**
- Auto lookup queries eBay sold prices, AbeBooks, Google Books, ISBNdb, and Claude AI estimation (currency-aware, with local-market context for non-English books)
- Quick-search links to eBay, AbeBooks, Amazon, Nadirkitap, Kitapyurdu, Amazon TR for manual price checking
- Currency-aware manual entry (TRY, EUR, GBP, JPY, INR, KRW, etc.) with live USD conversion
- Value history per book

**People**
- Authors and Chefs as first-class entities with bios, photos, and lists of books
- One-click "promote author to chef" — clones the author record and links all their books to the new chef
- Multi-author entry per book, with per-book chef and restaurant credits

**Auth**
- Supabase Auth (email + password), single admin account
- Middleware locks all write API routes to authenticated users
- All edit UI conditionally rendered based on session

**PWA**
- Installable to iOS home screen with app icon and manifest
- Service worker registered for offline shell

---

## Stack

- **Framework:** Next.js 16 (App Router, RSC) with Turbopack
- **Runtime:** React 19
- **Database & Auth:** Supabase (PostgreSQL 17 + Auth + Storage)
- **AI:** Anthropic Claude Sonnet 4.6 for OCR interpretation, metadata enrichment, description generation, and edge detection
- **Images:** Cloudinary (with Supabase Storage fallback)
- **OCR:** Google Vision API + Claude Vision
- **Barcode scanning:** ZXing (browser)
- **Pricing sources:** eBay Browse API, AbeBooks (HTML scrape), Google Books, ISBNdb, Claude estimation
- **Hosting:** Vercel (with a weekly cron pinging Supabase to prevent free-tier auto-pause)
- **Typography:** Cormorant Garamond (serif) + DM Mono + Jost
- **Palette:** Dark parchment `#111009` background, ink `#f5f0e8` foreground, coral `#d4623a` accent

---

## Project layout

```
app/
├── page.js                            Home
├── collection/                        Full book list (table + grid)
├── books/[id]/                        Book detail
├── authors/, chefs/                   People listing + detail
├── language/, location/, genre/       Browse-by facets
├── collections/                       Named shelves
├── add/                               Scan / photo / manual add flow
├── login/                             Sign-in page
└── api/
    ├── books/[id]/                    CRUD + metadata + describe + value
    ├── authors/[id]/                  CRUD + metadata + describe + promote
    ├── chefs/[id]/                    CRUD + describe
    ├── isbn/[isbn]/                   ISBN → metadata lookup
    ├── ocr/                           Cover photo → metadata
    ├── scan-detect/                   Claude Vision edge detection
    └── ping/                          Weekly cron keep-alive
lib/
├── supabase.js, supabase-server.js, supabase-browser.js
├── books.js                           Query functions, language + year normalizers
├── pricing.js                         Multi-source price aggregator
├── ebay.js                            eBay Browse API client
└── cloudinary.js                      Signed upload/delete
middleware.js                          Session refresh + write-route auth gate
```

---

## Setup

### Requirements
- Node 20+
- A Supabase project
- API keys for the services you want: Anthropic, Cloudinary, Google Vision, eBay, Google Books (optional)

### Environment variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

ANTHROPIC_API_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

GOOGLE_VISION_API_KEY=

EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=

# Optional
ISBNDB_API_KEY=
CRON_SECRET=
```

Nothing else is required at runtime — every feature degrades gracefully when its key is missing (e.g. OCR falls back from Vision + Claude → Claude-only; pricing falls back from eBay → AbeBooks → Claude estimate).

### Database

Schema is created through SQL migrations run in the Supabase Dashboard. Core tables:

- `publishers` — name, country
- `authors` — full_name, sort_name, bio, photo_url, nationality, birth_year, notes
- `chefs` — same shape as authors, plus specialties, death_year, restaurants
- `restaurants` — name, city, country, cuisine, opened/closed years, description
- `books` — title, subtitle, ISBN-13/10, publisher_id, year, pages, format, language, country, condition, location (SF/PH), photographer, designer, illustrator, cover_image_url, estimated_value_usd, description, read_status, capture_method, notes
- `book_authors`, `book_chefs`, `book_restaurants` — many-to-many with order columns
- `book_images` — up to 4 photos per book, one flagged `is_cover`
- `value_history` — every price lookup with source and timestamp
- `tags`, `book_tags` — categorization / genre
- `collections`, `book_collections` — named shelves

RLS is enabled with public SELECT on all catalog tables. Writes are gated by the Next.js middleware, not by RLS, since the app uses the service-role key server-side.

### Run

```
npm install
npm run dev
```

Deploy to Vercel with the env vars above set at project level.

---

## Design notes

- All Supabase queries live in `lib/books.js` — never inline in pages
- Server components by default; `'use client'` only where interactivity requires it (barcode scanner, form editors, cover crop tool)
- The metadata enrichment paths always merge with "fill blanks only" semantics — automatic refreshes never overwrite fields you've manually set
- The BookEditor form re-syncs from the latest book data every time you open it, so background lookups (Auto Lookup, Refresh from APIs) can't be accidentally wiped by a stale save
- All AI prompts are tuned for cookbook-library cataloger tone: factual, no marketing language, cautious inference over fabrication

---

## License

Personal project — no license granted for reuse. If you're interested in a particular piece (the scanner, the pricing aggregator, the OCR-plus-enrichment pattern), open an issue.
