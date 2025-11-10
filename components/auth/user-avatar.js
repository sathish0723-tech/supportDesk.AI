"use client";

import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * User Avatar Component
 * Displays the authenticated user's avatar
 * 
 * @param {Object} props - Component props
 * @param {string} props.className - Optional CSS classes
 * @returns {JSX.Element} User avatar
 */
export function UserAvatar({ className = "" }) {
  const { user, isLoaded } = useUser();

  if (!isLoaded || !user) {
    return null;
  }

  /**
   * Get user initials for fallback
   * 
   * @returns {string} User initials
   */
  const getInitials = () => {
    const name = user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || "User";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={className}>
      <AvatarImage 
        src={user.imageUrl || undefined} 
        alt={user.fullName || "User"} 
      />
      <AvatarFallback>
        {getInitials()}
      </AvatarFallback>
    </Avatar>
  );
}


