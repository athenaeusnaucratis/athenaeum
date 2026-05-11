import { supabase, supabaseAdmin } from './supabase'

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

  const { data: book, error } = await supabaseAdmin
    .from('books')
    .insert({
      title: fields.title,
      subtitle: fields.subtitle || null,
      isbn_13: fields.isbn_13 || null,
      isbn_10: fields.isbn_10 || null,
      publisher_id,
      publication_year: fields.publication_year ? parseInt(fields.publication_year) : null,
      page_count: fields.page_count ? parseInt(fields.page_count) : null,
      cover_image_url: fields.cover_image_url || null,
      language: fields.language || null,
      capture_method: fields.capture_method || 'manual',
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

export async function getAllTags() {
  const { data, error } = await supabase
    .from('tags')
    .select('id, name, type')
    .order('name')
  return { data, error }
}

export async function getBookTags(bookId) {
  const { data, error } = await supabase
    .from('book_tags')
    .select('tag_id, tags(id, name, type)')
    .eq('book_id', bookId)
  return { data: data?.map(bt => bt.tags).filter(Boolean) ?? [], error }
}

export async function addBookTag(bookId, tagId) {
  const { error } = await supabaseAdmin
    .from('book_tags')
    .upsert({ book_id: bookId, tag_id: tagId })
  return { error }
}

export async function removeBookTag(bookId, tagId) {
  const { error } = await supabaseAdmin
    .from('book_tags')
    .delete()
    .eq('book_id', bookId)
    .eq('tag_id', tagId)
  return { error }
}

export async function createTag(name, type) {
  const { data, error } = await supabaseAdmin
    .from('tags')
    .insert({ name, type })
    .select('id, name, type')
    .single()
  return { data, error }
}

export async function getBooksByTag(tagId) {
  const { data, error } = await supabase
    .from('book_tags')
    .select(`
      books(
        id, title, subtitle, publication_year, estimated_value_usd, cover_image_url,
        authors:book_authors(authors(full_name))
      )
    `)
    .eq('tag_id', tagId)
  return { data: data?.map(bt => bt.books).filter(Boolean), error }
}

export async function getCollectionStats() {
  const { data: books } = await supabase
    .from('books')
    .select('id, estimated_value_usd, language, publication_year')
  if (!books) return {}

  const totalBooks = books.length
  const totalValue = books.reduce((sum, b) => sum + (Number(b.estimated_value_usd) || 0), 0)
  const languages = new Set(books.map(b => b.language).filter(Boolean)).size
  const oldest = Math.min(...books.map(b => b.publication_year).filter(Boolean))

  return { totalBooks, totalValue, languages, oldest }
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
      country_of_origin,
      page_count,
      format,
      dimensions,
      cover_image_url,
      condition,
      estimated_value_usd,
      value_last_checked,
      contributed_to_ol,
      capture_method,
      read_status,
      notes,
      publishers(name),
      authors:book_authors(
        authors(full_name)
      )
    `)
    .eq('id', id)
    .single()
  return { data, error }
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

// ── Value History ──

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