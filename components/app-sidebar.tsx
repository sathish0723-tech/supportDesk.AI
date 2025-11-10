"use client"

import * as React from "react"
import { useUser } from "@clerk/nextjs"
import {
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  MessageSquare,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
} from "lucide-react"

import { NavMain } from '@/components/nav-main'
import { NavProjects } from '@/components/nav-projects'
import { NavUser } from '@/components/nav-user'
import { TeamSwitcher } from '@/components/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

// This is sample data.
const data = {
  teams: [
    {
      name: "SupportDesk.Ai",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
  ],
  navMain: [
    {
      title: "Platform",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
        },
        {
          title: "Tickets",
          url: "/Tickets",
        },
       
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Copilot",
          url: "/copilot",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title:"ChatTickets",
      url: "/ChatTickets",
      icon: MessageSquare,
      isActive: true,
      items: [
        {
          title: "Chat",
          url: "/Chat",
        },
      ],
    },
    {
      title:"Team",
      url: "/plarfrom/Team",
      icon: Users,
      isActive: true,
      items: [
        {
          title: "Team",
          url: "/plarfrom/Team",
        },
      ],
    }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoaded } = useUser()

  // Create user data from Clerk user or show placeholder
  const userData = user ? {
    name: user.fullName || user.firstName || user.emailAddresses[0]?.emailAddress?.split('@')[0] || "User",
    email: user.emailAddresses[0]?.emailAddress || "",
    avatar: user.imageUrl || "/placeholder-user.jpg",
  } : {
    name: "Guest",
    email: "Not signed in",
    avatar: "/placeholder-user.jpg",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
