// Google Analytics Configuration
export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    return
  }

  // Load Google Analytics script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`
  document.head.appendChild(script)

  // Initialize gtag
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_TRACKING_ID, {
    page_title: document.title,
    page_location: window.location.href,
  })
}

// Track page views
export const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
      page_title: title || document.title,
    })
  }
}

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Track user engagement
export const trackUserEngagement = (engagementTimeMs: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'user_engagement', {
      engagement_time_msec: engagementTimeMs,
    })
  }
}

// Track e-commerce events
export const trackPurchase = (
  transactionId: string,
  value: number,
  currency: string = 'COP',
  items?: Array<{
    item_id: string
    item_name: string
    price: number
    quantity: number
  }>
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      value: value,
      currency: currency,
      items: items,
    })
  }
}

// Track add to cart
export const trackAddToCart = (
  itemId: string,
  itemName: string,
  price: number,
  quantity: number = 1,
  currency: string = 'COP'
) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: currency,
      value: price * quantity,
      items: [
        {
          item_id: itemId,
          item_name: itemName,
          price: price,
          quantity: quantity,
        },
      ],
    })
  }
}

// Track user registration
export const trackSignUp = (method: string = 'email') => {
  trackEvent('sign_up', 'engagement', method)
}

// Track user login
export const trackLogin = (method: string = 'email') => {
  trackEvent('login', 'engagement', method)
}

// Track event views
export const trackEventView = (eventId: string, eventName: string, category: string) => {
  trackEvent('view_item', 'engagement', eventName, undefined)
}

// Track ticket selection
export const trackTicketSelection = (
  eventId: string,
  eventName: string,
  ticketType: string,
  price: number
) => {
  trackEvent('select_item', 'ecommerce', ticketType, price)
  trackAddToCart(eventId, `${eventName} - ${ticketType}`, price)
}

// Track checkout steps
export const trackBeginCheckout = (value: number, currency: string = 'COP') => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: currency,
      value: value,
    })
  }
}

// Track form submissions
export const trackFormSubmission = (formName: string, success: boolean) => {
  trackEvent(
    success ? 'form_submit' : 'form_error',
    'engagement',
    formName
  )
}

// Track search
export const trackSearch = (searchTerm: string, resultsCount?: number) => {
  trackEvent('search', 'engagement', searchTerm, resultsCount)
}

// Track file uploads
export const trackFileUpload = (fileType: string, fileSize: number) => {
  trackEvent('file_upload', 'engagement', fileType, fileSize)
}

// Track admin actions
export const trackAdminAction = (action: string, resource: string) => {
  trackEvent(action, 'admin', resource)
}

// Track errors
export const trackError = (errorType: string, errorMessage: string) => {
  trackEvent('exception', 'error', errorType)
}

// Track performance
export const trackPerformance = (metric: string, value: number) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: metric,
      value: value,
    })
  }
}

// Declare global types
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}
