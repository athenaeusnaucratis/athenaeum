import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  let formData
  try {
    formData = await request.formData()
  } catch (e) {
    return Response.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!file || !file.size) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  const mediaType = file.type || 'image/jpeg'
  if (!validTypes.includes(mediaType)) {
    return Response.json({ error: `Unsupported image type: ${mediaType}` }, { status: 400 })
  }

  // Limit file size to 10MB
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: 'Image too large (max 10MB)' }, { status: 400 })
  }

  let base64
  try {
    const bytes = await file.arrayBuffer()
    base64 = Buffer.from(bytes).toString('base64')
  } catch (e) {
    return Response.json({ error: 'Failed to read image file' }, { status: 500 })
  }

  try {
    const response = await client.messages.create({
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

    const text = response.content[0]?.text ?? ''

    // Try to extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*?\}/)
    if (!jsonMatch) {
      return Response.json({
        title: '', subtitle: '', author: '', publisher: '',
        _warning: 'Could not parse structured data from cover'
      })
    }

    try {
      const parsed = JSON.parse(jsonMatch[0])
      return Response.json({
        title: parsed.title || '',
        subtitle: parsed.subtitle || '',
        author: parsed.author || '',
        publisher: parsed.publisher || '',
      })
    } catch {
      return Response.json({
        title: '', subtitle: '', author: '', publisher: '',
        _warning: 'Could not parse JSON from OCR response'
      })
    }
  } catch (e) {
    console.error('OCR API error:', e.message)
    return Response.json({ error: `OCR failed: ${e.message}` }, { status: 500 })
  }
}
