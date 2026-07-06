/**
 * Upload an image to Cloudinary using unsigned upload.
 * Requires env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
 *
 * @param {Buffer|ArrayBuffer|Blob} fileData - image data
 * @param {object} options
 * @param {string} options.folder - Cloudinary folder (e.g. "athenaeum/covers")
 * @param {string} options.publicId - custom public_id (optional)
 * @param {string} options.transformation - e.g. "w_800,q_auto,f_auto"
 * @returns {{ url: string, publicId: string, bytes: number }}
 */
export async function uploadToCloudinary(fileData, options = {}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary credentials not configured')
  }

  // Convert to base64 data URI
  let base64
  if (Buffer.isBuffer(fileData)) {
    base64 = fileData.toString('base64')
  } else if (fileData instanceof ArrayBuffer) {
    base64 = Buffer.from(fileData).toString('base64')
  } else if (fileData.arrayBuffer) {
    // Blob/File
    const buf = await fileData.arrayBuffer()
    base64 = Buffer.from(buf).toString('base64')
  } else {
    throw new Error('Unsupported file data type')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const folder = options.folder || 'athenaeum'

  // Build params for signature
  const params = {
    folder,
    timestamp: String(timestamp),
    transformation: options.transformation || 'w_800,q_auto,f_auto',
  }
  if (options.publicId) params.public_id = options.publicId

  // Generate signature (sorted params + api_secret)
  const { createHash } = await import('crypto')
  const sortedParams = Object.keys(params)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&')
  const signature = createHash('sha1')
    .update(sortedParams + apiSecret)
    .digest('hex')

  // Upload via Cloudinary API
  const formData = new FormData()
  formData.append('file', `data:image/jpeg;base64,${base64}`)
  formData.append('api_key', apiKey)
  formData.append('timestamp', String(timestamp))
  formData.append('signature', signature)
  formData.append('folder', folder)
  formData.append('transformation', params.transformation)
  if (options.publicId) formData.append('public_id', options.publicId)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Cloudinary upload failed: ${res.status}`)
  }

  const data = await res.json()

  return {
    url: data.secure_url,
    publicId: data.public_id,
    bytes: data.bytes,
  }
}

/**
 * Delete an image from Cloudinary.
 * @param {string} publicId - the Cloudinary public_id
 */
export async function deleteFromCloudinary(publicId) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET

  if (!cloudName || !apiKey || !apiSecret) return

  const timestamp = Math.floor(Date.now() / 1000)
  const { createHash } = await import('crypto')
  const signature = createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex')

  await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      public_id: publicId,
      api_key: apiKey,
      timestamp,
      signature,
    }),
  })
}
