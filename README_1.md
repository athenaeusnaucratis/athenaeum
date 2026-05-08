# Athenaeum
### A Personal Cookbook Library — Built with Next.js + Supabase

---

## Overview

Athenaeum is a personal cookbook library management system built for a collection of 2,000+ cookbooks, many of which have no ISBN or barcode. The goal is to catalog, organize, and eventually contribute cookbook metadata to open platforms like Open Library, where cookbook coverage is sparse.

**Stack:** Next.js 16 · Supabase (PostgreSQL + Storage) · Vercel · Tailwind CSS  
**Design:** Editorial minimalist — Cormorant Garamond + DM Mono · Coral-orange accent (`#e8694a`) · Warm parchment background (`#f7f4ef`)

---

## What's Done

### Infrastructure
- [x] Supabase project initialized with PostgreSQL database
- [x] Next.js 16 project scaffolded and deployed on Vercel
- [x] Supabase client configured via environment variables (`.env.local`)
- [x] Row Level Security (RLS) policies set for public read access on all tables

### Database Schema
- [x] `publishers` table
- [x] `authors` table (with `full_name` and `sort_name`)
- [x] `books` table — full schema including ISBN, edition, condition, cover image URL, estimated value, Open Library tracking, JSONB metadata overflow, capture method
- [x] `book_authors` junction table (many-to-many with role and order)
- [x] Indexes on title, ISBN-13, ISBN-10, author sort name
- [x] Auto-updating `updated_at` trigger on books

### Data Import
- [x] iCollect Books CSV export analyzed (207 books, 69 columns)
- [x] Python import script written to map iCollect fields to schema
- [x] Data cleaned: integer types fixed, multi-currency values normalized
- [x] 4 CSVs generated and imported into Supabase:
  - `publishers_import.csv` — 134 publishers
  - `authors_import.csv` — 191 authors
  - `books_import.csv` — 207 books
  - `book_authors_import.csv` — 206 links

### Frontend
- [x] Main book list page (`/`) — title, author, year, estimated value
- [x] Book detail page (`/books/[id]`) — all fields in two-column grid layout
- [x] `lib/supabase.js` — Supabase client
- [x] `lib/books.js` — `getAllBooks()` and `getBookById()` query functions
- [x] Consistent editorial design system across pages
- [x] Back navigation from detail to list

---

## What's Next

### Phase 2 — Search & Filter
- [ ] Search bar — filter by title, author, publisher as you type (client component)
- [ ] Sort controls — by title, author, year, value (asc/desc)
- [ ] Filter by language, country, format, condition
- [ ] Pagination or infinite scroll for when collection grows to 2K+

### Phase 3 — Book Capture Workflow
- [ ] Barcode scanner — use device camera to scan ISBN barcodes (browser API)
- [ ] ISBN lookup — query Google Books API to auto-fill metadata on scan
- [ ] Cover photo upload — capture or upload image, store in Supabase Storage
- [ ] OCR from cover — send cover image to Google Vision API or Claude API to extract title/author/publisher for books without ISBN
- [ ] Manual entry form — add new books with no barcode and no cover
- [ ] Confirmation UI — review and correct auto-filled fields before saving

### Phase 4 — Enrichment
- [ ] Market value lookup — query eBay sold listings API for current value by ISBN
- [ ] Value history tracking — `value_history` table to record value over time
- [ ] Batch value refresh — update estimated values for multiple books at once
- [ ] Cuisine tagging — `cuisine_tags` and `book_cuisine_tags` tables, tag books by cuisine/region

### Phase 5 — Collection Management
- [ ] Collections / shelves — group books into named sets (e.g. "Ottoman Cuisine", "Signed Copies")
- [ ] Read status — mark books as unread / reading / read / reference
- [ ] Condition tracking — update condition field per book
- [ ] Notes editing — add/edit personal notes per book inline

### Phase 6 — Open Library Contribution
- [ ] Export record to Open Library format
- [ ] Submit via Open Library API — push verified records including cover image
- [ ] Track contribution status — `contributed_to_ol` flag + `open_library_id` stored per book
- [ ] Public read-only view — shareable URL for the full catalog

### Phase 7 — Scale & Polish
- [ ] Offline support — local-first storage with sync (IndexedDB / PWA)
- [ ] iOS PWA — installable on home screen
- [ ] Import more books — workflow for processing remaining ~1,800 books
- [ ] Cover image grid view — switch between table and grid layout
- [ ] Advanced search — full-text search across all fields

---

## Project Structure

```
athenaeum/
├── app/
│   ├── page.js                 # Main book list
│   └── books/
│       └── [id]/
│           └── page.js         # Book detail
├── lib/
│   ├── supabase.js             # Supabase client
│   └── books.js                # DB query functions
├── .env.local                  # Supabase credentials (not committed)
└── README.md
```

---

## Database Schema (Summary)

```
publishers      id, name, country, notes
authors         id, full_name, sort_name, nationality, notes
books           id, title, subtitle, isbn_13, isbn_10, publisher_id,
                publication_year, edition, printing_number, language,
                country_of_origin, page_count, format, dimensions,
                cover_image_url, cover_thumbnail_url, condition,
                estimated_value_usd, value_last_checked, open_library_id,
                contributed_to_ol, capture_method, metadata (JSONB), notes
book_authors    book_id, author_id, role, author_order
```

---

## Notes for Claude Code

- Design system is intentional — maintain Cormorant Garamond + DM Mono typography and the `#f7f4ef` / `#e8694a` color palette across all new components
- Server components are preferred — only use `'use client'` when interactivity requires it (search input, scanner, forms)
- All Supabase queries should live in `lib/books.js`, not inline in pages
- RLS is enabled — any new tables need explicit read policies added in Supabase
- The collection will grow to 2K+ books — keep performance in mind for queries and pagination
