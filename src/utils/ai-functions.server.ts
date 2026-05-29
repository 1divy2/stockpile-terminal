import { createServerFn } from "@tanstack/react-start";
import { researchAgent } from "@/agents/research-agent";
import { TechnicalSignal } from "@/utils/indicators";
import { SentimentResult } from "@/utils/sentiment";
import { TradeSignal } from "@/utils/signals";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

type GenerateReportInput = {
  ticker: string;
  price: number;
  changePct: number;
  technicals: TechnicalSignal;
  sentiment: SentimentResult;
  signal: TradeSignal;
};

export const generateResearchReportFn = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: GenerateReportInput }) => {
    try {
      
      const systemMessage = new SystemMessage(
        "You are a quantitative AI researcher for StockPile, a premium institutional trading platform. You have access to tools to fetch SEC filings and insider trades. ALWAYS use these tools to research the ticker before finalizing your report."
      );

      const prompt = new HumanMessage(`
Analyze the following live market data for ${data.ticker} and gather any necessary fundamental data using your tools.

DATA:
- Current Price: $${data.price.toFixed(2)} (Daily Change: ${data.changePct.toFixed(2)}%)
- Algorithmic Trade Signal: ${data.signal.verdict} (Conviction: ${data.signal.conviction}, Score: ${data.signal.combinedScore})
- Technical Analysis: RSI is ${data.technicals.rsiVal}, MACD is ${data.technicals.macdVal}, Bollinger Band state is ${data.technicals.bbState}. 
  System Notes: ${data.technicals.reason}
- News Sentiment: ${data.sentiment.score > 0 ? "Positive" : data.sentiment.score < 0 ? "Negative" : "Neutral"} (Score: ${data.sentiment.score}). Keywords: ${data.sentiment.wordsMatched.join(", ")}
      `);

      // Invoke the LangGraph agent
      const result = await researchAgent.invoke({
        messages: [systemMessage, prompt],
        ticker: data.ticker,
        price: data.price,
        changePct: data.changePct,
        technicals: data.technicals,
        sentiment: data.sentiment,
        signal: data.signal,
      });
      
      // The graph returns { report: LLMResearchReport }
      return result.report;
    } catch (error) {
      console.error("LangGraph Agent execution failed:", error);
      return null;
    }
  });
