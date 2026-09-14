export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',        // never index API routes
          '/admin',       // private
          '/login',
          '/add',
          '/auth/',
          '/location',    // private (admin only)
          '/location/',
        ],
      },
    ],
    sitemap: 'https://www.athenaeum-deipnon.com/sitemap.xml',
    host: 'https://www.athenaeum-deipnon.com',
  }
}
