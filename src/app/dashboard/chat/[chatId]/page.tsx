import React from 'react';
import { Id } from '../../../../../convex/_generated/dataModel';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
// import { getConvexClient } from '@/lib/convex';
// import { api } from '../../../../../convex/_generated/api';
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
  // we can also use useParams to get the dynamic route parameter
//   const convex = getConvexClient();
  console.log('chatId', chatId);
//   const initialChat = await convex.query(api.messages.getMessages, { chatId });
  return <div>Chat ID: {chatId}</div>;
};

export default ChatIdPage;
