// Import necessary modules and types
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";
import {
  END,
  START,
  MessagesAnnotation,
  StateGraph,
  MemorySaver,
} from "@langchain/langgraph";
import SYSTEM_MESSAGE from "@/app/constants/system-message";
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  trimMessages,
} from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";

// ---------------------------------------------------------------------------
// Initialize the Tool Client and Wrap Tools in a ToolNode
// ---------------------------------------------------------------------------
const toolClient = new wxflows({
  endpoint: process.env.WXFLOWS_ENDPOINT || "",
  apikey: process.env.WXFLOWS_APIKEY,
});
const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools);

// ---------------------------------------------------------------------------
// Set Up the Message Trimmer
// ---------------------------------------------------------------------------
const trimmer = trimMessages({
  maxTokens: 10, // Token limit for the conversation history; adjust as needed
  strategy: "last", // Keep the most recent messages
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------
/**
 * Determines whether to continue processing the conversation by checking
 * the type of the last message.
 */
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the AI generated a tool call, route to the "tools" node.
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }

  // If the last message was produced by a tool, go back to the agent.
  if (lastMessage.content && lastMessage._getType() === "tool") {
    return "agent";
  }

  // Otherwise, the conversation is complete.
  return END;
}

/**
 * Adds caching headers to messages by wrapping the message content with metadata.
 * It caches the last message and, if found, the second-to-last human message.
 */
function addCachingHeaders(messages: BaseMessage[]): BaseMessage[] {
  if (!messages.length) return messages;

  const cachedMessages = [...messages];

  const addCache = (message: BaseMessage) => {
    message.content = [
      {
        type: "text",
        text: message.content as string,
        cache_control: { type: "ephemeral" },
      },
    ];
  };

  // Cache the last message
  addCache(cachedMessages.at(-1)!);

  // Cache the second-to-last human message (if present)
  let humanCount = 0;
  for (let i = cachedMessages.length - 1; i >= 0; i--) {
    if (cachedMessages[i] instanceof HumanMessage) {
      humanCount++;
      if (humanCount === 2) {
        addCache(cachedMessages[i]);
        break;
      }
    }
  }

  return cachedMessages;
}

// ---------------------------------------------------------------------------
// Initialize the LLM Model with Prompt Caching Enabled
// ---------------------------------------------------------------------------
/**
 * Initializes the ChatGoogleGenerativeAI model with additional options.
 * Here we bind external tools and enable prompt caching by including the
 * custom header "X-Goog-Prompt-Cache": "enabled".
 *
 * The options object (passed via client_options or additional_headers) is
 * forwarded to the underlying API client. Make sure your version of the library
 * supports this header (see, for example, GitHub discussions on LangChain's
 * Google GenAI integration).
 */
const initialiseModel = () => {
  const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-1.5-pro", // The latest Gemini model.
    apiKey: process.env.GOOGLE_API_KEY, // Your Google API key.
    temperature: 0.7,
    maxOutputTokens: 4096,
    maxRetries: 3,
    streaming: true,
    cache: true, // Enable LangChain's built-in caching.
    // Bind callbacks to log the start and end of API calls.
    callbacks: [
      {
        handleLLMStart: async () => {
          console.log("🤖 Starting LLM call...");
        },
        handleLLMEnd: async (output) => {
          console.log("🤖 End LLM call", output);
          const usage = output.llmOutput?.usage;
          if (usage) {
            console.log("📊 Token Usage:", {
              input_tokens: usage.input_tokens,
              output_tokens: usage.output_tokens,
              total_tokens: usage.input_tokens + usage.output_tokens,
            });
          }
        },
      },
    ],
  }).bindTools(tools); // Bind any external tools to the model.

  return model;
};

// ---------------------------------------------------------------------------
// Create the Conversation Workflow
// ---------------------------------------------------------------------------
/**
 * Creates the state graph for the conversation. It uses the agent node to
 * format the prompt (including the system message with caching settings) and
 * sends it to the LLM, while also handling tool calls.
 */
const createWorkflow = () => {
  const model = initialiseModel();

  return new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      // Use the system message; note that we also include caching settings in the system message.
      const systemContent = SYSTEM_MESSAGE;

      // Create a prompt template that includes the system message and a placeholder for messages.
      const promptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemContent, {
          "cache-control": { type: "ephemeral" },
        }),
        new MessagesPlaceholder("messages"),
      ]);

      // Trim the conversation history so it fits within token limits.
      const trimmedMessages = await trimmer.invoke(state.messages);

      // Build the final prompt using the prompt template.
      const prompt = await promptTemplate.invoke({ messages: trimmedMessages });

      // Invoke the LLM with the formatted prompt.
      const response = await model.invoke(prompt);

      return { messages: [response] };
    })
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue) // Route based on the last message.
    .addEdge("tools", "agent");
};

// ---------------------------------------------------------------------------
// Main Submission Function: Entry Point for User Questions
// ---------------------------------------------------------------------------
/**
 * Submits a question by first adding caching headers to the conversation
 * messages, then compiling and executing the workflow. The result is streamed
 * back as a series of events.
 *
 * @param messages - The conversation messages.
 * @param chatId - A unique identifier for the conversation session.
 * @returns A stream of events from the workflow execution.
 */
export async function submitQuestion(messages: BaseMessage[], chatId: string) {
  // Add caching headers to ensure prompt caching is active.
  const cachedMessages = addCachingHeaders(messages);

  // Create the workflow for handling the conversation.
  const workflow = createWorkflow();

  // Set up an in-memory checkpoint to save conversation state.
  const checkpointer = new MemorySaver();
  const app = workflow.compile({ checkpointer });

  // Start streaming events from the workflow.
  const stream = await app.streamEvents(
    { messages: cachedMessages },
    {
      version: "v2",
      configurable: { thread_id: chatId },
      streamMode: "messages",
      runId: chatId,
    }
  );
  return stream;
}
