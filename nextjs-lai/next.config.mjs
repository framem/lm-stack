/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  async redirects() {
    return [
      // Old language-name URLs → ISO-code URLs (for bookmarks)
      { source: '/learn/language/Spanisch', destination: '/learn/language/es', permanent: true },
      { source: '/learn/language/Englisch', destination: '/learn/language/en', permanent: true },
      { source: '/learn/language/Deutsch', destination: '/learn/language/de', permanent: true },
      { source: '/learn/language/Franz%C3%B6sisch', destination: '/learn/language/fr', permanent: true },
      { source: '/learn/language/Italienisch', destination: '/learn/language/it', permanent: true },
    ]
  },
}

export default nextConfig
