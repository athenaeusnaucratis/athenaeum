import { getBookById, getBookTags, getBookCollections } from '@/lib/books'
import PageShell from '@/app/components/PageShell'
import TagPicker from '@/app/components/TagPicker'
import CollectionPicker from '@/app/components/CollectionPicker'
import ReadStatusPicker from '@/app/components/ReadStatusPicker'
import BookEditor from '@/app/components/BookEditor'
import ValuePanel from '@/app/components/ValuePanel'
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

  const authors = book.authors?.map(a => a.authors?.full_name).filter(Boolean).join(', ') || '—'
  const publisher = book.publishers?.name || '—'

  return (
    <PageShell active="/collection">
      <style>{`
        .book-header {
          margin-top: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid #d4cfc8;
        }

        .back-link {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 300;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9c8e7e;
          text-decoration: none;
          display: inline-block;
          margin-bottom: 1.5rem;
        }
        .back-link:hover { color: #1a1814; }

        .book-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem; font-weight: 600; line-height: 1.1;
          letter-spacing: -0.02em; color: #1a1814;
        }
        .book-subtitle {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem; font-style: italic; color: #9c8e7e; margin-top: 0.4rem;
        }
        .book-author {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem; color: #4a443c; margin-top: 0.75rem;
        }

        .book-header-layout { display: flex; gap: 2rem; }
        .book-cover {
          width: 140px; flex-shrink: 0; border-radius: 2px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.15);
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 2rem; margin-top: 3rem;
        }
        .detail-item label {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase; color: #9c8e7e;
          display: block; margin-bottom: 0.35rem;
        }
        .detail-item span {
          font-family: 'Cormorant Garamond', serif; font-size: 1rem; color: #1a1814;
        }
        .detail-item span.mono {
          font-family: 'DM Mono', monospace; font-size: 0.8rem; font-weight: 300;
        }
        .detail-item span.value {
          font-family: 'DM Mono', monospace; font-size: 0.8rem; color: #e8694a;
        }

        .notes-section {
          margin-top: 3rem; padding-top: 2rem; border-top: 1px solid #d4cfc8;
        }
        .notes-section label {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase; color: #9c8e7e;
          display: block; margin-bottom: 0.75rem;
        }
        .notes-section p {
          font-family: 'Cormorant Garamond', serif; font-size: 1rem;
          line-height: 1.6; color: #4a443c;
        }

        /* ── EDITOR ── */
        .edit-btn {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 300;
          letter-spacing: 0.1em; text-transform: uppercase; color: #9c8e7e;
          background: transparent; border: none; cursor: pointer; padding: 0;
          margin-top: 2.5rem;
        }
        .edit-btn:hover { color: #1a1814; }

        .editor-panel { margin-top: 2.5rem; }
        .editor-error {
          font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #c0392b;
          margin-bottom: 1rem;
        }
        .editor-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem 2rem;
        }
        .editor-field { display: flex; flex-direction: column; gap: 0.35rem; }
        .editor-field.full { grid-column: 1 / -1; }
        .editor-field label {
          font-family: 'DM Mono', monospace; font-size: 0.55rem; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase; color: #9c8e7e;
        }
        .editor-field input, .editor-field textarea {
          font-family: 'Cormorant Garamond', serif; font-size: 1rem; color: #1a1814;
          background: transparent; border: none; border-bottom: 1px solid #d4cfc8;
          padding: 0.3rem 0; outline: none; width: 100%;
          transition: border-color 0.15s ease;
        }
        .editor-field textarea {
          border: 1px solid #d4cfc8; padding: 0.5rem; resize: vertical;
          font-size: 0.95rem; line-height: 1.5;
        }
        .editor-field select {
          font-family: 'Cormorant Garamond', serif; font-size: 1rem; color: #1a1814;
          background: transparent; border: none; border-bottom: 1px solid #d4cfc8;
          padding: 0.3rem 0; outline: none; width: 100%;
        }
        .editor-field input:focus, .editor-field textarea:focus, .editor-field select:focus { border-color: #e8694a; }
        .editor-actions { display: flex; gap: 1rem; margin-top: 1.5rem; }
        .save-btn {
          font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase; color: #f7f4ef;
          background: #1a1814; border: none; padding: 0.6rem 1.2rem; cursor: pointer;
          transition: background 0.15s ease;
        }
        .save-btn:hover { background: #e8694a; }
        .save-btn:disabled { opacity: 0.5; cursor: default; }
        .cancel-btn {
          font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 300;
          letter-spacing: 0.1em; text-transform: uppercase; color: #9c8e7e;
          background: transparent; border: none; cursor: pointer; padding: 0;
        }
        .cancel-btn:hover { color: #1a1814; }

        /* ── COLLECTION PICKER ── */
        .collection-picker-wrap { margin-top: 2.5rem; }
        .cp-label {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase; color: #9c8e7e;
          margin-bottom: 0.75rem;
        }
        .cp-active { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
        .cp-chip {
          font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 400;
          letter-spacing: 0.08em; padding: 0.35rem 0.8rem;
          border: 1px solid #d4cfc8; color: #4a443c;
        }
        .cp-chip.active { border-color: #1a1814; color: #1a1814; }
        .cp-toggle {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 300;
          letter-spacing: 0.1em; text-transform: uppercase; color: #9c8e7e;
          background: transparent; border: none; cursor: pointer; padding: 0;
        }
        .cp-toggle:hover { color: #1a1814; }
        .cp-panel {
          margin-top: 1.5rem; padding: 1.5rem;
          border: 1px solid #d4cfc8; background: #faf8f4;
        }
        .cp-list { display: flex; flex-wrap: wrap; gap: 0.4rem; }
        .cp-item {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 300;
          padding: 0.3rem 0.7rem; border: 1px solid #d4cfc8;
          background: transparent; color: #6b6058; cursor: pointer;
          transition: all 0.15s ease;
        }
        .cp-item:hover { border-color: #1a1814; }
        .cp-item.selected { border-color: #1a1814; color: #1a1814; background: rgba(26,24,20,0.03); }
        .cp-new-form {
          display: flex; gap: 0.5rem; align-items: flex-end;
          margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #e8e4de;
        }
        .cp-new-form input {
          font-family: 'DM Mono', monospace; font-size: 0.7rem;
          color: #1a1814; background: transparent; border: none;
          border-bottom: 1px solid #d4cfc8; padding: 0.3rem 0;
          outline: none; width: 180px;
        }
        .cp-new-form input:focus { border-bottom-color: #e8694a; }
        .cp-new-form input::placeholder { color: #c8c2ba; }
        .cp-new-form button {
          font-family: 'DM Mono', monospace; font-size: 0.6rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: #f7f4ef; background: #1a1814; border: none;
          padding: 0.4rem 0.8rem; cursor: pointer;
        }
        .cp-new-form button:hover { background: #e8694a; }

        /* ── READ STATUS ── */
        .rs-wrap { margin-top: 2.5rem; }
        .rs-label {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase; color: #9c8e7e;
          margin-bottom: 0.75rem;
        }
        .rs-options { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .rs-btn {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 300;
          letter-spacing: 0.08em; padding: 0.35rem 0.8rem;
          border: 1px solid #d4cfc8; background: transparent;
          color: #6b6058; cursor: pointer; transition: all 0.15s ease;
        }
        .rs-btn:hover { border-color: #1a1814; }
        .rs-btn.active { border-color: #e8694a; color: #e8694a; background: rgba(232,105,74,0.05); }

        /* ── VALUE PANEL ── */
        .value-panel { margin-top: 2.5rem; }
        .vp-label {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase; color: #9c8e7e;
          margin-bottom: 0.75rem;
        }
        .vp-current { display: flex; align-items: baseline; gap: 1rem; margin-bottom: 0.75rem; }
        .vp-amount {
          font-family: 'DM Mono', monospace; font-size: 1.2rem; font-weight: 400; color: #e8694a;
        }
        .vp-no-value {
          font-family: 'DM Mono', monospace; font-size: 0.75rem; font-weight: 300; color: #c8c2ba;
        }
        .vp-checked {
          font-family: 'DM Mono', monospace; font-size: 0.55rem; font-weight: 300; color: #9c8e7e;
        }
        .vp-actions { display: flex; gap: 0.75rem; flex-wrap: wrap; }
        .vp-btn {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 300;
          letter-spacing: 0.08em; text-transform: uppercase; color: #9c8e7e;
          background: transparent; border: 1px solid #d4cfc8; padding: 0.3rem 0.7rem;
          cursor: pointer; transition: all 0.15s ease;
        }
        .vp-btn:hover { border-color: #1a1814; color: #1a1814; }
        .vp-btn:disabled { opacity: 0.4; cursor: default; }
        .vp-message {
          font-family: 'DM Mono', monospace; font-size: 0.65rem; color: #4a443c; margin-top: 0.75rem;
        }
        .vp-manual {
          display: flex; gap: 0.5rem; align-items: flex-end; margin-top: 0.75rem;
        }
        .vp-manual input {
          font-family: 'DM Mono', monospace; font-size: 0.75rem; color: #1a1814;
          background: transparent; border: none; border-bottom: 1px solid #d4cfc8;
          padding: 0.3rem 0; outline: none; width: 100px;
        }
        .vp-manual input:focus { border-bottom-color: #e8694a; }
        .vp-manual button {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: #f7f4ef; background: #1a1814;
          border: none; padding: 0.4rem 0.8rem; cursor: pointer;
        }
        .vp-manual button:hover { background: #e8694a; }
        .vp-history { margin-top: 1.25rem; }
        .vp-hist-label {
          font-family: 'DM Mono', monospace; font-size: 0.55rem; font-weight: 400;
          letter-spacing: 0.14em; text-transform: uppercase; color: #9c8e7e; margin-bottom: 0.5rem;
        }
        .vp-hist-table { width: 100%; max-width: 400px; border-collapse: collapse; }
        .vp-hist-table th {
          font-family: 'DM Mono', monospace; font-size: 0.55rem; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase; color: #9c8e7e;
          text-align: left; padding: 0.4rem 0.5rem; border-bottom: 1px solid #d4cfc8;
        }
        .vp-hist-table td {
          font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 300;
          color: #4a443c; padding: 0.4rem 0.5rem; border-bottom: 1px solid #e8e4de;
        }
        .vp-hist-val { color: #e8694a; }
        .vp-empty {
          font-family: 'Cormorant Garamond', serif; font-size: 0.9rem; font-style: italic; color: #9c8e7e;
        }
      `}</style>

      <div className="book-header">
        <Link href="/collection" className="back-link">← Collection</Link>
        <div className="book-header-layout">
          {book.cover_image_url && (
            <img src={book.cover_image_url} alt={book.title} className="book-cover" />
          )}
          <div>
            <h1 className="book-title">{book.title}</h1>
            {book.subtitle && <p className="book-subtitle">{book.subtitle}</p>}
            <p className="book-author">{authors}</p>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-item">
          <label>Publisher</label>
          <span>{publisher}</span>
        </div>
        <div className="detail-item">
          <label>Year</label>
          <span className="mono">{book.publication_year ?? '—'}</span>
        </div>
        {book.edition && (
          <div className="detail-item">
            <label>Edition</label>
            <span className="mono">{book.edition}</span>
          </div>
        )}
        {book.printing_number && (
          <div className="detail-item">
            <label>Printing</label>
            <span className="mono">{book.printing_number}</span>
          </div>
        )}
        <div className="detail-item">
          <label>Format</label>
          <span>{book.format ?? '—'}</span>
        </div>
        <div className="detail-item">
          <label>Pages</label>
          <span className="mono">{book.page_count ?? '—'}</span>
        </div>
        <div className="detail-item">
          <label>Language</label>
          <span>{book.language ?? '—'}</span>
        </div>
        <div className="detail-item">
          <label>Country</label>
          <span>{book.country_of_origin ?? '—'}</span>
        </div>
        <div className="detail-item">
          <label>Condition</label>
          <span>{book.condition ?? '—'}</span>
        </div>
        {book.dimensions && (
          <div className="detail-item">
            <label>Dimensions</label>
            <span className="mono">{book.dimensions}</span>
          </div>
        )}
        {book.isbn_13 && (
          <div className="detail-item">
            <label>ISBN-13</label>
            <span className="mono">{book.isbn_13}</span>
          </div>
        )}
        {book.isbn_10 && (
          <div className="detail-item">
            <label>ISBN-10</label>
            <span className="mono">{book.isbn_10}</span>
          </div>
        )}
        <div className="detail-item">
          <label>Est. Value</label>
          {book.estimated_value_usd
            ? <span className="value">${Number(book.estimated_value_usd).toFixed(2)}</span>
            : <span className="mono" style={{ color: '#c8c2ba' }}>—</span>
          }
        </div>
      </div>

      <ReadStatusPicker bookId={id} initialStatus={book.read_status} />

      <ValuePanel bookId={id} currentValue={book.estimated_value_usd} lastChecked={book.value_last_checked} />

      <CollectionPicker bookId={id} initialCollections={bookCollections} />

      <TagPicker bookId={id} initialTags={bookTags} />

      <BookEditor book={book} authors={authors} publisher={publisher} />

      {book.notes && (
        <div className="notes-section">
          <label>Notes</label>
          <p>{book.notes}</p>
        </div>
      )}
    </PageShell>
  )
}
