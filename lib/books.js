import { supabase, supabaseAdmin } from './supabase'

// Normalize language codes / short forms to the same full-name format used by the UI dropdown.
// Accepts 2-letter (ISO 639-1) or 3-letter (ISO 639-2) codes, or full names in any case.
const LANG_ALIASES = {
  en: 'English', eng: 'English', english: 'English',
  fr: 'French', fre: 'French', fra: 'French', french: 'French',
  de: 'German', ger: 'German', deu: 'German', german: 'German',
  es: 'Spanish', spa: 'Spanish', spanish: 'Spanish',
  it: 'Italian', ita: 'Italian', italian: 'Italian',
  pt: 'Portuguese', por: 'Portuguese', portuguese: 'Portuguese',
  nl: 'Dutch', dut: 'Dutch', nld: 'Dutch', dutch: 'Dutch',
  ru: 'Russian', rus: 'Russian', russian: 'Russian',
  zh: 'Chinese', chi: 'Chinese', zho: 'Chinese', chinese: 'Chinese',
  ja: 'Japanese', jpn: 'Japanese', japanese: 'Japanese',
  ko: 'Korean', kor: 'Korean', korean: 'Korean',
  ar: 'Arabic', ara: 'Arabic', arabic: 'Arabic',
  tr: 'Turkish', tur: 'Turkish', turkish: 'Turkish',
  fa: 'Persian', per: 'Persian', fas: 'Persian', persian: 'Persian',
  he: 'Hebrew', heb: 'Hebrew', hebrew: 'Hebrew',
  el: 'Greek', gre: 'Greek', ell: 'Greek', greek: 'Greek',
  la: 'Latin', lat: 'Latin', latin: 'Latin',
  sv: 'Swedish', swe: 'Swedish', swedish: 'Swedish',
  no: 'Norwegian', nor: 'Norwegian', norwegian: 'Norwegian',
  da: 'Danish', dan: 'Danish', danish: 'Danish',
  fi: 'Finnish', fin: 'Finnish', finnish: 'Finnish',
  pl: 'Polish', pol: 'Polish', polish: 'Polish',
  cs: 'Czech', cze: 'Czech', ces: 'Czech', czech: 'Czech',
  hu: 'Hungarian', hun: 'Hungarian', hungarian: 'Hungarian',
  ro: 'Romanian', rum: 'Romanian', ron: 'Romanian', romanian: 'Romanian',
  th: 'Thai', tha: 'Thai', thai: 'Thai',
  vi: 'Vietnamese', vie: 'Vietnamese', vietnamese: 'Vietnamese',
  id: 'Indonesian', ind: 'Indonesian', indonesian: 'Indonesian',
  hi: 'Hindi', hin: 'Hindi', hindi: 'Hindi',
}

export function normalizeLanguage(raw) {
  if (!raw) return null
  const key = String(raw).trim().toLowerCase()
  if (!key) return null
  return LANG_ALIASES[key] || raw // fall back to whatever was given
}

// Extract a 4-digit year from various date string formats
export function parseYear(raw) {
  if (raw == null || raw === '') return null
  if (typeof raw === 'number') {
    return raw >= 1000 && raw <= 2200 ? Math.floor(raw) : null
  }
  const s = String(raw)
  const m = s.match(/\b(1[0-9]{3}|2[01][0-9]{2})\b/) // 1000-2199
  if (!m) return null
  return parseInt(m[1], 10)
}

