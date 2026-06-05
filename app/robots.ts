import type { MetadataRoute } from 'next'
import { isPrelaunchLockEnabled } from '@/lib/prelaunch'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (isPrelaunchLockEnabled()) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  return {
    rules: {
      userAgent: '*',
      disallow: '/',
    },
  }
}
