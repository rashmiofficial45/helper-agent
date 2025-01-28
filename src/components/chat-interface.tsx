"use client";

import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { ScrollArea } from "@/components/ui/scroll-area";
// import { Card } from "@/components/ui/card";
// import { Avatar } from "@/components/ui/avatar";
// import { Send, User, ArrowDown } from "lucide-react";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import { Input } from "./ui/input";

interface ChatInterfaceProps {
  chatId: Id<"chats">;
  initialChat: Doc<"messages">[];
}

export function ChatInterface({ chatId, initialChat }: ChatInterfaceProps) {
  const [messages, setMessages] = useState();
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading , setIsLoading] = useState(false);
  const handleSendMessage = (e:React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
  }

  return (
    <>
  <main className="flex flex-col h-[calc(100vh-4.5rem)] rounded-md">
  <section className="flex-1 overflow-y-auto">
    section:{chatId}
  </section>
  {/* the footer input component */}
  <footer>
  <div className="border-t rounded-xl bg-white/50 backdrop-blur-xl p-3 md:p-5">
          <div className="max-w-5xl mx-auto flex gap-3">
            <Input
              placeholder="Message AI Agent..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              // onKeyDown={handleKeyPress}
              className="flex-1 bg-white shadow-sm border-slate-200 focus-visible:ring-primary/50"
            />
            <Button
              size="icon"
              className="shadow-sm"
              disabled={isLoading || !inputMessage.trim()}
              onClick={handleSendMessage}
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
  </footer>
  </main>
    </>
  )
}