export async function insertBook(fields) {
  // Resolve or create publisher
  let publisher_id = null
  if (fields.publisher) {
    const { data: existing } = await supabaseAdmin
      .from('publishers')
      .select('id')
      .ilike('name', fields.publisher)
      .maybeSingle()
    if (existing) {
      publisher_id = existing.id
    } else {
      const { data: created } = await supabaseAdmin
        .from('publishers')
        .insert({ name: fields.publisher })
        .select('id')
        .single()
      publisher_id = created?.id ?? null
    }
  }

  // Resolve or create author
  let author_id = null
  if (fields.author) {
    const { data: existing } = await supabaseAdmin
      .from('authors')
      .select('id')
      .ilike('full_name', fields.author)
      .maybeSingle()
    if (existing) {
      author_id = existing.id
    } else {
      const { data: created } = await supabaseAdmin
        .from('authors')
        .insert({ full_name: fields.author, sort_name: fields.author })
        .select('id')
        .single()
      author_id = created?.id ?? null
    }
  }

  const validMethods = new Set(['manual', 'barcode_scan', 'cover_ocr'])
  const capture_method = validMethods.has(fields.capture_method) ? fields.capture_method : 'manual'

  const { data: book, error } = await supabaseAdmin
    .from('books')
    .insert({
      title: fields.title,
      subtitle: fields.subtitle || null,
      isbn_13: fields.isbn_13 || null,
      isbn_10: fields.isbn_10 || null,
      publisher_id,
      publication_year: parseYear(fields.publication_year),
      page_count: fields.page_count ? parseInt(fields.page_count) : null,
      cover_image_url: fields.cover_image_url || null,
      language: normalizeLanguage(fields.language),
      country_of_origin: fields.country_of_origin || null,
      format: fields.format || null,
      condition: fields.condition || null,
      printing_number: fields.printing_number || null,
      edition: fields.edition || null,
      description: fields.description || null,
      location: fields.location || null,
      photographer: fields.photographer || null,
      designer: fields.designer || null,
      illustrator: fields.illustrator || null,
      estimated_value_usd: fields.estimated_value_usd ? parseFloat(fields.estimated_value_usd) : null,
      capture_method,
    })
    .select('id')
    .single()

  if (error || !book) return { error }

  if (author_id) {
    await supabaseAdmin.from('book_authors').insert({
      book_id: book.id,
      author_id,
      author_order: 1,
    })
  }

  return { data: book }
}

export async function getAllBooks() {
  const { data, error } = await supabase
    .from('books')
    .select(`
      id,
      title,
      subtitle,
      publication_year,
      estimated_value_usd,
      authors:book_authors(
        authors(full_name)
      )
    `)
    .order('title')
  return { data, error }
}

// ── Classification (classes + book_classes) ──

export async function getAllClasses() {
  const { data, error } = await supabase
    .from('classes')
    .select('id, notation, name, level, parent_id, description, sort_order')
    .order('notation')
  return { data, error }
}

