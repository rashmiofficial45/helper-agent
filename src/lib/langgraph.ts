import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { wxflows } from "wxflows"; // Assuming wxflows is correctly installed

// Initialize the tool client
// const toolClient = new wxflows({
//   endpoint: process.env.WXFLOWS_ENDPOINT || "",
//   apikey: process.env.WXFLOWS_APIKEY,
// });

// Retrieve the tools
// const tools = await toolClient.lcTools;
// const toolNode = new ToolNode(tools);

// Initialize the LLM provider with tool support and prompt caching
const initialiseModel = () => {
  const model = new ChatGoogleGenerativeAI({
    modelName: "gemini-1.5-pro", // Latest Gemini model
    apiKey: process.env.GOOGLE_API_KEY, // Ensure API key is set
    temperature: 0.7, // Balances creativity & reliability
    maxOutputTokens: 4096, // Maximum response length
    maxRetries: 3, // Retry failed API calls
    streaming: true, // Enable real-time responses
    cache: true, // Enable built-in LangChain caching
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
  });

  // Bind the AI model to external tools
  return model.bindTools(tools);
};

export const aiModel = initialiseModel();
