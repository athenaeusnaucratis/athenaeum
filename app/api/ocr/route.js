export async function POST(request) {
  const VISION_KEY = process.env.GOOGLE_VISION_API_KEY
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

  if (!VISION_KEY && !ANTHROPIC_KEY) {
    return Response.json({ error: 'No OCR API keys configured' }, { status: 500 })
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

  let base64
  try {
    const bytes = await file.arrayBuffer()
    base64 = Buffer.from(bytes).toString('base64')
  } catch {
    return Response.json({ error: 'Failed to read image file' }, { status: 500 })
  }

  // ── Try Google Vision first ──
  let ocrText = ''
  let webEntities = []
  let bestGuess = ''
  let matchingPageTitles = []
  let visionWorked = false

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
              features: [
                { type: 'TEXT_DETECTION', maxResults: 1 },
                { type: 'WEB_DETECTION', maxResults: 10 },
              ],
            }],
          }),
        }
      )

      if (visionRes.ok) {
        const visionData = await visionRes.json()
        const response = visionData.responses?.[0]

        if (response && !response.error) {
          visionWorked = true
          ocrText = response.fullTextAnnotation?.text || ''
          const wd = response.webDetection || {}
          bestGuess = (wd.bestGuessLabels || []).map(l => l.label).join(', ')
          webEntities = (wd.webEntities || [])
            .filter(e => e.description && e.score > 0.3)
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map(e => e.description)
          matchingPageTitles = (wd.pagesWithMatchingImages || [])
            .slice(0, 5)
            .map(p => p.pageTitle)
            .filter(Boolean)
        }
      }
    } catch (e) {
      console.error('Vision API error:', e.message)
    }
  }

  // ── Use Claude to interpret (with or without Vision data) ──
  if (ANTHROPIC_KEY) {
    try {
      const Anthropic = (await import('@anthropic-ai/sdk')).default
      const client = new Anthropic({ apiKey: ANTHROPIC_KEY })

      if (visionWorked) {
        // Vision + Claude: interpret combined signals
        const prompt = `You are identifying a cookbook from its cover photo. Here is all the data extracted:

OCR TEXT FROM COVER:
${ocrText || '(no text detected)'}

GOOGLE VISION BEST GUESS:
${bestGuess || '(none)'}

WEB ENTITIES (by relevance):
${webEntities.join(', ') || '(none)'}

MATCHING WEB PAGE TITLES:
${matchingPageTitles.join('\n') || '(none)'}

Based on ALL of this information, identify the book. Return ONLY a JSON object:
{"title": "", "subtitle": "", "author": "", "publisher": ""}

Use empty string for anything you cannot determine. Be precise with the title and author name.`

        const aiRes = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 256,
          messages: [{ role: 'user', content: prompt }],
        })

        const aiText = aiRes.content[0]?.text || ''
        const jsonMatch = aiText.match(/\{[\s\S]*?\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return Response.json({
            title: parsed.title || '',
            subtitle: parsed.subtitle || '',
            author: parsed.author || '',
            publisher: parsed.publisher || '',
            _source: 'vision+claude',
          })
        }
      } else {
        // Claude-only: send the image directly
        if (!validTypes.includes(mediaType)) {
          return Response.json({ error: `Unsupported image type: ${mediaType}` }, { status: 400 })
        }

        const aiRes = await client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 512,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: base64 },
              },
              {
                type: 'text',
                text: `Look at this cookbook cover photo. Extract whatever text you can see. Return ONLY a JSON object with these fields. Use empty string "" for anything you cannot find:

{"title": "", "subtitle": "", "author": "", "publisher": ""}

Return ONLY the JSON, no explanation.`,
              },
            ],
          }],
        })

        const aiText = aiRes.content[0]?.text || ''
        const jsonMatch = aiText.match(/\{[\s\S]*?\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return Response.json({
            title: parsed.title || '',
            subtitle: parsed.subtitle || '',
            author: parsed.author || '',
            publisher: parsed.publisher || '',
            _source: 'claude_vision',
          })
        }
      }
    } catch (e) {
      console.error('Claude OCR error:', e.message)
      return Response.json({ error: `OCR failed: ${e.message}` }, { status: 500 })
    }
  }

  // Fallback: return whatever Vision gave us
  if (visionWorked) {
    return Response.json({
      title: bestGuess || webEntities[0] || '',
      subtitle: '',
      author: '',
      publisher: '',
      _source: 'vision_only',
    })
  }

  return Response.json({ error: 'All OCR methods failed' }, { status: 500 })
}
