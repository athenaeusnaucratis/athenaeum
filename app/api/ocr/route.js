export async function POST(request) {
  const VISION_KEY = process.env.GOOGLE_VISION_API_KEY
  const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

  if (!VISION_KEY) {
    return Response.json({ error: 'GOOGLE_VISION_API_KEY not configured' }, { status: 500 })
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

  let base64
  try {
    const bytes = await file.arrayBuffer()
    base64 = Buffer.from(bytes).toString('base64')
  } catch {
    return Response.json({ error: 'Failed to read image file' }, { status: 500 })
  }

  try {
    // Call Google Cloud Vision — TEXT_DETECTION + WEB_DETECTION
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

    if (!visionRes.ok) {
      const err = await visionRes.text()
      console.error('Vision API error:', err)
      return Response.json({ error: 'Google Vision API request failed' }, { status: 500 })
    }

    const visionData = await visionRes.json()
    const response = visionData.responses?.[0]

    // Extract OCR text
    const ocrText = response?.fullTextAnnotation?.text || ''

    // Extract web detection results
    const webDetection = response?.webDetection || {}
    const webEntities = webDetection.webEntities || []
    const pagesWithMatching = webDetection.pagesWithMatchingImages || []
    const bestGuessLabels = webDetection.bestGuessLabels || []

    // Build context from web detection
    const bestGuess = bestGuessLabels.map(l => l.label).join(', ')
    const topEntities = webEntities
      .filter(e => e.description && e.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(e => e.description)
    const matchingPageTitles = pagesWithMatching
      .slice(0, 5)
      .map(p => p.pageTitle)
      .filter(Boolean)

    // Use Claude to interpret the combined signals into structured book data
    if (ANTHROPIC_KEY) {
      try {
        const Anthropic = (await import('@anthropic-ai/sdk')).default
        const client = new Anthropic({ apiKey: ANTHROPIC_KEY })

        const prompt = `You are identifying a cookbook from its cover photo. Here is all the data extracted:

OCR TEXT FROM COVER:
${ocrText || '(no text detected)'}

GOOGLE VISION BEST GUESS:
${bestGuess || '(none)'}

WEB ENTITIES (by relevance):
${topEntities.join(', ') || '(none)'}

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
            _webEntities: topEntities,
          })
        }
      } catch (e) {
        console.error('Claude interpretation failed, falling back:', e.message)
      }
    }

    // Fallback: return raw Vision data structured as best we can
    // Try to use best guess and entities to fill in
    return Response.json({
      title: bestGuess || topEntities[0] || '',
      subtitle: '',
      author: topEntities.find(e =>
        !e.toLowerCase().includes('book') &&
        !e.toLowerCase().includes('cookbook') &&
        !e.toLowerCase().includes('recipe')
      ) || '',
      publisher: '',
      _source: 'vision_only',
      _ocrText: ocrText.slice(0, 500),
      _webEntities: topEntities,
    })

  } catch (e) {
    console.error('OCR error:', e.message)
    return Response.json({ error: `OCR failed: ${e.message}` }, { status: 500 })
  }
}
