"use client";

import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

/**
 * Sign Out Button Component
 * Provides a button to sign out the user
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Optional CSS classes
 * @param {string} props.variant - Button variant
 * @param {React.ReactNode} props.children - Button content
 * @returns {JSX.Element} Sign out button
 */
export function SignOutButton({ 
  className = "", 
  variant = "outline",
  children = "Sign Out"
}) {
  const { signOut } = useClerk()

  /**
   * Handle sign out
   * Clears session and redirects to home page
   */
  const handleSignOut = async () => {
    await signOut({ 
      redirectUrl: "/auth" 
    });
  };

  return (
    <Button 
      onClick={handleSignOut} 
      variant={variant}
      className={className}
    >
      {children}
    </Button>
  );
}


