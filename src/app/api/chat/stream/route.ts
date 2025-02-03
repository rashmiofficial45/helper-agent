import { submitQuestion } from "@/lib/langgraph";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { AIMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { getConvexClient } from "@/lib/convex";
import {
  ChatRequestBody,
  StreamMessage,
  StreamMessageType,
  SSE_DATA_PREFIX,
  SSE_LINE_DELIMITER,
} from "@/lib/types";
import { api } from "../../../../../convex/_generated/api";

// ---------------------------------------------------------------------------
// Specify Edge Runtime
// ---------------------------------------------------------------------------
export const runtime = "edge";

/**
 * Utility function to send a Server-Sent Events (SSE) message.
 *
 * This function encodes the provided data (a StreamMessage) as a JSON string,
 * prefixed and suffixed with SSE-specific delimiters, and writes it to the provided writer.
 *
 * @param writer - The writer from a TransformStream for SSE.
 * @param data - The StreamMessage to send.
 * @returns A Promise that resolves when the data is written.
 **/
function sendSSEMessage(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  data: StreamMessage
) {
  const encoder = new TextEncoder();
  return writer.write(
    encoder.encode(
      // Format the message as per SSE: "data: {JSON}\n\n"
      `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`
    )
  );
}

// ---------------------------------------------------------------------------
// Main POST Handler for the Chat API
// ---------------------------------------------------------------------------
/**
 * POST handler that processes an incoming chat request and streams the AI response back to the client.
 *
 * This endpoint:
 *  1. Authenticates the user via Clerk.
 *  2. Parses the request body to extract the conversation messages, the new message, and the chat ID.
 *  3. Persists the new message in the Convex database.
 *  4. Converts the messages into LangChain message objects.
 *  5. Invokes a LangChain workflow (via submitQuestion) to stream AI responses.
 *  6. Uses Server-Sent Events (SSE) to continuously stream updates back to the client.
 *
 * @param req - The incoming HTTP Request.
 * @returns A Response object with SSE streaming headers.
 */
export async function POST(req: Request) {
  try {
    // -------------------------------------------------------------------------
    // Step 1: Authenticate the user using Clerk
    // -------------------------------------------------------------------------
    const { userId } = await auth();
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    // -------------------------------------------------------------------------
    // Step 2: Parse the incoming request body as ChatRequestBody.
    // -------------------------------------------------------------------------
    const { messages, newMessage, chatId } = (await req.json()) as ChatRequestBody;

    // -------------------------------------------------------------------------
    // Step 3: Initialize the Convex client for database interactions.
    // -------------------------------------------------------------------------
    const convex = getConvexClient();

    // -------------------------------------------------------------------------
    // Step 4: Create a TransformStream for SSE with a larger highWaterMark for performance.
    // -------------------------------------------------------------------------
    const stream = new TransformStream({}, { highWaterMark: 1024 });
    const writer = stream.writable.getWriter();

    // -------------------------------------------------------------------------
    // Step 5: Create the Response object with headers for Server-Sent Events.
    // -------------------------------------------------------------------------
    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Required for proper real-time streaming on certain servers (e.g., nginx)
      },
    });

    // -------------------------------------------------------------------------
    // Step 6: Start the asynchronous process to handle and stream chat responses.
    // -------------------------------------------------------------------------
    (async () => {
      try {
        // ---------------------------------------------------------------------
        // Send an initial connection message to the client.
        // ---------------------------------------------------------------------
        await sendSSEMessage(writer, { type: StreamMessageType.Connected });

        // ---------------------------------------------------------------------
        // Step 7: Save the new chat message into the Convex database.
        // ---------------------------------------------------------------------
        await convex.mutation(api.messages.sendMessages, {
          chatId,
          content: newMessage,
        });

        // ---------------------------------------------------------------------
        // Step 8: Convert the existing messages into LangChain message objects.
        // ---------------------------------------------------------------------
        // For each incoming message, if the role is "user", wrap it in a HumanMessage;
        // otherwise, treat it as an AIMessage. Append the new message as a HumanMessage.
        const langChainMessages = [
          ...messages.map((msg) =>
            msg.role === "user"
              ? new HumanMessage(msg.content)
              : new AIMessage(msg.content)
          ),
          new HumanMessage(newMessage),
        ];

        // ---------------------------------------------------------------------
        // Step 9: Invoke the LangChain workflow to process the conversation.
        // The submitQuestion function returns an async iterator of events.
        // ---------------------------------------------------------------------
        const eventStream = await submitQuestion(langChainMessages, chatId);

        // ---------------------------------------------------------------------
        // Step 10: Process and stream the events as SSE messages.
        // ---------------------------------------------------------------------
        for await (const event of eventStream) {
          // If the event indicates streaming tokens from the chat model:
          if (event.event === "on_chat_model_stream") {
            const token = event.data.chunk;
            if (token) {
              // Extract the text token from the token chunk.
              const text = token.content.at(0)?.["text"];
              if (text) {
                await sendSSEMessage(writer, {
                  type: StreamMessageType.Token,
                  token: text,
                });
              }
            }
          }
          // If a tool invocation is starting:
          else if (event.event === "on_tool_start") {
            await sendSSEMessage(writer, {
              type: StreamMessageType.ToolStart,
              tool: event.name || "unknown",
              input: event.data.input,
            });
          }
          // If a tool invocation has finished:
          else if (event.event === "on_tool_end") {
            // Wrap the tool's output in a ToolMessage.
            const toolMessage = new ToolMessage(event.data.output);
            await sendSSEMessage(writer, {
              type: StreamMessageType.ToolEnd,
              tool: toolMessage.lc_kwargs.name || "unknown",
              output: event.data.output,
            });
          }
          // Additional event types can be added here.
        }

        // ---------------------------------------------------------------------
        // Step 11: After processing all events, send a completion message.
        // ---------------------------------------------------------------------
        await sendSSEMessage(writer, { type: StreamMessageType.Done });
      } catch (streamError) {
        console.error("Error in event stream:", streamError);
        // If an error occurs, send an error SSE message to the client.
        await sendSSEMessage(writer, {
          type: StreamMessageType.Error,
          error:
            streamError instanceof Error
              ? streamError.message
              : "Stream processing failed",
        });
      } finally {
        // ---------------------------------------------------------------------
        // Step 12: Close the writer and release its lock to complete the SSE.
        // ---------------------------------------------------------------------
        try {
          await writer.close();
        } catch (closeError) {
          console.error("Error closing writer:", closeError);
        }
        writer.releaseLock();
      }
    })();

    // Return the streaming response immediately so that the client can begin receiving events.
    return response;
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { error: "Failed to process chat request" } as const,
      { status: 500 }
    );
  }
}
