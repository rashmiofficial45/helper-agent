import { MoreHorizontal, Trash2 } from "lucide-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useMutation, useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Id } from "../../convex/_generated/dataModel"
import { useRouter } from "next/navigation"

export function NavWorkspaces() {
  const router = useRouter()
  const allChat = useQuery(api.chats.chatList)
    const deleteChat = useMutation(api.chats.deleteChat)
   const handleDelete = async (id: Id<"chats">) => {
    await deleteChat({ id })
  }
  const handleChatClick = (id:Id<"chats"> ,e: React.MouseEvent) => {
    e.preventDefault()
    router.push(`/dashboard/chat/${id}`)
  }
  if (!allChat) {
    return null
  }
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Chats</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {allChat.map((chats) => (
              <SidebarMenuItem key={chats._id}>
                <SidebarMenuButton onClick={(e)=>{handleChatClick(chats._id,e)}} asChild>
                  <a href="#">
                    <span className="px-1">{chats.title}</span>
                  </a>
                </SidebarMenuButton>
                <SidebarMenuAction onClick={() => handleDelete(chats._id)} showOnHover>
                <Trash2 />
                </SidebarMenuAction>
              </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <SidebarMenuButton className="text-sidebar-foreground/70">
              <MoreHorizontal />
              <span>More</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
