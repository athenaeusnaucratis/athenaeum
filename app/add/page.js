import AddBookFlow from './AddBookFlow'
import PageShell from '@/app/components/PageShell'
import { getSession } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function AddBookPage() {
  const user = await getSession()
  if (!user) redirect('/login')
  return (
    <PageShell active="/add">
      <style>{`
        .add-header {
          padding: 3.5rem 5rem 3rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.6s 0.1s ease both;
        }

        .add-eyebrow {
          font-family: var(--mono);
          font-size: 0.62rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--coral);
          margin-bottom: 0.8rem;
        }

        .add-title {
          font-family: var(--serif);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 300;
          font-style: italic;
          line-height: 1.1;
          color: var(--ink);
        }

        .add-subtitle {
          font-family: var(--mono);
          font-size: 0.65rem;
          color: var(--muted);
          letter-spacing: 0.1em;
          margin-top: 0.8rem;
        }

        /* ── FLOW ── */
        .flow-center {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.5rem;
          padding: 3rem 5rem;
          animation: fadeUp 0.5s 0.2s ease both;
        }

        .flow-hint {
          font-family: var(--mono);
          font-size: 0.7rem;
          font-weight: 300;
          color: var(--muted);
          letter-spacing: 0.06em;
        }

        .flow-buttons { display: flex; gap: 1rem; flex-wrap: wrap; }

        .flow-error {
          font-family: var(--mono);
          font-size: 0.7rem;
          color: var(--coral);
        }

        .flow-warning {
          font-family: var(--mono);
          font-size: 0.68rem;
          color: var(--muted);
          font-style: italic;
        }

        .flow-success {
          font-family: var(--serif);
          font-size: 1.2rem;
          font-style: italic;
          color: var(--ink);
        }

        /* ── SCANNER ── */
        .scanner-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.5rem;
          padding: 3rem 5rem;
          animation: fadeUp 0.5s 0.15s ease both;
        }

        .video-frame {
          position: relative;
          width: 100%;
          max-width: 480px;
          background: var(--warm-mid);
          border: 1px solid var(--rule);
          overflow: hidden;
        }

        .scanner-video { width: 100%; display: block; }

        .scan-line {
          position: absolute;
          left: 10%; right: 10%; top: 50%;
          height: 1px;
          background: var(--coral);
          opacity: 0.7;
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes scan { 0%, 100% { top: 30%; } 50% { top: 70%; } }

        /* ── FORM ── */
        .book-form {
          padding: 3rem 5rem 4rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 700px;
          animation: fadeUp 0.5s 0.15s ease both;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem 2.5rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .field:first-child { grid-column: 1 / -1; }

        .field label {
          font-family: var(--mono);
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .field input {
          font-family: var(--serif);
          font-size: 1rem;
          color: var(--ink);
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--rule);
          padding: 0.4rem 0;
          outline: none;
          transition: border-color 0.2s ease;
          width: 100%;
        }

        .field input:focus { border-bottom-color: var(--coral); }
        .field input::placeholder { color: var(--rule); }

        .cover-preview {
          width: 100px;
          border: 1px solid var(--rule);
        }

        .cover-section { margin-bottom: 0.5rem; }

        .cover-with-ocr {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }

        .cover-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .cover-upload-btn { display: inline-block; }

        .form-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        /* ── BUTTONS ── */
        .btn-primary {
          font-family: var(--mono);
          font-size: 0.65rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink);
          background: var(--coral);
          border: none;
          padding: 0.7rem 1.4rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: background 0.2s ease, opacity 0.2s;
        }
        .btn-primary:hover { opacity: 0.85; }

        .btn-secondary {
          font-family: var(--mono);
          font-size: 0.65rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink);
          background: transparent;
          border: 1px solid var(--rule);
          padding: 0.65rem 1.3rem;
          cursor: pointer;
          transition: border-color 0.2s ease, color 0.2s;
        }
        .btn-secondary:hover { border-color: var(--coral); color: var(--coral); }

        .btn-ghost {
          font-family: var(--mono);
          font-size: 0.62rem;
          font-weight: 300;
          letter-spacing: 0.06em;
          color: var(--muted);
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: color 0.15s;
        }
        .btn-ghost:hover { color: var(--ink); }

        @media (max-width: 768px) {
          .add-header { padding: 2rem 1.25rem; }
          .flow-center { padding: 2rem 1.25rem; }
          .scanner-wrap { padding: 2rem 1.25rem; }
          .book-form { padding: 2rem 1.25rem 3rem; }
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="add-header">
        <div className="add-eyebrow">New entry</div>
        <h1 className="add-title">Add Book</h1>
        <p className="add-subtitle">Scan barcode, photograph cover, or enter manually</p>
      </div>

      <AddBookFlow />
    </PageShell>
  )
}
