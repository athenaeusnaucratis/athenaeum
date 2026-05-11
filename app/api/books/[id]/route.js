import { supabaseAdmin } from '@/lib/supabase'
import { deleteBook } from '@/lib/books'

export async function DELETE(request, { params }) {
  const { id } = await params
  const { error } = await deleteBook(id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

export async function PATCH(request, { params }) {
  const { id } = await params
  const fields = await request.json()

  let publisher_id = undefined
  if (fields.publisher !== undefined) {
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
    } else {
      publisher_id = null
    }
  }

  if (fields.author !== undefined) {
    const { data: currentLinks } = await supabaseAdmin
      .from('book_authors')
      .select('author_id')
      .eq('book_id', id)

    if (fields.author) {
      const { data: existing } = await supabaseAdmin
        .from('authors')
        .select('id')
        .ilike('full_name', fields.author)
        .maybeSingle()

      let author_id
      if (existing) {
        author_id = existing.id
      } else {
        const { data: created } = await supabaseAdmin
          .from('authors')
          .insert({ full_name: fields.author, sort_name: fields.author })
          .select('id')
          .single()
        author_id = created?.id
      }

      if (author_id) {
        await supabaseAdmin.from('book_authors').delete().eq('book_id', id)
        await supabaseAdmin.from('book_authors').insert({
          book_id: id, author_id, author_order: 1,
        })
      }
    } else {
      await supabaseAdmin.from('book_authors').delete().eq('book_id', id)
    }
  }

  const update = {
    title: fields.title || undefined,
    subtitle: fields.subtitle || null,
    isbn_13: fields.isbn_13 || null,
    isbn_10: fields.isbn_10 || null,
    publication_year: fields.publication_year ? parseInt(fields.publication_year) : null,
    edition: fields.edition || null,
    printing_number: fields.printing_number || null,
    page_count: fields.page_count ? parseInt(fields.page_count) : null,
    format: fields.format || null,
    language: fields.language || null,
    country_of_origin: fields.country_of_origin || null,
    condition: fields.condition || null,
    dimensions: fields.dimensions || null,
    estimated_value_usd: fields.estimated_value_usd ? parseFloat(fields.estimated_value_usd) : null,
    cover_image_url: fields.cover_image_url || null,
    notes: fields.notes || null,
  }

  if (publisher_id !== undefined) update.publisher_id = publisher_id

  Object.keys(update).forEach(k => update[k] === undefined && delete update[k])

  const { error } = await supabaseAdmin
    .from('books')
    .update(update)
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
