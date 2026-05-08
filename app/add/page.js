import Link from 'next/link'
import AddBookFlow from './AddBookFlow'

export default function AddBookPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background-color: #f7f4ef; color: #1a1814; }

        .page {
          min-height: 100vh;
          padding: 0 2.5rem 4rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header {
          padding: 3rem 0 2rem;
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

        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          font-weight: 600;
          line-height: 1.1;
          letter-spacing: -0.02em;
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
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9c8e7e;
        }

        .flow-buttons {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .flow-error {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: #c0392b;
        }

        .flow-success {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem;
          font-style: italic;
          color: #4a443c;
        }

        /* ── SCANNER ── */
        .scanner-wrap {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.5rem;
          margin-top: 3rem;
        }

        .video-frame {
          position: relative;
          width: 100%;
          max-width: 480px;
          background: #1a1814;
          border-radius: 2px;
          overflow: hidden;
        }

        .scanner-video {
          width: 100%;
          display: block;
        }

        .scan-line {
          position: absolute;
          left: 10%;
          right: 10%;
          top: 50%;
          height: 2px;
          background: #e8694a;
          opacity: 0.8;
          animation: scan 2s ease-in-out infinite;
        }

        @keyframes scan {
          0%, 100% { top: 30%; }
          50% { top: 70%; }
        }

        /* ── FORM ── */
        .book-form {
          margin-top: 3rem;
          display: flex;
          flex-direction: column;
          gap: 2rem;
          max-width: 640px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem 2rem;
        }

        .field {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .field:first-child {
          grid-column: 1 / -1;
        }

        .field label {
          font-family: 'DM Mono', monospace;
          font-size: 0.6rem;
          font-weight: 400;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #9c8e7e;
        }

        .field input {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          color: #1a1814;
          background: transparent;
          border: none;
          border-bottom: 1px solid #d4cfc8;
          padding: 0.35rem 0;
          outline: none;
          transition: border-color 0.15s ease;
          width: 100%;
        }

        .field input:focus { border-bottom-color: #e8694a; }
        .field input::placeholder { color: #c8c2ba; }

        .cover-preview {
          width: 100px;
          border-radius: 2px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
        }

        /* ── BUTTONS ── */
        .btn-primary {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #f7f4ef;
          background: #1a1814;
          border: none;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          text-decoration: none;
          display: inline-block;
          transition: background 0.15s ease;
        }
        .btn-primary:hover { background: #e8694a; }

        .btn-secondary {
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1a1814;
          background: transparent;
          border: 1px solid #d4cfc8;
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: border-color 0.15s ease;
        }
        .btn-secondary:hover { border-color: #1a1814; }

        .btn-ghost {
          font-family: 'DM Mono', monospace;
          font-size: 0.65rem;
          font-weight: 300;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #9c8e7e;
          background: transparent;
          border: none;
          padding: 0;
          cursor: pointer;
        }
        .btn-ghost:hover { color: #1a1814; }
      `}</style>

      <div className="page">
        <header className="header">
          <Link href="/" className="back-link">← Athenaeum</Link>
          <h1 className="page-title">Add Book</h1>
        </header>

        <AddBookFlow />
      </div>
    </>
  )
}
