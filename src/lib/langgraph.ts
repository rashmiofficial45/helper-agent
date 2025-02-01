import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import wxflows from "@wxflows/sdk/langchain";
import {
  END,
  START,
  MessagesAnnotation,
  StateGraph,
} from "@langchain/langgraph";
import SYSTEM_MESSAGE from "@/app/constants/system-message";
import { SystemMessage, trimMessages } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

// feat: add manual tools like comments at https://dummyjson.com/comments
// Note: enable prompt caching for the Google API calls to avoid hitting rate limits.

// Initialize the tool client
const toolClient = new wxflows({
  endpoint: process.env.WXFLOWS_ENDPOINT || "",
  apikey: process.env.WXFLOWS_APIKEY,
});

// Create a trimmer to limit conversation history (using a simple token counter)
const trimmer = trimMessages({
  maxTokens: 10,
  strategy: "last",
  tokenCounter: (msgs) => msgs.length,
  includeSystem: true,
  allowPartial: false,
  startOn: "human",
});

// Retrieve the tools from the tool client and wrap them in a ToolNode
const tools = await toolClient.lcTools;
const toolNode = new ToolNode(tools);

// Initialize the LLM provider (Google Gemini 1.5 Pro) with tool support, prompt caching, and streaming enabled.
const initialiseModel = () => {
  const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-1.5-pro",            // Use the latest Gemini model.
    apiKey: process.env.GOOGLE_API_KEY,      // Ensure your Google API key is set.
    temperature: 0.7,                        // Balances creativity and reliability.
    maxOutputTokens: 4096,                   // Maximum response length.
    maxRetries: 3,                           // Retry failed API calls up to three times.
    streaming: true,                         // Enable real-time response streaming.
    cache: true,                             // Enable built-in LangChain caching.
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
  }).bindTools(tools); // Bind external tools to the model.

  return model;
};

function shouldContinue(state: typeof MessagesAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1] as AIMessage;

  // If the LLM makes a tool call, then we route to the "tools" node
  if (lastMessage.tool_calls?.length) {
    return "tools";
  }

  // If the last message is a tool message, route back to agent
  if (lastMessage.content && lastMessage._getType() === "tool") {
    return "agent";
  }

  // Otherwise, we stop (reply to the user)
  return END;
}

const createWorkflow = () => {
  const model = initialiseModel();

  return new StateGraph(MessagesAnnotation)
    .addNode("agent", async (state) => {
      // Set up the system message using prompt caching.
      // Note the use of the correct header name "cache-control" in additional_kwargs.
      const systemContent = SYSTEM_MESSAGE;

      // Create a prompt template that includes a system message (with caching enabled) and a placeholder for conversation messages.
      const promptTemplate = ChatPromptTemplate.fromMessages([
        new SystemMessage(systemContent, {
          "cache-control": { type: "ephemeral" },
        }),
        new MessagesPlaceholder("messages"),
      ]);

      // Trim the conversation history to stay within token limits.
      const trimmedMessages = await trimmer.invoke(state.messages);

      // Format the prompt with the current (trimmed) conversation history.
      const prompt = await promptTemplate.invoke({ messages: trimmedMessages });

      // Invoke the LLM with the formatted prompt.
      const response = await model.invoke(prompt);

      return { messages: [response] };
    })
    .addNode("tools", toolNode)
    .addEdge(START, "agent")
    .addConditionalEdges("agent", shouldContinue) // 'shouldContinue' should be defined elsewhere.
    .addEdge("tools", "agent");
};

// Export or use createWorkflow() as needed.
