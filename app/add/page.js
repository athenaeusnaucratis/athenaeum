import AddBookFlow from './AddBookFlow'
import PageShell from '@/app/components/PageShell'

export default function AddBookPage() {
  return (
    <PageShell active="/add">
      <style>{`
        .add-header {
          margin-top: 2.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e0e0e0;
        }

        /* ── FLOW ── */
        .flow-center {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.5rem;
          margin-top: 3rem;
        }

        .flow-hint {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 300;
          color: #999;
        }

        .flow-buttons { display: flex; gap: 1rem; flex-wrap: wrap; }
        .flow-error { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: #c45a3c; }
        .flow-success {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.2rem; font-style: italic; color: #666;
        }

        /* ── SCANNER ── */
        .scanner-wrap {
          display: flex; flex-direction: column; align-items: flex-start;
          gap: 1.5rem; margin-top: 3rem;
        }
        .video-frame {
          position: relative; width: 100%; max-width: 480px;
          background: #2c2c2c; overflow: hidden;
        }
        .scanner-video { width: 100%; display: block; }
        .scan-line {
          position: absolute; left: 10%; right: 10%; top: 50%;
          height: 1px; background: #c45a3c; opacity: 0.7;
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes scan { 0%, 100% { top: 30%; } 50% { top: 70%; } }

        /* ── FORM ── */
        .book-form {
          margin-top: 3rem; display: flex; flex-direction: column;
          gap: 2rem; max-width: 640px;
        }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem 2rem; }
        .field { display: flex; flex-direction: column; gap: 0.35rem; }
        .field:first-child { grid-column: 1 / -1; }
        .field label {
          font-family: 'DM Mono', monospace; font-size: 0.6rem; font-weight: 400;
          letter-spacing: 0.08em; text-transform: uppercase; color: #999;
        }
        .field input {
          font-family: 'Cormorant Garamond', serif; font-size: 1rem; color: #2c2c2c;
          background: transparent; border: none; border-bottom: 1px solid #e0e0e0;
          padding: 0.35rem 0; outline: none; transition: border-color 0.15s ease; width: 100%;
        }
        .field input:focus { border-bottom-color: #2c2c2c; }
        .field input::placeholder { color: #ccc; }
        .cover-preview { width: 100px; }
        .cover-section { margin-bottom: 0.5rem; }
        .cover-with-ocr { display: flex; gap: 1.5rem; align-items: flex-start; }
        .cover-actions { display: flex; flex-direction: column; gap: 0.75rem; }
        .cover-upload-btn { display: inline-block; }
        .form-actions { display: flex; gap: 1rem; }

        /* ── BUTTONS ── */
        .btn-primary {
          font-family: 'DM Mono', monospace; font-size: 0.7rem; font-weight: 400;
          letter-spacing: 0.06em; text-transform: uppercase; color: #fff;
          background: #2c2c2c; border: none; padding: 0.6rem 1.2rem; cursor: pointer;
          text-decoration: none; display: inline-block; transition: background 0.15s ease;
        }
        .btn-primary:hover { background: #c45a3c; }
        .btn-secondary {
          font-family: 'DM Mono', monospace; font-size: 0.7rem; font-weight: 400;
          letter-spacing: 0.06em; text-transform: uppercase; color: #2c2c2c;
          background: transparent; border: 1px solid #e0e0e0; padding: 0.6rem 1.2rem;
          cursor: pointer; transition: border-color 0.15s ease;
        }
        .btn-secondary:hover { border-color: #2c2c2c; }
        .btn-ghost {
          font-family: 'DM Mono', monospace; font-size: 0.65rem; font-weight: 300;
          color: #999; background: transparent; border: none; padding: 0; cursor: pointer;
        }
        .btn-ghost:hover { color: #2c2c2c; }
      `}</style>

      <div className="add-header">
        <h1 className="page-title">Add Book</h1>
        <p className="page-subtitle">Scan barcode or enter manually</p>
      </div>

      <AddBookFlow />
    </PageShell>
  )
}
