import { MetadataRoute } from 'next'
import siteConfig from '@/config/site.json'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/chat', '/dms', '/friends', '/auth/'],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
