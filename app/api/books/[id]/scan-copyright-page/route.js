import { normalizeLanguage, parseYear } from '@/lib/books'

// OCR + Claude extraction from a scanned copyright page.
// No external catalog lookups — extracts strictly what's on the scan.

const COPYRIGHT_SCHEMA = `{
  "title": null,
  "subtitle": null,
  "isbn_13": null,
  "isbn_10": null,
  "publisher": null,
  "country_of_origin": null,
  "publication_year": null,
  "edition": null,
  "printing_number": null,
  "language": null,
  "original_language": null,
  "editor": null,
  "text_by": null,
  "translators": null,
  "photographer": null,
  "cover_photographer": null,
  "food_stylist": null,
  "designer": null,
  "cover_designer": null,
  "art_director": null,
  "illustrator": null
}`

export async function POST(request) {
  const VISION_KEY = process.env.GOOGLE_VISION_API_KEY
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

  if (!ANTHROPIC_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  let formData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !file.size) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'Image too large (max 10MB)' }, { status: 400 })
  }

  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const mediaType = file.type || 'image/jpeg'
  if (!validTypes.includes(mediaType)) {
    return Response.json({ error: `Unsupported image type: ${mediaType}` }, { status: 400 })
  }

  let base64
  try {
    const bytes = await file.arrayBuffer()
    base64 = Buffer.from(bytes).toString('base64')
  } catch {
    return Response.json({ error: 'Failed to read image file' }, { status: 500 })
  }

  // Google Vision text detection — copyright pages are text-dense, no web detection needed
  let ocrText = ''
  if (VISION_KEY) {
    try {
      const visionRes = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64 },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
            }],
          }),
        }
      )
      if (visionRes.ok) {
        const data = await visionRes.json()
        ocrText = data.responses?.[0]?.fullTextAnnotation?.text || ''
      }
    } catch (e) {
      console.error('Vision API error:', e.message)
    }
  }

  try {
    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: ANTHROPIC_KEY })

    const prompt = `You are extracting bibliographic metadata from a scanned copyright page of a cookbook.

${ocrText ? `OCR TEXT FROM THE PAGE:\n${ocrText}\n\n` : 'No OCR text is available; read the image directly.\n\n'}Copyright pages typically contain: ISBN(s), publisher name and address, publication year, edition/printing statements, copyright holder, and credits for editor, designer, photographer, translator, food stylist, art director, illustrator.

Rules — READ CAREFULLY:
- Extract ONLY what is written on the page. Do NOT guess, invent, or fill in from your general knowledge.
- If a field is not present on the page, leave it null (or empty string).
- ISBN: strip hyphens and non-digits. 13-digit → isbn_13; 10-digit → isbn_10. If multiple are listed (hardcover, paperback, e-book), take the primary printed edition's ISBN.
- publication_year: the copyright year (©2019 → 2019). If a copyright range like "© 2015, 2019", use the latest. 4-digit integer.
- edition: "First Edition", "Revised Edition", "10th Anniversary Edition", "Second Edition", etc. Only if explicitly stated.
- printing_number: the printing statement ("2nd printing" → "2nd"; "First edition, third printing" → "3rd"; a bare row of numbers "10 9 8 7 6 5" means the printing is the lowest number shown, so "5"). Keep as short text.
- publisher: the imprint / publishing house name only (e.g. "Ten Speed Press"). Do not include city or LLC/Ltd suffix if separable.
- country_of_origin: the country where the book was **published** — NOT where it was physically printed. This is the country of the publishing house, not the manufacturing location. Priority order for extraction:
  1. **Publisher's address / place of establishment**. If the publisher line reads "Ten Speed Press, Berkeley, California" → "United States"; "Éditions Robert Laffont, Paris" → "France"; "Phaidon Press Limited, London" → "United Kingdom"; "Yapı Kredi Yayınları, İstanbul" → "Turkey"; "Shibata Publishing, Tokyo" → "Japan".
  2. **The copyright holder's country**, if the copyright line names one explicitly ("Copyright © 2019 by Ten Speed Press, an imprint of the Crown Publishing Group, a division of Penguin Random House LLC, New York" → "United States").
  3. **"Country of publication"** in CIP data (e.g. Library of Congress CIP often names the publication country).
- **IGNORE "Printed in X" lines when X is a manufacturing hub that does not match the publisher's country.** Books published in the US, UK, France, Germany, etc. are commonly *printed* in China, South Korea, Malaysia, Singapore, or Vietnam for cost reasons — this is the manufacturing location, not the country of publication. Only fall back to "Printed in X" if there is genuinely no other country signal on the page AND X is plausibly the publisher's own country (e.g. "Printed in France" for a French publisher, "Printed in the United States" for an American publisher).
- Return the full country name in English ("United States", "United Kingdom", "France", "Turkey", "Germany", "Italy", "Japan"). Leave null if the page shows no country signal you can attribute to the publisher.
- language: full English name of the book's primary language.
- original_language: if this is a translation, the language of the original. Otherwise null.
- translators: full name(s) of translator(s), comma-separated if more than one.
- Contributor role fields (editor, text_by, photographer, cover_photographer, food_stylist, designer, cover_designer, art_director, illustrator): full name if explicitly credited on the page. Common credit phrasings — "Edited by", "Text by", "Photographs by", "Cover photograph by", "Food styling by", "Designed by", "Cover design by", "Art direction by", "Illustrations by". Otherwise null.
- Do NOT confuse the food_stylist with the photographer, or the cover_designer with the interior designer. Match the credit as printed.

Return ONLY the JSON object matching this exact schema:
${COPYRIGHT_SCHEMA}`

    const messages = ocrText
      ? [{ role: 'user', content: prompt }]
      : [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
            { type: 'text', text: prompt },
          ],
        }]

    const aiRes = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages,
    })

    const aiText = aiRes.content[0]?.text || ''
    const jsonMatch = aiText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'Could not parse extracted metadata', raw: aiText }, { status: 500 })
    }

    const extracted = JSON.parse(jsonMatch[0])

    // Normalize types
    const rawIsbn13 = (extracted.isbn_13 || '').replace(/[^0-9Xx]/g, '')
    const rawIsbn10 = (extracted.isbn_10 || '').replace(/[^0-9Xx]/g, '')
    const clean = {
      title: extracted.title || null,
      subtitle: extracted.subtitle || null,
      isbn_13: rawIsbn13.length === 13 ? rawIsbn13 : null,
      isbn_10: rawIsbn10.length === 10 ? rawIsbn10 : null,
      publisher: extracted.publisher || null,
      country_of_origin: extracted.country_of_origin || null,
      publication_year: parseYear(extracted.publication_year),
      edition: extracted.edition || null,
      printing_number: extracted.printing_number || null,
      language: normalizeLanguage(extracted.language),
      original_language: normalizeLanguage(extracted.original_language),
      editor: extracted.editor || null,
      text_by: extracted.text_by || null,
      translators: extracted.translators || null,
      photographer: extracted.photographer || null,
      cover_photographer: extracted.cover_photographer || null,
      food_stylist: extracted.food_stylist || null,
      designer: extracted.designer || null,
      cover_designer: extracted.cover_designer || null,
      art_director: extracted.art_director || null,
      illustrator: extracted.illustrator || null,
    }

    return Response.json({
      extracted: clean,
      _source: ocrText ? 'vision+claude' : 'claude_vision',
      _ocr_text_length: ocrText.length,
    })
  } catch (e) {
    console.error('Copyright-page scan error:', e.message)
    return Response.json({ error: `Scan failed: ${e.message}` }, { status: 500 })
  }
}
