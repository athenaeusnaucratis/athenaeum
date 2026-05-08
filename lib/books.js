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