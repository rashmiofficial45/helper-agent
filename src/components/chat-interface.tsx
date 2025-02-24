"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Send } from "lucide-react";
import { Input } from "./ui/input";
import { Doc, Id } from "../../convex/_generated/dataModel";
import { ChatRequestBody, StreamMessageType } from "@/lib/types";
import { createSSEParser } from "@/lib/SSEParcer";
import { getConvexClient } from "@/lib/convex";
import { api } from "../../convex/_generated/api";
import { MessageBubble } from "./message-bubble";
import WelcomeMessage from "./welcome-message";

// ---------------------------------------------------------------------------
// ChatInterfaceProps: Component props type definition
// ---------------------------------------------------------------------------
interface ChatInterfaceProps {
  chatId: Id<"chats">;
  initialChat: Doc<"messages">[];
}

// ---------------------------------------------------------------------------
// ChatInterface Component
// ---------------------------------------------------------------------------
export function ChatInterface({ chatId, initialChat }: ChatInterfaceProps) {
  // ---------------------------------------------------------------------------
  // State Management:
  // - messages: array of chat messages (from Convex DB).
  // - inputMessage: current text in the message input field.
  // - isLoading: indicates whether a message is being sent and processed.
  // - streamedResponse: holds partial response received from the server.
  // - currentTool: holds info about a tool invocation (if any).
  // ---------------------------------------------------------------------------
  const [messages, setMessages] = useState<Doc<"messages">[]>(initialChat);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const [currentTool, setCurrentTool] = useState<{ name: string; input: string } | null>(null);

  // ---------------------------------------------------------------------------
  // Ref for Auto-Scrolling:
  // A reference to the element at the end of the chat list to ensure we scroll down.
  // ---------------------------------------------------------------------------
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // useEffect: Scroll to bottom when messages or streamedResponse update.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedResponse]);

  // ---------------------------------------------------------------------------
  // formatToolOutput:
  // This function formats tool input and output into a terminal-like HTML snippet.
  // ---------------------------------------------------------------------------
  const formatToolOutput = (output: unknown): string => {
    if (typeof output === "string") return output;
    return JSON.stringify(output, null, 2);
  };



   /**
 * Generates formatted HTML to represent terminal-like output for a given tool's execution.
 *
 * @param {string} tool - The name of the tool being executed.
 * @param {unknown} input - The input provided to the tool; can be of any data type.
 * @param {unknown} output - The output returned by the tool; can be of any data type.
 * @returns {string} - A string containing HTML that formats the tool's input and output in a styled terminal-like appearance.
 */
const formatTerminalOutput = (
  tool: string,
  input: unknown,
  output: unknown
)  => {
  // Construct the HTML structure for displaying the tool's input and output
  const terminalHtml = `
    <div class="bg-[#1e1e1e] text-white font-mono p-2 rounded-md my-2 overflow-x-auto whitespace-normal max-w-[600px]">
      <!-- Header section with colored dots and tool name -->
      <div class="flex items-center gap-1.5 border-b border-gray-700 pb-1">
        <span class="text-red-500">●</span>
        <span class="text-yellow-500">●</span>
        <span class="text-green-500">●</span>
        <span class="text-gray-400 ml-1 text-sm">~/${tool}</span>
      </div>
      <!-- Section displaying the tool's input -->
      <div class="text-gray-400 mt-1">$ Input</div>
      <pre class="text-yellow-400 mt-0.5 whitespace-pre-wrap overflow-x-auto">${formatToolOutput(input)}</pre>
      <!-- Section displaying the tool's output -->
      <div class="text-gray-400 mt-2">$ Output</div>
      <pre class="text-green-400 mt-0.5 whitespace-pre-wrap overflow-x-auto">${formatToolOutput(output)}</pre>
    </div>
  `;

  // Return the formatted HTML wrapped with delimiters
  return `---START---\n${terminalHtml}\n---END---`;
};


  // ---------------------------------------------------------------------------
  // scrollToBottom:
  // Scrolls the chat view to the latest message using the messagesEndRef.
  // ---------------------------------------------------------------------------
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ---------------------------------------------------------------------------
  // processStream:
  // Reads a ReadableStream from the SSE response.
  // Continuously decodes each chunk and passes it to the provided onChunk callback.
  // ---------------------------------------------------------------------------
  const processStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onChunk: (chunk: string) => Promise<void>
  ) => {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        await onChunk(new TextDecoder().decode(value));
      }
    } finally {
      reader.releaseLock();
    }
  };

  // ---------------------------------------------------------------------------
  // handleSendMessage:
  // Called when the user submits a message.
  // - Prevents empty messages and ignores if a message is already processing.
  // - Resets UI state, updates UI optimistically, and sends the message to the backend.
  // ---------------------------------------------------------------------------
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputMessage.trim();

    // Do not proceed if input is empty or a request is in progress
    if (!trimmedInput || isLoading) return;

    // -------------------------------------------------------------------------
    // Reset UI state: Clear the input and indicate loading.
    // -------------------------------------------------------------------------
    setInputMessage("");
    setIsLoading(true);
    setStreamedResponse("");

    // -------------------------------------------------------------------------
    // Optimistic UI Update:
    // Immediately add the user's message to the messages list with a temporary ID.
    // -------------------------------------------------------------------------
    const optimisticMessage: Doc<"messages"> = {
      _id: `temp_${Date.now()}`, // Temporary ID for display until confirmed by backend
      chatId,
      content: trimmedInput,
      role: "user",
      createdAt: Date.now(),
      _creationTime: Date.now(),
    } as Doc<"messages">;
    setMessages((prev) => [...prev, optimisticMessage]);

    let fullResponse = "";

    try {
      // -------------------------------------------------------------------------
      // Prepare the request body for the API call.
      // The body contains:
      // - The list of previous messages (mapped to {content, role}).
      // - The new message to send.
      // - The chatId for reference.
      // -------------------------------------------------------------------------
      const requestBody: ChatRequestBody = {
        messages: messages.map((message) => ({
          content: message.content,
          role: message.role,
        })),
        newMessage: trimmedInput,
        chatId,
      };

      // -------------------------------------------------------------------------
      // Send the POST request to the backend chat stream endpoint.
      // Note: The extra header "X-Goog-Prompt-Cache": "enabled" is included here.
      // -------------------------------------------------------------------------
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "X-Goog-Prompt-Cache": "enabled", // Custom header to enable prompt caching
        },
        body: JSON.stringify(requestBody),
      });
      console.log("Response:", response);
      // If the response returns JSON (non-streamed), update the streamedResponse state.
      // if (response.ok) {
      //   const data = await response.json();
      //   console.log("Response data:", data);
      //   setStreamedResponse(data.response);
      // }

      if (!response.body) {
        throw new Error("No response body");
      }

      // -------------------------------------------------------------------------
      // Create SSE Parser and get a stream reader from the response body.
      // -------------------------------------------------------------------------
      const parser = createSSEParser();
      const reader = response.body.getReader();

      // -------------------------------------------------------------------------
      // Process the SSE stream:
      // For each chunk of data, decode and parse it, then update the UI based on message type.
      // -------------------------------------------------------------------------
      await processStream(reader, async (chunk) => {
        const sseMessages = parser.parse(chunk);
        for (const message of sseMessages) {
          switch (message.type) {
            case StreamMessageType.Token:
              // Append each token to the full response and update state.
              if ("token" in message) {
                fullResponse += message.token;
                setStreamedResponse(fullResponse);
              }
              break;

            case StreamMessageType.ToolStart:
              // When a tool is starting, update currentTool state and append formatted output.
              if ("tool" in message) {
                setCurrentTool({
                  name: message.tool,
                  input: message.input as string,
                });
                fullResponse += formatTerminalOutput(
                  message.tool,
                  message.input,
                  "Processing..."
                );
                setStreamedResponse(fullResponse);
              }
              break;

            case StreamMessageType.ToolEnd:
              // When a tool finishes, replace the placeholder with the actual output.
              if ("tool" in message && currentTool) {
                const lastTerminalIndex = fullResponse.lastIndexOf(
                  '<div class="bg-[#1e1e1e]'
                );
                if (lastTerminalIndex !== -1) {
                  fullResponse =
                    fullResponse.substring(0, lastTerminalIndex) +
                    formatTerminalOutput(
                      message.tool,
                      currentTool.input,
                      message.output
                    );
                  setStreamedResponse(fullResponse);
                }
                setCurrentTool(null);
              }
              break;

            case StreamMessageType.Error:
              // If an error message is received, throw an error to be caught below.
              if ("error" in message) {
                console.error(message.error);
                throw new Error(message.error);
              }
              break;

            case StreamMessageType.Done:
              // When the stream is complete, create an assistant message.
              const assistantMessage: Doc<"messages"> = {
                _id: `temp_assistant_${Date.now()}`,
                chatId,
                content: fullResponse,
                role: "bot",
                createdAt: Date.now(),
                _creationTime: Date.now(),
              } as Doc<"messages">;
              // Save the assistant message to the database.
              const convex = getConvexClient();
              // ERROR: Still getting error here; Need to fix this
              await convex.mutation(api.messages.store, {
                chatId,
                content: fullResponse,
                role: "bot",
              });
              // Update the messages state with the final assistant message.
              setMessages((prev) => [...prev, assistantMessage]);
              // Clear the streamedResponse state.
              setStreamedResponse("");
              return; // Exit stream processing
          }
        }
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the optimistic message if an error occurs.
      setMessages((prev) =>
        prev.filter((message) => message._id !== optimisticMessage._id)
      );
      setStreamedResponse("error");
    } finally {
      // Reset loading state after processing completes
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // handleKeyPress:
  // Triggers handleSendMessage on "Enter" keypress unless Shift+Enter is used.
  // ---------------------------------------------------------------------------
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  // ---------------------------------------------------------------------------
  // Render Chat Interface:
  // - Display chat messages and any streamed response.
  // - Provide an input field and send button.
  // - Use a ref to auto-scroll to the latest message.
  // ---------------------------------------------------------------------------
  return (
    <main className="flex flex-col h-[calc(100vh-4.5rem)] rounded-md">
      {/* Chat messages display section */}
      <section className="flex-1 overflow-y-auto bg-gray-50 p-2 md:p-0">
        <div className="max-w-4xl mx-auto p-4 space-y-3">
          {messages?.length === 0 && <WelcomeMessage />}

          {messages?.map((message: Doc<"messages">) => (
            <MessageBubble
              key={message._id}
              content={message.content}
              isUser={message.role === "user"}
            />
          ))}

          {streamedResponse && <MessageBubble content={streamedResponse} />}

          {/* Loading indicator */}
          {isLoading && !streamedResponse && (
            <div className="flex justify-start animate-in fade-in-0">
              <div className="rounded-2xl px-4 py-3 bg-white text-gray-900 rounded-bl-none shadow-sm ring-1 ring-inset ring-gray-200">
                <div className="flex items-center gap-1.5">
                  {[0.3, 0.15, 0].map((delay, i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce"
                      style={{ animationDelay: `-${delay}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </section>

      {/* Chat input section */}
      <footer className="border-t rounded-xl bg-white/50 backdrop-blur-xl p-3 md:p-5">
        <div className="max-w-5xl mx-auto flex gap-3">
          {/* Input field for user to type their message */}
          <Input
            placeholder="Message AI Agent..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1 bg-white shadow-sm border-slate-200 focus-visible:ring-primary/50"
            disabled={isLoading}
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
