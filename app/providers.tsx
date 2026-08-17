'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

// PostHog project API keys are public/client-side by design. The env var lets
// deployments override it; this default keeps analytics working out of the box.
const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ?? 'phc_ogyD4RnGhCtk6cNFN4XUVDrG9NdEFWi6AJ6SSgSubT8e'
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      // The 2026-05-30 defaults enable SPA pageview + pageleave capture and
      // other recommended settings, so no manual $pageview tracking is needed.
      defaults: '2026-05-30',
      person_profiles: 'identified_only', // or 'always' to create profiles for anonymous users as well
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
