import React from 'react';
import { Id } from '../../../../../convex/_generated/dataModel';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getConvexClient } from '@/lib/convex';
import { api } from '../../../../../convex/_generated/api';
import { ChatInterface } from '@/components/chat-interface';
interface ChatIdPageProps {
    params: Promise<{
        chatId: Id<"chats">;
    }>;
    }
const ChatIdPage = async ({params}:ChatIdPageProps) => {
  const { chatId } = await params //
  const authenticated = await auth()
    if (!authenticated) {
        redirect('/')
    }

    try {
        const convex = getConvexClient()
        console.log('chatId', chatId);
        const initialChat = await convex.query(api.messages.messageList, { chatId })
        return <div>
          <ChatInterface chatId={chatId} initialChat={initialChat} />
        </div>
    }
    catch (error) {
        console.error("Error fetching chat", error)
        redirect('/dashboard')
    }
}

export default ChatIdPage;
