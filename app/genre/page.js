import { supabase } from '@/lib/supabase'
import PageShell from '@/app/components/PageShell'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function GenrePage() {
  const [{ data: classes }, { data: bookClasses }, { data: langBooks }] = await Promise.all([
    supabase.from('classes').select('id, notation, name, level, parent_id, description').order('notation'),
    supabase.from('book_classes').select('class_id, is_primary'),
    supabase.from('books').select('language'),
  ])

  const cls = classes || []
  const bc = bookClasses || []

  // Direct-count per class id (not descendants-aware; that's the /genre/[id] view)
  const directCount = {}
  for (const row of bc) directCount[row.class_id] = (directCount[row.class_id] || 0) + 1

  // Descendants: for each class, gather itself + all descendants for a rolled-up count
  const childrenOf = {}
  for (const c of cls) {
    if (c.parent_id) (childrenOf[c.parent_id] ??= []).push(c.id)
  }
  const rollupCount = {}
  function rollup(id) {
    if (rollupCount[id] != null) return rollupCount[id]
    let n = directCount[id] || 0
    for (const kid of childrenOf[id] || []) n += rollup(kid)
    return (rollupCount[id] = n)
  }
  for (const c of cls) rollup(c.id)

  const genres = cls
    .filter(c => c.level === 'genre')
    .map(g => ({ ...g, count: rollupCount[g.id], subs: cls.filter(s => s.parent_id === g.id) }))

  const totalClassified = new Set(bc.map(r => r.class_id)).size
  const totalBooks = (langBooks || []).length
  const maxCount = Math.max(1, ...genres.map(g => g.count))

  const langCounts = {}
  for (const b of langBooks || []) if (b.language) langCounts[b.language] = (langCounts[b.language] || 0) + 1
  const languages = Object.entries(langCounts).sort((a, b) => b[1] - a[1])

  return (
    <PageShell active="/genre">
      <style>{`
        .cls-page-header { padding: 3rem 5rem 2rem; border-bottom: 1px solid var(--rule); animation: fadeUp 0.5s ease both; }
        .cls-page-eyebrow { font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.6rem; }
        .cls-page-title { font-family: var(--serif); font-size: clamp(2.4rem, 4vw, 3.4rem); font-weight: 300; font-style: italic; color: var(--ink); line-height: 1; }
        .cls-page-sub { font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.1em; color: var(--muted); margin-top: 0.9rem; }

        .genre-block { border-bottom: 1px solid var(--rule); padding: 2.2rem 5rem; animation: fadeUp 0.5s ease both; }
        .genre-head { display: grid; grid-template-columns: 1fr auto; align-items: baseline; gap: 1rem; }
        .genre-notation { font-family: var(--mono); font-size: 0.62rem; letter-spacing: 0.1em; color: var(--coral); margin-bottom: 0.3rem; }
        .genre-name { font-family: var(--serif); font-size: 1.9rem; font-weight: 300; color: var(--ink); }
        .genre-name-link { text-decoration: none; color: inherit; transition: color 0.15s; }
        .genre-name-link:hover { color: var(--coral); }
        .genre-count { font-family: var(--mono); font-size: 0.65rem; color: var(--muted); letter-spacing: 0.08em; text-align: right; }
        .genre-count b { color: var(--ink); font-weight: 500; }
        .genre-desc { font-family: var(--serif); font-size: 0.92rem; font-style: italic; color: var(--muted); line-height: 1.5; margin-top: 0.5rem; max-width: 62ch; }
        .genre-bar-wrap { height: 1px; background: var(--rule); margin-top: 1.4rem; position: relative; }
        .genre-bar { position: absolute; left: 0; top: 0; height: 1px; background: var(--coral); transition: width 0.8s ease; }

        .sub-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; margin-top: 1.4rem; border-top: 1px solid var(--rule); }
        .sub-cell {
          padding: 1rem 1.2rem;
          border-right: 1px solid var(--rule); border-bottom: 1px solid var(--rule);
          text-decoration: none; color: inherit;
          display: flex; flex-direction: column; gap: 0.4rem;
          transition: background 0.15s;
        }
        .sub-cell:hover { background: var(--warm-mid); }
        .sub-cell:nth-child(3n) { border-right: none; }
        .sub-cell.empty { opacity: 0.45; pointer-events: none; }
        .sub-notation { font-family: var(--mono); font-size: 0.55rem; color: var(--rule); letter-spacing: 0.08em; }
        .sub-name { font-family: var(--serif); font-size: 0.98rem; color: var(--ink); font-weight: 300; transition: color 0.15s; }
        .sub-cell:hover .sub-name { color: var(--coral); }
        .sub-count { font-family: var(--mono); font-size: 0.6rem; color: var(--muted); letter-spacing: 0.06em; }

        .lang-strip { display: flex; border-bottom: 1px solid var(--rule); animation: fadeUp 0.6s 0.4s ease both; }
        .lang-header { padding: 2rem 3.5rem; border-right: 1px solid var(--rule); display: flex; flex-direction: column; justify-content: center; min-width: 220px; }
        .lang-header-label { font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.5rem; }
        .lang-header-title { font-family: var(--serif); font-size: 1.2rem; font-style: italic; font-weight: 300; color: var(--ink); }
        .lang-cells { display: flex; flex: 1; flex-wrap: wrap; }
        .lang-cell { flex: 1 1 130px; padding: 1.6rem 2rem; border-right: 1px solid var(--rule); border-bottom: 1px solid var(--rule); transition: background 0.15s; display: flex; flex-direction: column; gap: 0.4rem; text-decoration: none; color: inherit; }
        .lang-cell:hover { background: var(--warm-mid); }
        .lang-name { font-family: var(--serif); font-size: 1.05rem; font-weight: 300; color: var(--ink); }
        .lang-cell:hover .lang-name { color: var(--coral); }
        .lang-count { font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.1em; color: var(--muted); }

        @media (max-width: 900px) {
          .cls-page-header, .genre-block { padding-left: 1.5rem; padding-right: 1.5rem; }
          .sub-grid { grid-template-columns: 1fr 1fr; }
          .sub-cell:nth-child(3n) { border-right: 1px solid var(--rule); }
          .sub-cell:nth-child(2n) { border-right: none; }
        }
        @media (max-width: 560px) {
          .sub-grid { grid-template-columns: 1fr; }
          .sub-cell { border-right: none !important; }
        }
      `}</style>

      <div className="cls-page-header">
        <div className="cls-page-eyebrow">Classification</div>
        <div className="cls-page-title">Culinary Literature</div>
        <div className="cls-page-sub">
          <b>{genres.length}</b> genres · <b>{cls.filter(c => c.level === 'subcategory').length}</b> subcategories · <b>{totalClassified}</b> classes in use · <b>{totalBooks}</b> books total
        </div>
      </div>

      {genres.map(g => {
        const pct = Math.round((g.count / maxCount) * 100)
        return (
          <div key={g.id} className="genre-block">
            <div className="genre-head">
              <div>
                <div className="genre-notation">{g.notation}</div>
                <Link href={`/genre/${g.id}`} className="genre-name-link">
                  <div className="genre-name">{g.name}</div>
                </Link>
                {g.description && <div className="genre-desc">{g.description}</div>}
              </div>
              <div className="genre-count">
                <b>{g.count}</b> book{g.count === 1 ? '' : 's'}
              </div>
            </div>
            <div className="genre-bar-wrap"><div className="genre-bar" style={{ width: `${pct}%` }} /></div>

            {g.subs.length > 0 && (
              <div className="sub-grid">
                {g.subs.map(s => {
                  const n = rollupCount[s.id] || 0
                  return (
                    <Link key={s.id} href={`/genre/${s.id}`} className={`sub-cell${n === 0 ? ' empty' : ''}`}>
                      <div className="sub-notation">{s.notation}</div>
                      <div className="sub-name">{s.name}</div>
                      <div className="sub-count">{n} book{n === 1 ? '' : 's'}</div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {languages.length > 0 && (
        <div className="lang-strip">
          <div className="lang-header">
            <div className="lang-header-label">Also browse by</div>
            <div className="lang-header-title">Language</div>
          </div>
          <div className="lang-cells">
            {languages.map(([lang, count]) => (
              <Link key={lang} href={`/language/${encodeURIComponent(lang)}`} className="lang-cell">
                <div className="lang-name">{lang}</div>
                <div className="lang-count">{count} book{count === 1 ? '' : 's'}</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  )
}
