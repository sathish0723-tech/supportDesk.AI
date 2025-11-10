import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * Get the current user session on the server side
 * Use this in server components and API routes
 * 
 * @returns {Promise<Object|null>} Session object or null if not authenticated
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current authenticated user
 * Use this in server components and API routes
 * 
 * @returns {Promise<Object|null>} User object or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Check if the user is authenticated
 * Use this in server components and API routes
 * 
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated() {
  const session = await getSession();
  return !!session;
}

/**
 * Require authentication for a route
 * Throws an error if the user is not authenticated
 * 
 * @throws {Error} If user is not authenticated
 * @returns {Promise<Object>} User object
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Unauthorized");
  }
  
  return user;
}


