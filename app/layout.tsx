import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import OneSignalInit from '@/components/OneSignalInit'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pétala — conteúdo exclusivo',
  description: 'Conteúdo exclusivo de criadoras brasileiras',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Pétala',
  },
  openGraph: {
    title: 'Pétala',
    description: 'Conteúdo exclusivo de criadoras brasileiras',
    url: 'https://petala.app',
    siteName: 'Pétala',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ff4d7d',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-96x96.png" />
      </head>
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <OneSignalInit />
        {children}
      </body>
    </html>
  )
}
