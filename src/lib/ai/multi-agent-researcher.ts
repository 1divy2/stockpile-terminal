import { TechnicalSignal } from "@/utils/indicators";
import { SentimentResult } from "@/utils/sentiment";
import { TradeSignal } from "@/utils/signals";

export type AgentRole = "macro" | "technician" | "risk" | "sentiment";

export type AgentReport = {
  role: AgentRole;
  title: string;
  emoji: string;
  verdict: "BULLISH" | "BEARISH" | "NEUTRAL";
  confidence: number; // 0-100
  analysis: string;
  keyPoints: string[];
};

export type MultiAgentResult = {
  ticker: string;
  generatedAt: number;
  agents: AgentReport[];
  consensus: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  consensusScore: number;
  executiveSummary: string;
};

const AGENT_PERSONAS: Record<AgentRole, { title: string; emoji: string; systemPrompt: string }> = {
  macro: {
    title: "Macro Economist",
    emoji: "🌍",
    systemPrompt: `You are a senior macro-economist for an institutional trading desk. 
Analyze the stock from a macro-economic perspective — considering sector rotation, monetary policy implications, 
and relative value in the current economic cycle. Be concise and direct.`
  },
  technician: {
    title: "Technical Analyst",
    emoji: "📊",
    systemPrompt: `You are a veteran technical analyst (CMT-certified). 
Analyze the stock purely from price action, chart patterns, and technical indicators. 
Reference specific RSI, MACD, and Bollinger Band readings. Be concise and precise.`
  },
  risk: {
    title: "Risk Manager",
    emoji: "🛡️",
    systemPrompt: `You are a portfolio risk manager at a hedge fund. 
Evaluate the risk/reward profile of this position. Focus on downside scenarios, 
position sizing considerations, volatility metrics, and tail risks. Be conservative and thorough.`
  },
  sentiment: {
    title: "Sentiment Analyst",
    emoji: "📰",
    systemPrompt: `You are a quantitative sentiment analyst using NLP on financial news. 
Analyze the news sentiment data and its likely impact on short-term price action. 
Consider both the magnitude and direction of the sentiment signals. Be data-driven.`
  }
};

