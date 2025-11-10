"use client";

import { useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { AppProvider } from "@/contexts/app-context";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Conditional Layout Component
 * Shows sidebar and header only on authenticated pages
 * Hides them on login/signup/error pages
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Conditional layout
 */
export function ConditionalLayout({ children }) {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  // Pages that should not show sidebar/header
  const authPages = [
    "/auth",
    "/sign-in",
    "/sign-up",
    "/onboarding",
  ];

  // Check if current page is an auth page
  const isAuthPage = authPages.some(page => pathname.startsWith(page));

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If it's an auth page, show only the content without sidebar/header
  // Don't check isSignedIn for auth pages to prevent re-render loops
  if (isAuthPage) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  // If not signed in and not on auth page, show simple layout
  if (!isSignedIn) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  // For authenticated pages, show full layout with sidebar
  return (
    <AppProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b">
            <div className="flex items-center gap-2 px-4 w-full">
              <SidebarTrigger className="-ml-1 hover:bg-accent hover:text-accent-foreground" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link href="/dashboard" scroll={false}>
                        IT Industry Ticket System
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {pathname === "/dashboard" ? "Dashboard" : 
                       pathname === "/Tickets" || pathname === "/tickets" ? "Tickets" :
                       pathname === "/jobs" ? "Jobs" :
                       pathname === "/copilot" ? "Copilot" :
                       pathname === "/ChatTickets" ? "ChatTickets" :
                       pathname === "/Chat" ? "Chat" :
                       "Application"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AppProvider>
  );
}
