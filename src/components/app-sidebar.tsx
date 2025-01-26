"use client"
// import { useRouter } from 'next/navigation'
import * as React from "react"
import {
  MessageCircleQuestion,
  Search,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-react"

// import { NavFavorites } from "@/components/nav-favorites"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavWorkspaces } from "@/components/nav-workspaces"
import { NewPageChat } from "@/components/new-chat"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
// import { useMutation, useQuery } from "convex/react"
// import { api } from "../../convex/_generated/api"
// import { Id } from "../../convex/_generated/dataModel"


// This is sample data.
const data = {
  navMain: [
    {
      title: "Search",
      url: "#",
      icon: Search,
    },
    {
      title: "Ask AI",
      url: "#",
      icon: Sparkles,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
    },
    {
      title: "Trash",
      url: "#",
      icon: Trash2,
    },
    {
      title: "Help",
      url: "#",
      icon: MessageCircleQuestion,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // const router = useRouter()

  // const deleteChat = useMutation(api.chats.deleteChat)
  // const updateChat = useMutation(api.chats.update)

  // const handleClick = () => {
  //   // e.preventDefault()

  //   router.push("/dashboard/chat")
  // }
  // const handleDelete = async (id: Id<"chats">) => {
  //   const chatId = await deleteChat({ id })
  //   console.log(chatId)
  // }
  return (
    <Sidebar className="border-r-0" {...props}>
      <SidebarHeader>
        <NewPageChat />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        {/* <NavFavorites favorites={data.favorites} /> */}
        <NavWorkspaces />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