export async function getClassById(id) {
  const { data, error } = await supabase
    .from('classes')
    .select('id, notation, name, level, parent_id, description, sort_order')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function getBookClasses(bookId) {
  const { data, error } = await supabase
    .from('book_classes')
    .select('class_id, is_primary, classes(id, notation, name, level, parent_id)')
    .eq('book_id', bookId)
  const rows = (data ?? [])
    .map(bc => bc.classes ? { ...bc.classes, is_primary: bc.is_primary } : null)
    .filter(Boolean)
    .sort((a, b) => (b.is_primary === a.is_primary ? a.notation.localeCompare(b.notation, undefined, { numeric: true }) : b.is_primary ? 1 : -1))
  return { data: rows, error }
}

export async function addBookClass(bookId, classId, isPrimary = false) {
  if (isPrimary) {
    await supabaseAdmin.from('book_classes').update({ is_primary: false }).eq('book_id', bookId).eq('is_primary', true)
  }
  const { error } = await supabaseAdmin
    .from('book_classes')
    .upsert({ book_id: bookId, class_id: classId, is_primary: isPrimary }, { onConflict: 'book_id,class_id' })
  return { error }
}

export async function removeBookClass(bookId, classId) {
  const { error } = await supabaseAdmin
    .from('book_classes')
    .delete()
    .eq('book_id', bookId)
    .eq('class_id', classId)
  return { error }
}

export async function setPrimaryClass(bookId, classId) {
  await supabaseAdmin.from('book_classes').update({ is_primary: false }).eq('book_id', bookId).eq('is_primary', true)
  const { error } = await supabaseAdmin
    .from('book_classes')
    .update({ is_primary: true })
    .eq('book_id', bookId)
    .eq('class_id', classId)
  return { error }
}

export async function getBooksByClass(classId, { includeDescendants = true } = {}) {
  let classIds = [classId]
  if (includeDescendants) {
    const { data: all } = await supabase.from('classes').select('id, parent_id')
    if (all) {
      const children = new Map()
      for (const c of all) {
        if (!children.has(c.parent_id)) children.set(c.parent_id, [])
        children.get(c.parent_id).push(c.id)
      }
      const stack = [classId]
      const seen = new Set([classId])
      while (stack.length) {
        const next = stack.pop()
        for (const kid of children.get(next) ?? []) {
          if (!seen.has(kid)) { seen.add(kid); stack.push(kid) }
        }
      }
      classIds = [...seen]
    }
  }
  const { data, error } = await supabase
    .from('book_classes')
    .select(`
      is_primary,
      books(
        id, title, subtitle, publication_year, estimated_value_usd, cover_image_url,
        authors:book_authors(authors(full_name))
      )
    `)
    .in('class_id', classIds)
  const seen = new Set()
  const rows = (data ?? [])
    .map(bc => bc.books)
    .filter(Boolean)
    .filter(b => (seen.has(b.id) ? false : (seen.add(b.id), true)))
  return { data: rows, error }
}

// ── Cuisines (separate axis, tag-like) ──

export async function getAllCuisines() {
  const { data, error } = await supabase
    .from('cuisines')
    .select('id, name, sort_order')
    .order('name')
  return { data, error }
}

export async function getCuisineById(id) {
  const { data, error } = await supabase
    .from('cuisines')
    .select('id, name')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function getBookCuisines(bookId) {
  const { data, error } = await supabase
    .from('book_cuisines')
    .select('cuisine_id, cuisines(id, name)')
    .eq('book_id', bookId)
  return { data: data?.map(bc => bc.cuisines).filter(Boolean) ?? [], error }
}

export async function addBookCuisine(bookId, cuisineId) {
  const { error } = await supabaseAdmin
    .from('book_cuisines')
    .upsert({ book_id: bookId, cuisine_id: cuisineId }, { onConflict: 'book_id,cuisine_id' })
  return { error }
}

export async function removeBookCuisine(bookId, cuisineId) {
  const { error } = await supabaseAdmin
    .from('book_cuisines')
    .delete()
    .eq('book_id', bookId)
    .eq('cuisine_id', cuisineId)
  return { error }
}

export async function createCuisine(name) {
  const { data, error } = await supabaseAdmin
    .from('cuisines')
    .insert({ name })
    .select('id, name')
    .single()
  return { data, error }
}

export async function getBooksByCuisine(cuisineId) {
  const { data, error } = await supabase
    .from('book_cuisines')
    .select(`
      books(
        id, title, subtitle, publication_year, estimated_value_usd, cover_image_url,
        authors:book_authors(authors(full_name))
      )
    `)
    .eq('cuisine_id', cuisineId)
  return { data: data?.map(bc => bc.books).filter(Boolean), error }
}

export async function getRecentBooks(limit = 5) {
  const { data, error } = await supabase
    .from('books')
    .select(`
      id,
      title,
      cover_image_url,
      estimated_value_usd,
      authors:book_authors(
        authors(full_name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data, error }
}

export async function getCollectionStats() {
  const { data: books } = await supabase
    .from('books')
    .select('id, estimated_value_usd, language, publication_year')
  if (!books) return {}

  const totalBooks = books.length
  const totalValue = books.reduce((sum, b) => sum + (Number(b.estimated_value_usd) || 0), 0)
  const languages = new Set(books.map(b => b.language).filter(Boolean)).size
  const years = books.map(b => b.publication_year).filter(Boolean)
  const oldest = years.length ? Math.min(...years) : null

  // Tolerate missing `chefs` table (before migration)
  let chefs = 0
  try {
    const { count } = await supabase
      .from('chefs')
      .select('*', { count: 'exact', head: true })
    chefs = count || 0
  } catch { chefs = 0 }

  return { totalBooks, totalValue, languages, oldest, chefs }
}

export async function getBookById(id) {
  const { data, error } = await supabase
    .from('books')
    .select(`
      id,
      title,
      subtitle,
      isbn_13,
      isbn_10,
      publication_year,
      edition,
      printing_number,
      language,
      original_language,
      country_of_origin,
      page_count,
      format,
      dimensions,
      cover_image_url,
      condition,
      location,
      editor,
      photographer,
      designer,
      illustrator,
      is_signed,
      signed_notes,
      food_stylist,
      cover_photographer,
      cover_designer,
      art_director,
      text_by,
      translators,
      estimated_value_usd,
      value_last_checked,
      contributed_to_ol,
      capture_method,
      read_status,
      description,
      notes,
      publishers(id, name),
      authors:book_authors(
        author_order,
        authors(id, full_name)
      )
    `)
    .eq('id', id)
    .single()

  if (error) return { data, error }

  // Fetch chef/restaurant links separately — tolerate missing tables (e.g. migration not run)
  try {
    const { data: chefRows } = await supabase
      .from('book_chefs')
      .select('chef_order, chefs(id, full_name)')
      .eq('book_id', id)
    if (chefRows) data.chefs = chefRows
  } catch { data.chefs = [] }

  return { data, error: null }
}

// ── Collections ──

export async function getAllCollections() {
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, description')
    .order('name')
  return { data, error }
}

export async function getCollectionById(id) {
  const { data, error } = await supabase
    .from('collections')
    .select('id, name, description')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function getBooksByCollection(collectionId) {
  const { data, error } = await supabase
    .from('book_collections')
    .select(`
      books(
        id, title, subtitle, publication_year, estimated_value_usd, cover_image_url,
        authors:book_authors(authors(full_name))
      )
    `)
    .eq('collection_id', collectionId)
  return { data: data?.map(bc => bc.books).filter(Boolean), error }
}

export async function getBookCollections(bookId) {
  const { data, error } = await supabase
    .from('book_collections')
    .select('collection_id, collections(id, name)')
    .eq('book_id', bookId)
  return { data: data?.map(bc => bc.collections).filter(Boolean) ?? [], error }
}

export async function addBookToCollection(bookId, collectionId) {
  const { error } = await supabaseAdmin
    .from('book_collections')
    .upsert({ book_id: bookId, collection_id: collectionId })
  return { error }
}

export async function removeBookFromCollection(bookId, collectionId) {
  const { error } = await supabaseAdmin
    .from('book_collections')
    .delete()
    .eq('book_id', bookId)
    .eq('collection_id', collectionId)
  return { error }
}

export async function createCollection(name, description) {
  const { data, error } = await supabaseAdmin
    .from('collections')
    .insert({ name, description: description || null })
    .select('id, name, description')
    .single()
  return { data, error }
}

// ── Value History + Per-Source Prices ──

export async function getBookSourcePrices(bookId) {
  const { data, error } = await supabase
    .from('book_source_prices')
    .select('source, value_usd, listings, low_usd, high_usd, note, checked_at')
    .eq('book_id', bookId)
    .order('value_usd', { ascending: false })
  return { data, error }
}

export async function getValueHistory(bookId) {
  const { data, error } = await supabase
    .from('value_history')
    .select('id, value_usd, source, recorded_at')
    .eq('book_id', bookId)
    .order('recorded_at', { ascending: false })
  return { data, error }
}

export async function addValueRecord(bookId, valueUsd, source) {
  const { error: histError } = await supabaseAdmin
    .from('value_history')
    .insert({ book_id: bookId, value_usd: valueUsd, source })
  if (histError) return { error: histError }

  const { error: bookError } = await supabaseAdmin
    .from('books')
    .update({ estimated_value_usd: valueUsd, value_last_checked: new Date().toISOString() })
    .eq('id', bookId)
  return { error: bookError }
}

export async function updateReadStatus(bookId, status) {
  const { error } = await supabaseAdmin
    .from('books')
    .update({ read_status: status })
    .eq('id', bookId)
  return { error }
}

// ── Authors ──

export async function getAllAuthors() {
  const { data, error } = await supabase
    .from('authors')
    .select('id, full_name, sort_name')
    .order('full_name')
  return { data, error }
}

export async function getAuthorById(id) {
  const { data, error } = await supabase
    .from('authors')
    .select('id, full_name, sort_name, nationality, notes, bio, birth_year, photo_url')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function getBooksByAuthor(authorId) {
  const { data, error } = await supabase
    .from('book_authors')
    .select(`
      books(
        id, title, subtitle, publication_year, estimated_value_usd, cover_image_url
      )
    `)
    .eq('author_id', authorId)
  return { data: data?.map(ba => ba.books).filter(Boolean), error }
}

export async function deleteAuthor(authorId) {
  await supabaseAdmin.from('book_authors').delete().eq('author_id', authorId)
  const { error } = await supabaseAdmin.from('authors').delete().eq('id', authorId)
  return { error }
}

export async function updateAuthor(authorId, fields) {
  const { error } = await supabaseAdmin.from('authors').update(fields).eq('id', authorId)
  return { error }
}

export async function deleteBook(bookId) {
  // Delete related records first
  await supabaseAdmin.from('book_authors').delete().eq('book_id', bookId)
  await supabaseAdmin.from('book_classes').delete().eq('book_id', bookId)
  await supabaseAdmin.from('book_cuisines').delete().eq('book_id', bookId)
  await supabaseAdmin.from('book_collections').delete().eq('book_id', bookId)
  await supabaseAdmin.from('value_history').delete().eq('book_id', bookId)
  const { error } = await supabaseAdmin.from('books').delete().eq('id', bookId)
  return { error }
}