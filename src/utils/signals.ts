import { TechnicalSignal } from "./indicators";
import { SentimentResult } from "./sentiment";

export type TradeSignal = {
  verdict: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  conviction: "HIGH" | "MEDIUM" | "LOW";
  technicalScore: number; // -10 to 10
  sentimentScore: number; // -10 to 10
  combinedScore: number; // -10 to 10
  reasons: string[];
};

export function generateTradeSignal(
  technical: TechnicalSignal,
  sentiment: SentimentResult,
): TradeSignal {
  // Map technical verdict to a numerical score
  let techScore = 0;
  if (technical.verdict === "POSITIVE") techScore = 5;
  if (technical.verdict === "NEGATIVE") techScore = -5;

  // Slightly adjust tech score based on RSI extremes
  if (technical.rsiVal > 70) techScore -= 2;
  if (technical.rsiVal < 30) techScore += 2;

  // Cap at -10 to 10
  techScore = Math.max(-10, Math.min(10, techScore));

  const sentScore = sentiment.score;

  // Combine scores with a weighted average (70% technical, 30% sentiment)
  // because technicals tend to be more robust than simple headline parsing
  const combined = techScore * 0.7 + sentScore * 0.3;

  let verdict: TradeSignal["verdict"] = "HOLD";
  if (combined >= 4) verdict = "STRONG_BUY";
  else if (combined >= 1) verdict = "BUY";
  else if (combined <= -4) verdict = "STRONG_SELL";
  else if (combined <= -1) verdict = "SELL";

  let conviction: TradeSignal["conviction"] = "LOW";
  const absCombined = Math.abs(combined);
  if (absCombined > 6) conviction = "HIGH";
  else if (absCombined > 3) conviction = "MEDIUM";

  const reasons: string[] = [];
  if (technical.reason) {
    reasons.push(`Technicals: ${technical.reason}`);
  }

  if (sentiment.wordsMatched.length > 0) {
    reasons.push(`Sentiment Drivers: Mentioned [${sentiment.wordsMatched.join(", ")}]`);
  } else {
    reasons.push(`Sentiment: No strong emotional keywords detected in recent news.`);
  }

  return {
    verdict,
    conviction,
    technicalScore: +techScore.toFixed(2),
    sentimentScore: +sentScore.toFixed(2),
    combinedScore: +combined.toFixed(2),
    reasons,
  };
}
