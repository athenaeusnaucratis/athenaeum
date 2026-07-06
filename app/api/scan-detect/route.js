import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request) {
  const { image, width, height } = await request.json()

  if (!image) return Response.json({ error: 'No image provided' }, { status: 400 })

  const base64 = image.replace(/^data:image\/\w+;base64,/, '')

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
        },
        {
          type: 'text',
          text: `This photo contains a book. Identify the 4 corners of the book cover in pixel coordinates. The image is ${width}x${height} pixels. Return ONLY a JSON array of 4 objects in order: top-left, top-right, bottom-right, bottom-left. Each object has x and y properties. Example: [{"x":50,"y":30},{"x":580,"y":25},{"x":590,"y":800},{"x":45,"y":810}]. If no book is visible, return the 4 corners of the image with 5% margin.`,
        },
      ],
    }],
  })

  const text = msg.content[0]?.text || ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) {
    const m = 0.05
    return Response.json({
      corners: [
        { x: width * m, y: height * m },
        { x: width * (1 - m), y: height * m },
        { x: width * (1 - m), y: height * (1 - m) },
        { x: width * m, y: height * (1 - m) },
      ],
    })
  }

  try {
    const corners = JSON.parse(match[0])
    if (corners.length === 4 && corners.every(c => typeof c.x === 'number' && typeof c.y === 'number')) {
      return Response.json({ corners })
    }
  } catch {}

  const m = 0.05
  return Response.json({
    corners: [
      { x: width * m, y: height * m },
      { x: width * (1 - m), y: height * m },
      { x: width * (1 - m), y: height * (1 - m) },
      { x: width * m, y: height * (1 - m) },
    ],
  })
}
