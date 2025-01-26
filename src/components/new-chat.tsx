"use client";

import * as React from "react";

import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import { useMutation } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useRouter } from "next/navigation";


export function NewPageChat() {
const router = useRouter();
  const createChat = useMutation(api.chats.createChat)
  const handleCreate = async () => {
    const chatId = await createChat({ title: "New Chat" })
    if (chatId) {
      router.push(`dashboard/chat/${chatId}`)
    }
  }
  return (
    <SidebarMenu className="flex flex-row items-center justify-between">
      <SidebarMenuItem>Menubar</SidebarMenuItem>
      <button onClick={handleCreate} className="flex flex-row items-center justify-center w-6 h-6 bg-transparent rounded-md hover:bg-muted">
        <Plus className="text-muted-foreground" />
      </button>
    </SidebarMenu>
  );
}
