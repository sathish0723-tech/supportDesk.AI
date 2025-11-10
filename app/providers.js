"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Providers Component
 * Wraps the application with necessary context providers
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @param {Object} [props.session] - Optional initial session
 * @returns {JSX.Element} Provider wrapper
 */
export function Providers({ children, session = undefined }) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}

