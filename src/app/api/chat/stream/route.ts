import { getConvexClient } from "@/lib/convex";
import {
  ChatRequestBody,
  SSE_DATA_PREFIX,
  SSE_LINE_DELIMITER,
  StreamMessage,
  StreamMessageType,
} from "@/lib/types";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { api } from "../../../../../convex/_generated/api";

// Utility function to send Server-Sent Events (SSE) messages to the client
function sendSSEMessage(
  writer: WritableStreamDefaultWriter<Uint8Array>,
  data: StreamMessage
) {
  const encoder = new TextEncoder();
  return writer.write(
    encoder.encode(
      `${SSE_DATA_PREFIX}${JSON.stringify(data)}${SSE_LINE_DELIMITER}`
    )
  );
}

// Handles POST request to process and stream AI chat responses
export async function POST(req: NextRequest) {
  try {
    // Step 1: Authenticate the user using Clerk
    const user = await auth();

    if (!user) {
      return new NextResponse("Unauthorized Request", { status: 401 });
    }

    // Step 2: Parse the request body and extract relevant chat details
    const body = (await req.json()) as ChatRequestBody;
    const { messages, newMessage, chatId } = body;

    // Step 3: Initialize the Convex client for database interaction
    const convex = getConvexClient();

    // Step 4: Create a TransformStream for real-time streaming of AI responses
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Step 5: Prepare the response object with appropriate headers for streaming
    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disables buffering for real-time streaming
      },
    });

    // Function to handle streaming of messages
    const startStream = async () => {
      try {
        // Step 6: Send initial connection message to the frontend
        await sendSSEMessage(writer, { type: StreamMessageType.Connected });

        // Step 7: Store the new message in the Convex database
        await convex.mutation(api.messages.sendMessages, {
          chatId,
          content: newMessage,
        });

        // // Step 8: Simulate AI processing & response streaming (Replace with real AI logic)
        // const aiResponses = [
        //     "Thinking...",
        //     "Analyzing your request...",
        //     `You said: "${newMessage}"`,
        //     "Here's my AI-generated response..."
        // ];

        // for (const responseText of aiResponses) {
        //     await sendSSEMessage(writer, { type: StreamMessageType.Message, content: responseText });
        //     await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated delay
        // }

        // // Step 9: Notify client that streaming has finished
        // await sendSSEMessage(writer, { type: StreamMessageType.Complete });

        // // Step 10: Close the writer
        // await writer.close();
      } catch (err) {
        console.error("Error during streaming:", err);
        await sendSSEMessage(writer, {
          type: StreamMessageType.Error,
          error: "Error processing chat",
        });
        await writer.close();
      }
    };
    // Step 11: Start streaming process
    startStream();

    return response; // Return the streaming response
  } catch (error) {
    console.error("Server Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
