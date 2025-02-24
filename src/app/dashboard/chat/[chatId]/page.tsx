import ChatPageClient from "@/components/ChatPageClient";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Id } from "../../../../../convex/_generated/dataModel";

interface ChatPageProps {
  params: {
    chatId: Id<"chats">;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params;

  // Check authentication on the server.
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  // Simply render the client component, which will use automatic token injection.
  return <ChatPageClient chatId={chatId} />;
}
