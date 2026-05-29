import { TechnicalSignal } from "./indicators";
import { SentimentResult } from "./sentiment";
import { TradeSignal } from "./signals";
import { generateResearchReportFn } from "@/utils/ai-functions.server";

export type ResearchReport = {
  ticker: string;
  generatedAt: number;
  thesis: string;
  catalysts: string[];
  risks: string[];
  technicalSummary: string;
  sentimentSummary: string;
  verdict: string;
};

// This acts as a localized LLM-engine that generates highly specific, 
// context-aware financial reports based on real quantitative data.
export async function generateResearchReport(
  ticker: string,
  price: number,
  changePct: number,
  technicals: TechnicalSignal,
  sentiment: SentimentResult,
  signal: TradeSignal
): Promise<ResearchReport> {
  
  // Try real AI First
  const llmReport = await generateResearchReportFn({ data: { ticker, price, changePct, technicals, sentiment, signal } });

  if (llmReport) {
    return {
      ticker,
      generatedAt: Date.now(),
      thesis: llmReport.thesis,
      catalysts: llmReport.catalysts,
      risks: llmReport.risks,
      technicalSummary: llmReport.technicalSummary,
      sentimentSummary: llmReport.sentimentSummary,
      verdict: signal.verdict
    };
  }

  // Fallback to deterministic logic if AI fails or key is missing
  console.info("Using deterministic fallback for research report.");
  
  const techTrend = technicals.verdict === "POSITIVE" ? "upward" : technicals.verdict === "NEGATIVE" ? "downward" : "sideways";
  
  // Construct Thesis
  let thesis = `The current quantitative outlook for ${ticker} is ${signal.verdict.replace("_", " ").toLowerCase()}, driven by a combination of ${techTrend} technical momentum and ${sentiment.score > 0 ? "positive" : "negative"} news sentiment. `;
  thesis += `With the asset currently trading at $${price.toFixed(2)} (a move of ${changePct.toFixed(2)}% today), our algorithms suggest a ${signal.conviction.toLowerCase()}-conviction directional bias. `;
  
  // Construct Catalysts
  const catalysts: string[] = [];
  if (sentiment.score > 2) catalysts.push(`Strong positive structural bias detected in recent news headlines (Score: ${sentiment.score.toFixed(1)}).`);
  if (technicals.rsiVal < 35) catalysts.push(`Oversold technical conditions (RSI: ${technicals.rsiVal.toFixed(1)}) present a potential mean-reversion opportunity.`);
  if (technicals.rsiVal > 65 && technicals.verdict === "POSITIVE") catalysts.push(`Strong momentum breakout confirmed by RSI (${technicals.rsiVal.toFixed(1)}).`);
  if (changePct > 2) catalysts.push(`Outsized positive daily move indicates high institutional buying pressure.`);
  if (sentiment.wordsMatched.length > 0) catalysts.push(`Recent narrative drivers: ${sentiment.wordsMatched.join(", ")}.`);
  
  if (catalysts.length === 0) catalysts.push("No immediate directional catalysts identified in current data.");

  // Construct Risks
  const risks: string[] = [];
  if (sentiment.score < -2) risks.push(`Negative news cycle actively weighing on asset price.`);
  if (technicals.rsiVal > 70) risks.push(`Overbought conditions (RSI: ${technicals.rsiVal.toFixed(1)}) increase the probability of a near-term pullback.`);
  if (technicals.rsiVal < 30 && technicals.verdict === "NEGATIVE") risks.push(`Severe downward momentum may result in falling-knife conditions.`);
  if (Math.abs(changePct) < 0.5) risks.push(`Low volatility environment may result in false breakouts or whipsaw price action.`);
  if (technicals.atrVal > 0) risks.push(`Current volatility (ATR: ${technicals.atrVal.toFixed(2)}) suggests maintaining wider stop-losses to avoid premature liquidation.`);
  
  if (risks.length === 0) risks.push("Standard market beta and sector-specific macro risks apply.");

  return {
    ticker,
    generatedAt: Date.now(),
    thesis,
    catalysts,
    risks,
    technicalSummary: technicals.reason || "Neutral technical posture.",
    sentimentSummary: sentiment.wordsMatched.length > 0 
      ? `Sentiment is actively driven by keywords: ${sentiment.wordsMatched.join(", ")}.`
      : "No significant emotional keywords detected in recent data.",
    verdict: signal.verdict
  };
}
