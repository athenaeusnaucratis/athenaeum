import { supabaseAdmin } from '@/lib/supabase'
import { deleteBook } from '@/lib/books'

export async function DELETE(request, { params }) {
  const { id } = await params
  const { error } = await deleteBook(id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}

async function resolveAuthorId(name) {
  const trimmed = name.trim()
  if (!trimmed) return null
  const { data: existing } = await supabaseAdmin
    .from('authors')
    .select('id')
    .ilike('full_name', trimmed)
    .maybeSingle()
  if (existing) return existing.id
  const { data: created } = await supabaseAdmin
    .from('authors')
    .insert({ full_name: trimmed, sort_name: trimmed })
    .select('id')
    .single()
  return created?.id ?? null
}

async function resolveChefId(name) {
  const trimmed = name.trim()
  if (!trimmed) return null
  const { data: existing } = await supabaseAdmin
    .from('chefs')
    .select('id')
    .ilike('full_name', trimmed)
    .maybeSingle()
  if (existing) return existing.id
  const { data: created } = await supabaseAdmin
    .from('chefs')
    .insert({ full_name: trimmed, sort_name: trimmed })
    .select('id')
    .single()
  return created?.id ?? null
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

  // Handle multi-author update (new: array of names)
  if (Array.isArray(fields.authors)) {
    const names = fields.authors.map(a => (a || '').trim()).filter(Boolean)
    await supabaseAdmin.from('book_authors').delete().eq('book_id', id)
    for (let i = 0; i < names.length; i++) {
      const author_id = await resolveAuthorId(names[i])
      if (author_id) {
        await supabaseAdmin.from('book_authors').insert({
          book_id: id, author_id, author_order: i + 1,
        })
      }
    }
  } else if (fields.author !== undefined) {
    // Legacy single-author path
    await supabaseAdmin.from('book_authors').delete().eq('book_id', id)
    if (fields.author) {
      const author_id = await resolveAuthorId(fields.author)
      if (author_id) {
        await supabaseAdmin.from('book_authors').insert({
          book_id: id, author_id, author_order: 1,
        })
      }
    }
  }

  // Handle chefs (array of names)
  if (Array.isArray(fields.chefs)) {
    const names = fields.chefs.map(a => (a || '').trim()).filter(Boolean)
    await supabaseAdmin.from('book_chefs').delete().eq('book_id', id)
    for (let i = 0; i < names.length; i++) {
      const chef_id = await resolveChefId(names[i])
      if (chef_id) {
        await supabaseAdmin.from('book_chefs').insert({
          book_id: id, chef_id, chef_order: i + 1,
        })
      }
    }
  }

  // Only update fields explicitly present in the payload. Fields set to '' are treated
  // as a clear-to-null; missing fields (undefined) are left untouched. This prevents
  // stale form state or partial callers from wiping unrelated values.
  const asText = v => v !== undefined ? (v || null) : undefined
  const asInt = v => v !== undefined ? (v ? parseInt(v) : null) : undefined
  const asFloat = v => v !== undefined ? (v ? parseFloat(v) : null) : undefined
  const asBool = v => v !== undefined ? !!v : undefined

  const update = {
    title: fields.title || undefined, // never null title
    subtitle: asText(fields.subtitle),
    isbn_13: asText(fields.isbn_13),
    isbn_10: asText(fields.isbn_10),
    publication_year: asInt(fields.publication_year),
    edition: asText(fields.edition),
    printing_number: asText(fields.printing_number),
    page_count: asInt(fields.page_count),
    format: asText(fields.format),
    language: asText(fields.language),
    country_of_origin: asText(fields.country_of_origin),
    condition: asText(fields.condition),
    location: asText(fields.location),
    photographer: asText(fields.photographer),
    designer: asText(fields.designer),
    illustrator: asText(fields.illustrator),
    editor: asText(fields.editor),
    food_stylist: asText(fields.food_stylist),
    cover_photographer: asText(fields.cover_photographer),
    cover_designer: asText(fields.cover_designer),
    art_director: asText(fields.art_director),
    text_by: asText(fields.text_by),
    is_signed: asBool(fields.is_signed),
    signed_notes: asText(fields.signed_notes),
    original_language: asText(fields.original_language),
    translators: asText(fields.translators),
    dimensions: asText(fields.dimensions),
    estimated_value_usd: asFloat(fields.estimated_value_usd),
    cover_image_url: asText(fields.cover_image_url),
    description: asText(fields.description),
    notes: asText(fields.notes),
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
