"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import { Input } from "./ui/input";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { ChatRequestBody } from "@/lib/types";

interface ChatInterfaceProps {
  chatId: Id<"chats">;
  initialChat: Doc<"messages">[];
}

export function ChatInterface({ chatId, initialChat }: ChatInterfaceProps) {
  // State management for chat messages, input field, loading state, and streaming response
  const [messages, setMessages] = useState<Doc<"messages">[]>(initialChat);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [currentTool, setCurrentTool] = useState<{ name: string; input: string } | null>(null);

  // Ref for auto-scrolling the chat to the latest message
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Effect to scroll to bottom whenever messages or streamed response update
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedResponse]);

  // Function to scroll chat view to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handles sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputMessage.trim();

    // Prevent sending empty messages or if already in a loading state
    if (!trimmedInput || isLoading) return;

    // Reset UI state before sending
    setInputMessage("");
    setIsLoading(true);
    setStreamedResponse("");

    // Optimistic UI update: Show the user's message immediately before actual API response
    const optimisticMessage: Doc<"messages"> = {
      _id: `temp_${Date.now()}`, // Temporary ID until it's replaced by actual ID from backend
      chatId,
      content: trimmedInput,
      role: "user",
      createdAt: Date.now(),
    } as Doc<"messages">;

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      // Create request body for the API
      const requestBody: ChatRequestBody = {
        messages: messages.map((message) => ({
          content: message.content,
          role: message.role,
        })),
        newMessage: inputMessage,
        chatId,
      };

      // Send message to API endpoint for processing
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });


      if (response.ok) {
        const data = await response.json();
        console.log("Response data:", data);
        setStreamedResponse(data.response);
      }
      if (!response.body) {
        throw new Error("No response body");
      }
      // Handle response (You may need to update this to process streamed responses correctly)

    } catch (error) {
      console.error("Error sending message:", error);
      setMessages ((prev)=> prev.filter((message) => message._id !== optimisticMessage._id));
      setStreamedResponse(
        "error"
        // error goes here
      )
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  // Handles "Enter" keypress for sending message (Shift + Enter allows multiline input)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <main className="flex flex-col h-[calc(100vh-4.5rem)] rounded-md">
      {/* Chat messages display section */}
      <section className="flex-1 overflow-y-auto p-4">
        {/* Display chat ID for debugging purposes */}
        <div>chatId: {chatId}</div>

        {/* Render chat messages */}
        <div>
          {messages.map((message) => (
            <div key={message._id} className="p-2 border rounded-lg">
              <p>{message.content}</p>
            </div>
          ))}
        </div>

        {/* Placeholder for streamed responses (if applicable) */}
        {streamedResponse && (
          <div className="p-2 border rounded-lg bg-muted">
            <p>{streamedResponse}</p>
          </div>
        )}

        {/* Auto-scroll reference */}
        <div ref={messagesEndRef} />
      </section>

      {/* Chat input section */}
      <footer className="border-t rounded-xl bg-white/50 backdrop-blur-xl p-3 md:p-5">
        <div className="max-w-5xl mx-auto flex gap-3">
          {/* Message input field */}
          <Input
            placeholder="Message AI Agent..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-white shadow-sm border-slate-200 focus-visible:ring-primary/50"
            disabled={isLoading} // Disable input while loading
          />

          {/* Send button */}
          <Button
            size="icon"
            className="shadow-sm"
            disabled={isLoading || !inputMessage.trim()}
            onClick={handleSendMessage}
          >
            <Send size={16} />
          </Button>
        </div>
      </footer>
    </main>
  );
}
