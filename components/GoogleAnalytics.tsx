"use client"

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initGA, trackPageView } from '@/lib/analytics'

export default function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check consent before initializing
    const analyticsConsent = localStorage.getItem('analytics-consent')
    if (analyticsConsent === 'true') {
      // Initialize Google Analytics with consent
      initGA()
      
      // Set consent to granted
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'update', {
          'analytics_storage': 'granted'
        })
      }
    } else {
      // Initialize with consent denied
      initGA()
      
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('consent', 'default', {
          'analytics_storage': 'denied'
        })
      }
    }
  }, [])

  useEffect(() => {
    // Track page views only if consent is granted
    const analyticsConsent = localStorage.getItem('analytics-consent')
    if (analyticsConsent === 'true' && pathname) {
      const url = pathname + (searchParams?.toString() || '')
      trackPageView(url)
    }
  }, [pathname, searchParams])

  return null
}
