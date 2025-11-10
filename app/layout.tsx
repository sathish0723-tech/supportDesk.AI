import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import { ConditionalLayout } from '@/components/conditional-layout'

export const metadata: Metadata = {
  title: 'IT Industry Ticket Rising System',
  description: 'Support Desk - IT Industry Ticket Management System',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
