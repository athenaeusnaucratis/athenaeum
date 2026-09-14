import PageShell from '@/app/components/PageShell'
import Link from 'next/link'

export const metadata = {
  title: 'About · Athenaeum Deipnon',
  description: 'About the library, how the catalog is built, and how to reach the curator.',
}

export default function AboutPage() {
  return (
    <PageShell active="/about">
      <style>{`
        .about-header {
          padding: 4rem 5rem 3rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.5s ease both;
        }
        .about-eyebrow {
          font-family: var(--mono); font-size: 0.62rem;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--coral); margin-bottom: 0.8rem;
        }
        .about-title {
          font-family: var(--serif);
          font-size: clamp(2.4rem, 4.5vw, 3.6rem);
          font-weight: 300; font-style: italic;
          line-height: 1.05; color: var(--ink);
        }
        .about-lead {
          font-family: var(--serif); font-style: italic;
          font-size: 1.1rem; color: var(--muted);
          line-height: 1.6; max-width: 68ch;
          margin-top: 1.2rem;
        }

        .about-toc {
          padding: 1.5rem 5rem;
          border-bottom: 1px solid var(--rule);
          display: flex; gap: 2rem; flex-wrap: wrap;
        }
        .about-toc a {
          font-family: var(--mono); font-size: 0.62rem;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--muted); text-decoration: none;
          transition: color 0.15s;
        }
        .about-toc a:hover { color: var(--coral); }

        .about-section {
          padding: 3.5rem 5rem;
          border-bottom: 1px solid var(--rule);
          animation: fadeUp 0.5s ease both;
        }
        .about-section h2 {
          font-family: var(--serif);
          font-size: 1.9rem; font-weight: 300;
          color: var(--ink); margin: 0 0 1rem;
          scroll-margin-top: 80px;
        }
        .about-section .kicker {
          font-family: var(--mono); font-size: 0.6rem;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--coral); margin-bottom: 0.5rem;
        }
        .about-section p {
          font-family: var(--serif); font-size: 1rem;
          line-height: 1.75; color: var(--muted);
          max-width: 72ch; margin: 0 0 1.1rem;
        }
        .about-section p strong { color: var(--ink); font-weight: 500; }
        .about-section ul {
          font-family: var(--serif); font-size: 0.98rem;
          line-height: 1.75; color: var(--muted);
          max-width: 72ch; padding-left: 1.2rem; margin: 0 0 1.1rem;
        }
        .about-section li { margin-bottom: 0.5rem; }
        .about-section li strong { color: var(--ink); font-weight: 500; }
        .about-section a {
          color: var(--coral); text-decoration: none;
          border-bottom: 1px dotted var(--coral);
        }
        .about-section a:hover { color: var(--ink); border-bottom-color: var(--ink); }

        .contact-card {
          border: 1px solid var(--rule);
          padding: 2rem 2.5rem;
          margin-top: 1.5rem; max-width: 480px;
          background: var(--warm-mid);
        }
        .contact-label {
          font-family: var(--mono); font-size: 0.58rem;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 0.5rem;
        }
        .contact-value {
          font-family: var(--serif); font-size: 1.3rem;
          font-style: italic; color: var(--coral);
        }
        .contact-value a { color: var(--coral); border-bottom: none; }
        .contact-value a:hover { color: var(--ink); }

        @media (max-width: 768px) {
          .about-header, .about-toc, .about-section { padding-left: 1.25rem; padding-right: 1.25rem; }
          .about-toc { gap: 1rem; }
        }
      `}</style>

      <div className="about-header">
        <div className="about-eyebrow">About</div>
        <h1 className="about-title">A personal catalog of cookbooks.</h1>
        <p className="about-lead">
          Athenaeum Deipnon is one collector&rsquo;s library of culinary literature — from
          modern chef monographs to translations of medieval Arabic gastronomy — kept
          online so the collection can be browsed, searched, and studied.
        </p>
      </div>

      <nav className="about-toc" aria-label="On this page">
        <a href="#about">The library</a>
        <a href="#collection">The collection</a>
        <a href="#methodology">Sources &amp; methodology</a>
        <a href="#terms">Terms &amp; ownership</a>
        <a href="#contact">Contact</a>
      </nav>

      <section id="about" className="about-section">
        <div className="kicker">§ 1</div>
        <h2>The library</h2>
        {/* TODO: personal intro paragraph — first-person, a few sentences on who you are and why you started the collection */}
        <p>
          The library grew slowly, one shelf at a time, over years of travel, bookshop
          browsing, and correspondence with other collectors. Its subject is
          <strong> culinary literature</strong> in the widest sense: not only recipe
          books, but the philosophy, history, memoirs, technical manuals, and
          periodicals that surround them. Titles arrive in many languages and from
          many centuries; a facsimile of Apicius sits alongside a first edition of
          Escoffier, a Ken Hom paperback, and a hand-stapled community cookbook from
          a small town none of us have visited.
        </p>
        <p>
          The site exists to make the collection legible — to me first, and then to
          anyone else who might find something useful in seeing it laid out.
        </p>
      </section>

      <section id="collection" className="about-section">
        <div className="kicker">§ 2</div>
        <h2>The collection</h2>
        <p>
          Every book listed here is a <strong>physical copy in my possession</strong>,
          personally purchased and personally owned. Nothing is aspirational or a
          wishlist; nothing is for sale.
        </p>
        <p>
          The cover images are <strong>scans and photographs of the actual copies</strong>
          on my shelves — not stock imagery pulled from publishers or retailers.
          Where a cover has visible wear, that&rsquo;s the wear on my book. Where a
          jacket is missing, mine is missing too.
        </p>
      </section>

      <section id="methodology" className="about-section">
        <div className="kicker">§ 3</div>
        <h2>Sources &amp; methodology</h2>
        <p>
          Metadata for each book is a mix of what I&rsquo;ve entered by hand, what
          public catalogs return by ISBN, and what large-language-model APIs
          produce when I ask them to fill gaps. It is not authoritative.
        </p>
        <ul>
          <li>
            <strong>Classification.</strong> Books are organised in a four-level
            taxonomy adopted from a separate project I&rsquo;m developing on
            <strong> Culinary Literature Methodology</strong> — <em>Gastronomy → Culinary Literature → nine genres</em>
            (Cookbooks, Gastronomic Writing, Technical / Professional Manuals,
            Culinary History and Scholarship, Food Memoir, Reference Works, Trade
            and Industry Literature, Periodicals, Beverage Literature) → forty-five
            subcategories. Every class is addressable by a stable notation
            (e.g. <code>1.1.1.2</code> is <em>Cookbooks → Cuisine / Regional</em>).
            A book can hold more than one assignment — a chef monograph that also
            documents a regional cuisine, say — with one marked as the primary
            class. Regional cuisines live on a separate axis rather than inside
            the tree, so a book can be both <em>1.1.1.9 Chef / Restaurant</em> and
            <em> French</em>. The full tree, with a scope note under each entry, is
            browsable at <a href="/genre">/genre</a>.
          </li>
          <li>
            <strong>Market values</strong> are looked up on demand from
            <em> eBay</em> (completed sales), <em>AbeBooks</em>, <em>Biblio</em>,
            <em> Google Books</em>, and <em>ISBNdb</em>. The site records what each
            source reports and displays the median. Prices are snapshots, not
            appraisals, and can move sharply with a single new listing or sale.
          </li>
          <li>
            <strong>Book descriptions</strong>, when marked as AI-generated, are
            written by <a href="https://www.anthropic.com/claude" target="_blank" rel="noopener noreferrer">Anthropic&rsquo;s Claude</a> (currently the Sonnet family)
            in response to the title, author, and publisher I supply.
            They are syntheses, not scraped reviews, and may contain factual errors.
            Treat them as summaries to prompt further reading, not as citations.
          </li>
          <li>
            <strong>OCR</strong> from cover photographs is performed with
            <em> Google Cloud Vision</em>; parsing that OCR into structured
            metadata (title, author, publisher) is done by Claude.
          </li>
          <li>
            <strong>Author and publisher pages</strong> aggregate what&rsquo;s in the
            local database only — they don&rsquo;t pull from Wikipedia or any other
            external biography source at render time.
          </li>
        </ul>
        <p>
          No page on this site carries advertising, affiliate links, or commercial
          intent of any kind.
        </p>
      </section>

      <section id="terms" className="about-section">
        <div className="kicker">§ 4</div>
        <h2>Terms &amp; ownership</h2>
        <p>
          The catalog itself — the choice of books, the metadata, the writing on
          this page — is my own work and is offered here for reading. Please
          don&rsquo;t re-publish it wholesale or scrape it for commercial datasets;
          if you&rsquo;d like to reference a specific entry or use a description or
          cover image, ask me first.
        </p>
        <p>
          <strong>Copyrighted material.</strong> Book titles, author names, and
          publisher names are used descriptively for cataloging purposes only. Cover
          images shown are photographs of physical copies I own, presented in a
          bibliographic context; copyright in the underlying jacket art remains with
          the original publisher and designer. If you hold rights in a specific
          image and would prefer it not appear here, write to me and I&rsquo;ll take
          it down.
        </p>
        <p>
          <strong>Accuracy.</strong> Descriptions, values, and metadata may be
          incomplete or wrong. Nothing on this site should be taken as investment,
          appraisal, or scholarly advice.
        </p>
        <p>
          <strong>Privacy.</strong> The site sets no advertising cookies and
          collects no personal data from visitors. Sign-in is restricted to me as
          the curator.
        </p>
      </section>

      <section id="contact" className="about-section">
        <div className="kicker">§ 5</div>
        <h2>Contact</h2>
        <p>
          For questions, corrections, takedown requests, or a note about a book
          you think belongs here — write to:
        </p>
        <div className="contact-card">
          <div className="contact-label">Curator</div>
          <div className="contact-value">
            <a href="mailto:contact@athenaeum-deipnon.com">contact@athenaeum-deipnon.com</a>
          </div>
        </div>
      </section>
    </PageShell>
  )
}
