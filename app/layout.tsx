import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import CookieConsent from '@/components/CookieConsent'
import { BrowserSessionProvider } from '@/components/browser-session-provider'
import { SessionTimeoutProvider } from '@/components/session-timeout-provider'
import { SessionExpiredNotification } from '@/components/session-expired-notification'
import MainHeader from '@/components/main-header'
import { Footer } from '@/components/footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL?.startsWith('http') ? process.env.NEXT_PUBLIC_APP_URL : 'https://appdemo-production.up.railway.app'),
  title: 'Eventu - Tickets a un Click',
  description: 'Plataforma completa para la gestión y venta de eventos',
  keywords: 'eventos, tickets, boletos, venta, gestión',
  authors: [{ name: 'Eventu Team' }],
  robots: 'index, follow',
  icons: {
    icon: '/icono-eventu.ico',
  },
  openGraph: {
    title: 'Eventu - Tickets a un Click',
    description: 'Plataforma completa para la gestión y venta de eventos',
    type: 'website',
    locale: 'es_ES',
    images: [
      {
        url: '/images/icono-eventu.ico',
        width: 1200,
        height: 630,
        alt: 'Eventu - Tickets a un Click',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Eventu - Plataforma de Eventos',
    description: 'Plataforma completa para la gestión y venta de eventos',
    images: ['/images/eventu-logo.svg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

// Deshabilitar prerenderizado para esta aplicación
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <BrowserSessionProvider>
            <SessionTimeoutProvider>
              <div className="min-h-screen bg-background flex flex-col">
                <MainHeader />
                <main className="flex-1">
                  {children}
                </main>
                <Footer />
              </div>
              <Toaster />
              <CookieConsent />
              <SessionExpiredNotification />
            </SessionTimeoutProvider>
          </BrowserSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}