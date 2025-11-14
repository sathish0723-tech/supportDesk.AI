import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { ClerkProvider } from '@clerk/nextjs'
import Script from 'next/script'
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
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable. ' +
      'Please set it in your Vercel project settings or .env.local file. ' +
      'Get your key at https://dashboard.clerk.com/last-active?path=api-keys'
    )
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
          <Analytics />
          <Script id="verify-email-loop-prevention" strategy="afterInteractive">
            {`
              (function() {
                let redirectCount = 0;
                const MAX_REDIRECTS = 3;
                const REDIRECT_KEY = 'clerk_verify_redirect_count';
                const LAST_REDIRECT_KEY = 'clerk_verify_last_redirect';
                
                function checkLoop() {
                  const currentPath = window.location.pathname;
                  
                  if (currentPath.includes('verify-email-address')) {
                    const count = parseInt(sessionStorage.getItem(REDIRECT_KEY) || '0', 10);
                    const lastRedirect = parseInt(sessionStorage.getItem(LAST_REDIRECT_KEY) || '0', 10);
                    const timeSinceLastRedirect = Date.now() - lastRedirect;
                    
                    if (count >= MAX_REDIRECTS && timeSinceLastRedirect < 5000) {
                      console.warn('⚠️ Email verification loop detected! Redirecting to /onboarding');
                      sessionStorage.removeItem(REDIRECT_KEY);
                      sessionStorage.removeItem(LAST_REDIRECT_KEY);
                      window.location.href = '/onboarding';
                      return;
                    }
                    
                    sessionStorage.setItem(REDIRECT_KEY, String(count + 1));
                    sessionStorage.setItem(LAST_REDIRECT_KEY, String(Date.now()));
                  } else {
                    sessionStorage.removeItem(REDIRECT_KEY);
                    sessionStorage.removeItem(LAST_REDIRECT_KEY);
                  }
                }
                
                checkLoop();
                setTimeout(checkLoop, 2000);
              })();
            `}
          </Script>
        </body>
      </html>
    </ClerkProvider>
  )
}