async function callGeminiAgent(
  role: AgentRole,
  ticker: string,
  price: number,
  changePct: number,
  technicals: TechnicalSignal,
  sentiment: SentimentResult,
  signal: TradeSignal
): Promise<AgentReport | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return null;

  const persona = AGENT_PERSONAS[role];

  const prompt = `${persona.systemPrompt}

MARKET DATA FOR ${ticker}:
- Price: $${price.toFixed(2)} | Daily Change: ${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%
- RSI: ${technicals.rsiVal.toFixed(1)} | MACD: ${technicals.macdVal.toFixed(3)} | BB State: ${technicals.bbState}
- Technical Verdict: ${technicals.verdict} | Reasoning: ${technicals.reason}
- News Sentiment Score: ${sentiment.score.toFixed(1)} (${sentiment.score > 0 ? "Positive" : sentiment.score < 0 ? "Negative" : "Neutral"})
- Key news themes: ${sentiment.wordsMatched.length > 0 ? sentiment.wordsMatched.join(", ") : "none detected"}
- Algorithmic Signal: ${signal.verdict} (Conviction: ${signal.conviction}, Combined: ${signal.combinedScore.toFixed(1)})

Respond with JSON exactly matching:
{
  "verdict": "BULLISH" | "BEARISH" | "NEUTRAL",
  "confidence": <number 0-100>,
  "analysis": "<2-3 sentence analysis from your specific perspective>",
  "keyPoints": ["<point 1>", "<point 2>", "<point 3>"]
}
Return ONLY valid JSON. No markdown formatting.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.3
          }
        })
      }
    );

    if (!res.ok) return null;

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = JSON.parse(text);

    return {
      role,
      title: persona.title,
      emoji: persona.emoji,
      verdict: parsed.verdict,
      confidence: parsed.confidence,
      analysis: parsed.analysis,
      keyPoints: parsed.keyPoints || []
    };
  } catch (err) {
    console.error(`Agent ${role} failed:`, err);
    return null;
  }
}

function synthesizeConsensus(agents: AgentReport[]): {
  consensus: MultiAgentResult["consensus"];
  score: number;
  summary: string;
} {
  let score = 0;
  for (const a of agents) {
    const weight = a.confidence / 100;
    if (a.verdict === "BULLISH") score += weight;
    else if (a.verdict === "BEARISH") score -= weight;
  }

  // Normalize to -1..+1 range
  const normalized = agents.length > 0 ? score / agents.length : 0;

  let consensus: MultiAgentResult["consensus"];
  if (normalized > 0.5) consensus = "STRONG_BUY";
  else if (normalized > 0.15) consensus = "BUY";
  else if (normalized > -0.15) consensus = "HOLD";
  else if (normalized > -0.5) consensus = "SELL";
  else consensus = "STRONG_SELL";

  const bullCount = agents.filter(a => a.verdict === "BULLISH").length;
  const bearCount = agents.filter(a => a.verdict === "BEARISH").length;
  const neutralCount = agents.filter(a => a.verdict === "NEUTRAL").length;

  const summary = `${agents.length} agents polled: ${bullCount} bullish, ${bearCount} bearish, ${neutralCount} neutral. Average confidence: ${(agents.reduce((s, a) => s + a.confidence, 0) / agents.length).toFixed(0)}%. Consensus direction: ${consensus.replace("_", " ")}.`;

  return { consensus, score: normalized, summary };
}

export async function runMultiAgentResearch(
  ticker: string,
  price: number,
  changePct: number,
  technicals: TechnicalSignal,
  sentiment: SentimentResult,
  signal: TradeSignal
): Promise<MultiAgentResult> {
  const roles: AgentRole[] = ["macro", "technician", "risk", "sentiment"];

  // Run all agents in parallel
  const results = await Promise.all(
    roles.map(role =>
      callGeminiAgent(role, ticker, price, changePct, technicals, sentiment, signal)
    )
  );

  const agents = results.filter((r): r is AgentReport => r !== null);

  // Fallback if all agents fail (no API key or network error)
  if (agents.length === 0) {
    return buildFallbackResult(ticker, technicals, sentiment, signal);
  }

  const { consensus, score, summary } = synthesizeConsensus(agents);

  return {
    ticker,
    generatedAt: Date.now(),
    agents,
    consensus,
    consensusScore: score,
    executiveSummary: summary
  };
}

function buildFallbackResult(
  ticker: string,
  technicals: TechnicalSignal,
  sentiment: SentimentResult,
  signal: TradeSignal
): MultiAgentResult {
  const techVerdict = technicals.verdict === "POSITIVE" ? "BULLISH" : technicals.verdict === "NEGATIVE" ? "BEARISH" : "NEUTRAL";
  const sentVerdict = sentiment.score > 1 ? "BULLISH" : sentiment.score < -1 ? "BEARISH" : "NEUTRAL";

  const agents: AgentReport[] = [
    {
      role: "technician",
      title: "Technical Analyst",
      emoji: "📊",
      verdict: techVerdict,
      confidence: Math.min(90, 40 + Math.abs(technicals.rsiVal - 50)),
      analysis: `RSI at ${technicals.rsiVal.toFixed(1)}, MACD at ${technicals.macdVal.toFixed(3)}. ${technicals.reason}`,
      keyPoints: [
        `RSI: ${technicals.rsiVal.toFixed(1)} — ${technicals.rsiVal > 70 ? "Overbought" : technicals.rsiVal < 30 ? "Oversold" : "Neutral zone"}`,
        `Bollinger Band state: ${technicals.bbState}`,
        `Technical verdict: ${technicals.verdict}`
      ]
    },
    {
      role: "sentiment",
      title: "Sentiment Analyst",
      emoji: "📰",
      verdict: sentVerdict,
      confidence: Math.min(85, 30 + Math.abs(sentiment.score) * 10),
      analysis: `Aggregate sentiment score of ${sentiment.score.toFixed(1)} across recent headlines. ${sentiment.wordsMatched.length > 0 ? `Key themes: ${sentiment.wordsMatched.join(", ")}.` : "No strong thematic signals."}`,
      keyPoints: [
        `Sentiment score: ${sentiment.score.toFixed(1)}`,
        `Themes detected: ${sentiment.wordsMatched.length}`,
        `Direction: ${sentVerdict}`
      ]
    },
    {
      role: "risk",
      title: "Risk Manager",
      emoji: "🛡️",
      verdict: "NEUTRAL",
      confidence: 60,
      analysis: `Current volatility (ATR: ${technicals.atrVal.toFixed(2)}) suggests standard position sizing. No outsized tail risk detected in current environment.`,
      keyPoints: [
        `ATR: ${technicals.atrVal.toFixed(2)}`,
        "Standard risk parameters apply",
        "No black swan indicators"
      ]
    },
    {
      role: "macro",
      title: "Macro Economist",
      emoji: "🌍",
      verdict: "NEUTRAL",
      confidence: 50,
      analysis: `Macro analysis requires real-time economic data not currently available. Defaulting to neutral stance pending further data ingestion.`,
      keyPoints: [
        "Sector-level analysis pending",
        "Fed policy implications: monitor",
        "Relative value assessment: requires more data"
      ]
    }
  ];

  const { consensus, score, summary } = synthesizeConsensus(agents);

  return {
    ticker,
    generatedAt: Date.now(),
    agents,
    consensus,
    consensusScore: score,
    executiveSummary: summary + " (Deterministic fallback — connect Gemini API key for real AI analysis.)"
  };
}
