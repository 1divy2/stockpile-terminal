import { StateGraph, Annotation, messagesStateReducer } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { TechnicalSignal } from "@/utils/indicators";
import { SentimentResult } from "@/utils/sentiment";
import { TradeSignal } from "@/utils/signals";

// 1. Define Tools
export const searchSecFilings = tool(
  async ({ ticker }) => {
    // Mocking an SEC Edgar search
    if (ticker === "NVDA") return "SEC 10-Q excerpt: Company faces supply chain constraints but expects data center revenue to double. Risk of export controls to China remains a headwind.";
    if (ticker === "AAPL") return "SEC 10-K excerpt: Services revenue growing at 14% YoY. Hardware sales facing cyclical headwinds. R&D spending up 20% on AI initiatives.";
    return `SEC filings for ${ticker} indicate standard operational risks and stable forward guidance.`;
  },
  {
    name: "search_sec_filings",
    description: "Search SEC EDGAR filings (10-K, 10-Q) for recent fundamental risk factors and forward-looking statements for a ticker.",
    schema: z.object({
      ticker: z.string().describe("The stock ticker symbol (e.g., NVDA)"),
    }),
  }
);

export const getInsiderTrades = tool(
  async ({ ticker }) => {
    // Mocking insider trades
    if (ticker === "NVDA") return "CEO Jensen Huang sold 120,000 shares via 10b5-1 plan. Director Tench Coxe bought 50,000 shares.";
    return `No significant insider trading activity reported for ${ticker} in the last 30 days.`;
  },
  {
    name: "get_insider_trades",
    description: "Get recent insider buying and selling activity by executives and directors.",
    schema: z.object({
      ticker: z.string().describe("The stock ticker symbol (e.g., NVDA)"),
    }),
  }
);

const tools = [searchSecFilings, getInsiderTrades];
const toolNode = new ToolNode(tools);

// 2. Define the Zod Schema for Structured Output
export const ResearchReportSchema = z.object({
  thesis: z.string().describe("A 2-3 sentence overview of the current quantitative outlook, directional bias, and immediate technical/fundamental drivers."),
  catalysts: z.array(z.string()).describe("2-3 bullet points of positive catalysts or breakout triggers"),
  risks: z.array(z.string()).describe("2-3 bullet points of downside risks or overhead resistance"),
  technicalSummary: z.string().describe("A 1-sentence summary of the technical posture."),
  sentimentSummary: z.string().describe("A 1-sentence summary of the news sentiment and its impact."),
});

export type LLMResearchReport = z.infer<typeof ResearchReportSchema>;

// 3. Define the Agent State
export const ResearchStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
  }),
  ticker: Annotation<string>(),
  price: Annotation<number>(),
  changePct: Annotation<number>(),
  technicals: Annotation<TechnicalSignal>(),
  sentiment: Annotation<SentimentResult>(),
  signal: Annotation<TradeSignal>(),
  report: Annotation<LLMResearchReport>(),
});

// Helper to get LLM
function getLLM() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY in server environment.");
  return new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    apiKey,
    temperature: 0.2,
  });
}

// 4. Nodes
async function agentNode(state: typeof ResearchStateAnnotation.State) {
  const llm = getLLM();
  const llmWithTools = llm.bindTools(tools);
  
  console.log(`[LangGraph] Agent reasoning for ${state.ticker}...`);
  // Call the LLM with the message history
  const response = await llmWithTools.invoke(state.messages);
  
  const responseAny = response as any;
  if (responseAny.tool_calls && responseAny.tool_calls.length > 0) {
      console.log(`[LangGraph] Agent decided to call tools:`, responseAny.tool_calls.map((t: any) => t.name));
  } else {
      console.log(`[LangGraph] Agent finished reasoning. Routing to synthesis.`);
  }

  // Return the new message to be appended to the state
  return { messages: [response] };
}

async function synthesizeNode(state: typeof ResearchStateAnnotation.State) {
  const llm = getLLM();
  const structuredLlm = llm.withStructuredOutput(ResearchReportSchema);
  
  console.log(`[LangGraph] Synthesizing final JSON structured report for ${state.ticker}...`);
  
  // We ask the LLM to synthesize the final report based on all gathered context
  const synthesisPrompt = new HumanMessage(
    `Based on the conversation and data gathered above, generate the final structured JSON research report for ${state.ticker}. Ensure you incorporate findings from the SEC filings and insider trades if they were retrieved.`
  );
  
  const response = await structuredLlm.invoke([...state.messages, synthesisPrompt]);
  
  return { report: response };
}

function shouldContinue(state: typeof ResearchStateAnnotation.State) {
  const messages = state.messages;
  const lastMessage = messages[messages.length - 1];
  
  // If the LLM makes a tool call, route to the tools node
  if ((lastMessage as any).tool_calls?.length) {
    return "tools";
  }
  // Otherwise, we're done gathering data, route to synthesize
  return "synthesize";
}

// 5. Build and Compile the Graph
const workflow = new StateGraph(ResearchStateAnnotation)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addNode("synthesize", synthesizeNode)
  .addEdge("__start__", "agent")
  // Conditional routing after agent reasoning
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    synthesize: "synthesize",
  })
  // After tools execute, loop back to the agent for more reasoning
  .addEdge("tools", "agent")
  // Synthesis is the final step
  .addEdge("synthesize", "__end__");

export const researchAgent = workflow.compile();
