import { getBookById, getBookTags, getBookCollections, getBooksByAuthor } from '@/lib/books'
import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import TagPicker from '@/app/components/TagPicker'
import ReadStatusPicker from '@/app/components/ReadStatusPicker'
import BookEditor from '@/app/components/BookEditor'
import ValuePanel from '@/app/components/ValuePanel'
import CollectionPicker from '@/app/components/CollectionPicker'
import DeleteBook from '@/app/components/DeleteBook'
import MetadataRefresh from '@/app/components/MetadataRefresh'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function BookPage({ params }) {
  const { id } = await params
  const [{ data: book, error }, { data: bookTags }, { data: bookCollections }] = await Promise.all([
    getBookById(id),
    getBookTags(id),
    getBookCollections(id),
  ])

  if (error || !book) return notFound()

  const authorList = book.authors?.map(a => a.authors).filter(Boolean) || []
  const authors = authorList.map(a => a.full_name).join(', ') || '—'
  const publisher = book.publishers?.name || '—'

  // Get related books by same author
  let relatedBooks = []
  if (book.authors?.[0]) {
    // Get author_id from book_authors
    const { data: ba } = await supabase
      .from('book_authors')
      .select('author_id')
      .eq('book_id', id)
      .limit(1)
      .maybeSingle()
    if (ba?.author_id) {
      const { data } = await getBooksByAuthor(ba.author_id)
      relatedBooks = (data || []).filter(b => b.id !== id).slice(0, 5)
    }
  }

  // Build tags for eyebrow
  const tagNames = bookTags?.map(bt => bt.tags?.name).filter(Boolean) || []

  return (
    <PageShell active="/collection">
      <style>{`
        /* ── BREADCRUMB ── */
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1.4rem 5rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.5s 0.05s ease both;
        }
        .breadcrumb a, .breadcrumb span {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
        }
        .breadcrumb a { color: var(--muted); transition: color 0.15s; }
        .breadcrumb a:hover { color: var(--ink); }
        .breadcrumb .sep { color: var(--rule); }
        .breadcrumb span.current { color: var(--coral); }

        /* ── DETAIL GRID ── */
        .detail-layout {
          display: grid;
          grid-template-columns: 380px 1fr;
          min-height: calc(100vh - 64px - 49px);
          border-bottom: 1px solid var(--rule);
        }

        /* ── COVER COLUMN ── */
        .cover-col {
          border-right: 1px solid var(--rule);
          display: flex;
          flex-direction: column;
          animation: fadeUp 0.6s 0.1s ease both;
        }

        .cover-wrap {
          padding: 3.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .book-cover-detail {
          width: 100%;
          max-width: 240px;
          aspect-ratio: 2/3;
          background: #1a1714;
          border: 1px solid var(--rule);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
          position: relative;
          box-shadow: 8px 8px 32px rgba(0,0,0,0.5);
          overflow: hidden;
        }

        .book-cover-detail img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-placeholder {
          font-family: var(--serif);
          font-size: 1rem;
          font-style: italic;
          color: var(--muted);
          line-height: 1.5;
        }

        .cover-no-image {
          position: absolute;
          bottom: 1rem;
          left: 0; right: 0;
          text-align: center;
          font-family: var(--mono);
          font-size: 0.55rem;
          letter-spacing: 0.12em;
          color: var(--rule);
          text-transform: uppercase;
        }

        .value-badge {
          width: 100%;
          max-width: 240px;
          border: 1px solid var(--rule);
          padding: 1rem 1.2rem;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
        }

        .value-label {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .value-amount {
          font-family: var(--serif);
          font-size: 1.5rem;
          font-weight: 300;
          color: var(--coral);
        }

        .cover-actions {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          width: 100%;
          max-width: 240px;
        }

        /* ── INFO COLUMN ── */
        .info-col {
          display: flex;
          flex-direction: column;
          animation: fadeUp 0.6s 0.2s ease both;
        }

        .title-block {
          padding: 3.5rem 4rem 3rem;
          border-bottom: 1px solid var(--rule);
        }

        .title-eyebrow {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--coral);
          margin-bottom: 1.2rem;
        }

        .book-title-main {
          font-family: var(--serif);
          font-size: clamp(2rem, 4vw, 3.5rem);
          font-weight: 300;
          line-height: 1.1;
          color: var(--ink);
          margin-bottom: 0.5rem;
        }

        .book-subtitle-main {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-weight: 300;
          font-style: italic;
          color: var(--muted);
          margin-bottom: 1.8rem;
        }

        .author-line {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .author-label {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .author-name-link {
          font-family: var(--serif);
          font-size: 1.1rem;
          font-weight: 400;
          color: var(--ink);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s, color 0.2s;
        }
        .author-name-link:hover { color: var(--coral); border-color: var(--coral); }

        /* Description */
        .desc-block {
          padding: 2rem 4rem;
          border-bottom: 1px solid var(--rule);
        }

        .desc-text {
          font-family: var(--serif);
          font-size: 1rem;
          font-weight: 300;
          font-style: italic;
          color: var(--muted);
          line-height: 1.8;
        }

        /* ── META GRID ── */
        .meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid var(--rule);
        }

        .meta-cell {
          padding: 1.8rem 4rem;
          border-right: 1px solid var(--rule);
          border-bottom: 1px solid var(--rule);
        }
        .meta-cell:nth-child(even) { border-right: none; }
        .meta-cell:nth-last-child(-n+2) { border-bottom: none; }
        .meta-cell.full-width { grid-column: 1 / -1; border-right: none; }

        .meta-key {
          font-family: var(--mono);
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--muted);
          margin-bottom: 0.5rem;
        }

        .meta-val {
          font-family: var(--serif);
          font-size: 1.05rem;
          font-weight: 400;
          color: var(--ink);
          line-height: 1.3;
        }
        .meta-val.mono-val {
          font-family: var(--mono);
          font-size: 0.8rem;
        }
        .meta-val.muted { color: var(--muted); font-style: italic; }

        /* ── INTERACTIVE SECTIONS (inside info-col) ── */
        .sections-wrap {
          padding: 0 4rem 3rem;
        }

        /* ── READ STATUS ── */
        .rs-wrap { margin-top: 2.5rem; }
        .rs-label {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted);
          margin-bottom: 0.75rem;
        }
        .rs-options { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .rs-btn {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 300;
          padding: 0.3rem 0.7rem;
          border: 1px solid var(--rule); background: transparent;
          color: var(--muted); cursor: pointer; transition: all 0.15s ease;
        }
        .rs-btn:hover { border-color: var(--ink); }
        .rs-btn.active { border-color: var(--coral); color: var(--coral); }

        /* ── VALUE PANEL ── */
        .value-panel { margin-top: 2.5rem; }
        .vp-label {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted);
          margin-bottom: 0.75rem;
        }
        .vp-current { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 0.75rem; }
        .vp-amount {
          font-family: var(--mono); font-size: 1.1rem; font-weight: 400; color: var(--coral);
        }
        .vp-no-value {
          font-family: var(--mono); font-size: 0.75rem; font-weight: 300; color: var(--muted);
        }
        .vp-checked {
          font-family: var(--mono); font-size: 0.55rem; font-weight: 300; color: var(--muted);
        }
        .vp-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .vp-btn {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 300;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted);
          background: transparent; border: 1px solid var(--rule); padding: 0.3rem 0.7rem;
          cursor: pointer; transition: all 0.15s ease;
        }
        .vp-btn:hover { border-color: var(--ink); color: var(--ink); }
        .vp-btn:disabled { opacity: 0.3; cursor: default; }
        .vp-message {
          font-family: var(--mono); font-size: 0.65rem; color: var(--muted); margin-top: 0.75rem;
        }
        .vp-manual {
          display: flex; gap: 0.5rem; align-items: flex-end; margin-top: 0.75rem;
        }
        .vp-manual input {
          font-family: var(--mono); font-size: 0.75rem; color: var(--ink);
          background: transparent; border: none; border-bottom: 1px solid var(--rule);
          padding: 0.3rem 0; outline: none; width: 100px;
        }
        .vp-manual input:focus { border-bottom-color: var(--coral); }
        .vp-manual button {
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.08em;
          text-transform: uppercase; color: var(--parchment); background: var(--coral);
          border: none; padding: 0.4rem 0.8rem; cursor: pointer;
        }
        .vp-manual button:hover { background: #c05530; }
        .vp-history { margin-top: 1.25rem; }
        .vp-hist-label {
          font-family: var(--mono); font-size: 0.55rem; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.5rem;
        }
        .vp-hist-table { width: 100%; max-width: 400px; border-collapse: collapse; }
        .vp-hist-table th {
          font-family: var(--mono); font-size: 0.55rem; font-weight: 400;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted);
          text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--rule);
        }
        .vp-hist-table td {
          font-family: var(--mono); font-size: 0.65rem; font-weight: 300;
          color: var(--muted); padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--rule);
        }
        .vp-hist-val { color: var(--ink); }
        .vp-empty {
          font-family: var(--serif); font-size: 0.9rem; font-style: italic; color: var(--muted);
        }

        /* ── METADATA REFRESH ── */
        .meta-refresh { margin-top: 2.5rem; }
        .mr-label {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted);
          margin-bottom: 0.75rem;
        }
        .mr-row { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
        .mr-msg { font-family: var(--mono); font-size: 0.65rem; color: var(--muted); }
        .mr-err { color: var(--coral); }

        /* ── COLLECTION PICKER ── */
        .collection-picker-wrap { margin-top: 2.5rem; }
        .cp-label {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted);
          margin-bottom: 0.75rem;
        }
        .cp-active { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
        .cp-chip {
          font-family: var(--mono); font-size: 0.65rem; font-weight: 400;
          padding: 0.3rem 0.7rem;
          border: 1px solid var(--rule); color: var(--muted);
        }
        .cp-chip.active { border-color: var(--coral); color: var(--coral); }
        .cp-toggle {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 300;
          color: var(--muted); background: transparent; border: none; cursor: pointer; padding: 0;
        }
        .cp-toggle:hover { color: var(--ink); }
        .cp-panel {
          margin-top: 1.5rem; padding: 1.5rem;
          border: 1px solid var(--rule); background: var(--warm-mid);
        }
        .cp-list { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .cp-item {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 300;
          padding: 0.3rem 0.7rem; border: 1px solid var(--rule);
          background: transparent; color: var(--muted); cursor: pointer;
          transition: all 0.15s ease;
        }
        .cp-item:hover { border-color: var(--ink); }
        .cp-item.selected { border-color: var(--coral); color: var(--coral); }
        .cp-new-form {
          display: flex; gap: 0.5rem; align-items: flex-end;
          margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid var(--rule);
        }
        .cp-new-form input {
          font-family: var(--mono); font-size: 0.7rem;
          color: var(--ink); background: transparent; border: none;
          border-bottom: 1px solid var(--rule); padding: 0.3rem 0;
          outline: none; width: 180px;
        }
        .cp-new-form input:focus { border-bottom-color: var(--coral); }
        .cp-new-form input::placeholder { color: var(--muted); }
        .cp-new-form button {
          font-family: var(--mono); font-size: 0.6rem;
          letter-spacing: 0.08em; text-transform: uppercase;
          color: var(--parchment); background: var(--coral); border: none;
          padding: 0.4rem 0.8rem; cursor: pointer;
        }
        .cp-new-form button:hover { background: #c05530; }

        /* ── TAG PICKER ── */
        .tag-wrap { margin-top: 2.5rem; }
        .tag-label {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted);
          margin-bottom: 0.75rem;
        }
        .tag-chips { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.75rem; }
        .tag {
          font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--muted);
          border: 1px solid var(--rule); padding: 0.25rem 0.6rem;
          cursor: pointer; transition: border-color 0.15s, color 0.15s;
        }
        .tag:hover { border-color: var(--coral); color: var(--coral); }

        /* ── EDITOR ── */
        .editor-panel { margin-top: 2.5rem; }
        .editor-error {
          font-family: var(--mono); font-size: 0.7rem; color: var(--coral); margin-bottom: 1rem;
        }
        .edit-btn {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 300;
          color: var(--muted); background: transparent; border: none; cursor: pointer; padding: 0;
          margin-top: 2.5rem;
        }
        .edit-btn:hover { color: var(--ink); }
        .editor-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem 2rem;
        }
        .editor-field { display: flex; flex-direction: column; gap: 0.3rem; }
        .editor-field.full { grid-column: 1 / -1; }
        .editor-field label {
          font-family: var(--mono); font-size: 0.55rem; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted);
        }
        .editor-field input, .editor-field textarea {
          font-family: var(--serif); font-size: 1rem; color: var(--ink);
          background: transparent; border: none; border-bottom: 1px solid var(--rule);
          padding: 0.3rem 0; outline: none; width: 100%;
          transition: border-color 0.15s ease;
        }
        .editor-field textarea {
          border: 1px solid var(--rule); padding: 0.5rem; resize: vertical;
          font-size: 0.95rem; line-height: 1.5;
        }
        .editor-field select {
          font-family: var(--serif); font-size: 1rem; color: var(--ink);
          background: var(--parchment); border: none; border-bottom: 1px solid var(--rule);
          padding: 0.3rem 0; outline: none; width: 100%;
        }
        .editor-field input:focus, .editor-field textarea:focus, .editor-field select:focus {
          border-color: var(--coral);
        }
        .editor-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
        .save-btn {
          font-family: var(--mono); font-size: 0.65rem; font-weight: 400;
          letter-spacing: 0.08em; text-transform: uppercase; color: var(--parchment);
          background: var(--coral); border: none; padding: 0.6rem 1.2rem; cursor: pointer;
          transition: background 0.15s ease;
        }
        .save-btn:hover { background: #c05530; }
        .save-btn:disabled { opacity: 0.4; cursor: default; }
        .cancel-btn {
          font-family: var(--mono); font-size: 0.65rem; font-weight: 300;
          color: var(--muted); background: transparent; border: none; cursor: pointer; padding: 0;
        }
        .cancel-btn:hover { color: var(--ink); }

        /* ── NOTES ── */
        .notes-section {
          padding: 2.5rem 4rem;
          border-top: 1px solid var(--rule);
        }
        .notes-label {
          font-family: var(--mono); font-size: 0.6rem;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 1rem;
        }
        .notes-body {
          font-family: var(--serif); font-size: 1rem; font-weight: 300;
          font-style: italic; color: var(--muted); line-height: 1.8;
        }

        /* ── DELETE ── */
        .delete-wrap {
          margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--rule);
          display: flex; align-items: center; gap: 1rem;
        }
        .delete-btn {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 300;
          color: var(--muted); background: transparent; border: none; cursor: pointer; padding: 0;
          transition: color 0.15s ease;
        }
        .delete-btn:hover { color: var(--coral); }
        .delete-confirm-text {
          font-family: var(--mono); font-size: 0.65rem; font-weight: 300; color: var(--muted);
        }
        .delete-yes {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 400;
          color: var(--parchment); background: var(--coral); border: none;
          padding: 0.35rem 0.7rem; cursor: pointer;
        }
        .delete-yes:disabled { opacity: 0.5; cursor: default; }
        .delete-no {
          font-family: var(--mono); font-size: 0.6rem; font-weight: 300;
          color: var(--muted); background: transparent; border: none; cursor: pointer; padding: 0;
        }
        .delete-no:hover { color: var(--ink); }

        /* ── RELATED BOOKS ── */
        .related {
          border-top: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.35s ease both;
        }
        .related-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          padding: 2rem 5rem 1.5rem;
          border-bottom: 1px solid var(--rule);
        }
        .related-title {
          font-family: var(--serif);
          font-size: 1.2rem;
          font-style: italic;
          font-weight: 300;
          color: var(--ink);
        }
        .related-link {
          font-family: var(--mono);
          font-size: 0.6rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--coral);
          text-decoration: none;
        }
        .related-books {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          border-bottom: 1px solid var(--rule);
        }
        .related-card {
          padding: 2rem 2rem 2.5rem;
          border-right: 1px solid var(--rule);
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          text-decoration: none;
          color: inherit;
        }
        .related-card:last-child { border-right: none; }
        .related-card:hover { background: var(--warm-mid); }
        .related-cover {
          width: 100%;
          aspect-ratio: 2/3;
          border: 1px solid var(--rule);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.8rem;
          text-align: center;
          overflow: hidden;
        }
        .related-cover img {
          width: 100%; height: 100%; object-fit: cover;
        }
        .related-card:nth-child(1) .related-cover { background: #1f1d18; }
        .related-card:nth-child(2) .related-cover { background: #181c18; }
        .related-card:nth-child(3) .related-cover { background: #1e1816; }
        .related-card:nth-child(4) .related-cover { background: #161a1e; }
        .related-card:nth-child(5) .related-cover { background: #1c1b16; }
        .related-cover-text {
          font-family: var(--serif);
          font-size: 0.65rem;
          font-style: italic;
          color: var(--muted);
          line-height: 1.4;
        }
        .related-book-title {
          font-family: var(--serif);
          font-size: 0.82rem;
          color: var(--ink);
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color 0.15s;
        }
        .related-card:hover .related-book-title { color: var(--coral); }
        .related-book-author {
          font-family: var(--mono);
          font-size: 0.58rem;
          color: var(--muted);
          letter-spacing: 0.04em;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .detail-layout { grid-template-columns: 1fr; }
          .cover-col { border-right: none; border-bottom: 1px solid var(--rule); }
          .cover-wrap { flex-direction: row; flex-wrap: wrap; justify-content: center; padding: 2rem; }
          .breadcrumb { padding: 1rem 1.25rem; }
          .title-block { padding: 2rem 1.25rem; }
          .meta-grid { grid-template-columns: 1fr; }
          .meta-cell { border-right: none !important; }
          .sections-wrap { padding: 0 1.25rem 2rem; }
          .notes-section { padding: 2rem 1.25rem; }
          .related-header { padding: 1.5rem 1.25rem; }
          .related-books { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 640px) {
          .related-books { grid-template-columns: repeat(2, 1fr); }
          .related-card:nth-child(n+5) { display: none; }
        }
      `}</style>

      {/* BREADCRUMB */}
      <div className="breadcrumb">
        <Link href="/collection">Books</Link>
        <span className="sep">/</span>
        <span className="current">{book.title}</span>
      </div>

      {/* MAIN DETAIL GRID */}
      <div className="detail-layout">

        {/* LEFT: COVER */}
        <div className="cover-col">
          <div className="cover-wrap">
            <div className="book-cover-detail">
              {book.cover_image_url ? (
                <img src={book.cover_image_url} alt={book.title} />
              ) : (
                <>
                  <span className="cover-placeholder">{book.title}</span>
                  <span className="cover-no-image">No cover image</span>
                </>
              )}
            </div>

            <div className="value-badge">
              <span className="value-label">Est. value</span>
              <span className="value-amount">
                {book.estimated_value_usd
                  ? `$${Number(book.estimated_value_usd).toFixed(2)}`
                  : '—'}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: INFO */}
        <div className="info-col">
          <div className="title-block">
            {tagNames.length > 0 && (
              <div className="title-eyebrow">{tagNames.join(' · ')}</div>
            )}
            <h1 className="book-title-main">{book.title}</h1>
            {book.subtitle && <p className="book-subtitle-main">{book.subtitle}</p>}
            <div className="author-line">
              <span className="author-label">by</span>
              {book.authors?.[0] ? (
                <span className="author-name-link">{authors}</span>
              ) : (
                <span style={{ color: 'var(--muted)', fontFamily: 'var(--serif)', fontSize: '1.1rem' }}>—</span>
              )}
            </div>
          </div>

          {book.description && (
            <div className="desc-block">
              <p className="desc-text">{book.description}</p>
            </div>
          )}

          <div className="meta-grid">
            <div className="meta-cell">
              <div className="meta-key">Published</div>
              <div className="meta-val">{book.publication_year ?? '—'}</div>
            </div>
            <div className="meta-cell">
              <div className="meta-key">Publisher</div>
              <div className="meta-val">{publisher}</div>
            </div>
            <div className="meta-cell">
              <div className="meta-key">Language</div>
              <div className="meta-val">{book.language ?? '—'}</div>
            </div>
            <div className="meta-cell">
              <div className="meta-key">ISBN</div>
              <div className="meta-val mono-val">{book.isbn_13 || book.isbn_10 || '—'}</div>
            </div>
            <div className="meta-cell">
              <div className="meta-key">Format</div>
              <div className="meta-val">{book.format ?? '—'}</div>
            </div>
            <div className="meta-cell">
              <div className="meta-key">Pages</div>
              <div className="meta-val">{book.page_count ?? '—'}</div>
            </div>
            <div className="meta-cell">
              <div className="meta-key">Condition</div>
              <div className="meta-val">{book.condition ?? '—'}</div>
            </div>
            <div className="meta-cell">
              <div className="meta-key">Country</div>
              <div className="meta-val">{book.country_of_origin ?? '—'}</div>
            </div>
          </div>

          {book.notes && (
            <div className="notes-section">
              <div className="notes-label">Notes</div>
              <p className="notes-body">{book.notes}</p>
            </div>
          )}

          <div className="sections-wrap">
            <ReadStatusPicker bookId={id} initialStatus={book.read_status} />
            <ValuePanel bookId={id} currentValue={book.estimated_value_usd} lastChecked={book.value_last_checked} />
            <MetadataRefresh bookId={id} />
            <CollectionPicker bookId={id} initialCollections={bookCollections} />
            <TagPicker bookId={id} initialTags={bookTags} />
            <BookEditor book={book} authors={authors} publisher={publisher} />
            <DeleteBook bookId={id} />
          </div>
        </div>
      </div>

      {/* RELATED BOOKS */}
      {relatedBooks.length > 0 && (
        <div className="related">
          <div className="related-header">
            <span className="related-title">More by {authorList[0]?.full_name}</span>
            <Link href="/collection" className="related-link">View all →</Link>
          </div>
          <div className="related-books">
            {relatedBooks.map(rb => (
              <Link key={rb.id} href={`/books/${rb.id}`} className="related-card">
                <div className="related-cover">
                  {rb.cover_image_url ? (
                    <img src={rb.cover_image_url} alt="" />
                  ) : (
                    <span className="related-cover-text">{rb.title}</span>
                  )}
                </div>
                <div className="related-book-title">{rb.title}</div>
                <div className="related-book-author">{authorList[0]?.full_name}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  )
}
