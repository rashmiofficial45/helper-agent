"use client";

import React from "react";
import { useQuery } from "convex/react";
import { ChatInterface } from "@/components/chat-interface";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

interface ChatPageClientProps {
  chatId: Id<"chats">;
}

export default function ChatPageClient({ chatId }: ChatPageClientProps) {
  // useQuery here automatically attaches the Clerk token via ConvexProviderWithClerk.
  const initialChat = useQuery(api.messages.messageList, { chatId });

  if (!initialChat) {
    return <div>Loading chat...</div>;
  }

  return (
    <div className="flex-1 overflow-hidden">
      <ChatInterface chatId={chatId} initialChat={initialChat} />
    </div>
  );
}
