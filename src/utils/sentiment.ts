export type SentimentResult = {
  score: number;
  wordsMatched: string[];
  verdict: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
};

export const financialLexicon: Record<string, number> = {
  surge: 2,
  jump: 2,
  rally: 2,
  up: 1,
  buy: 2,
  bull: 2,
  bullish: 2,
  growth: 1,
  beat: 2,
  profit: 1,
  plunge: -2,
  crash: -3,
  tumble: -2,
  down: -1,
  sell: -2,
  bear: -2,
  bearish: -2,
  loss: -1,
  miss: -2,
  decline: -1,
  drop: -1,
};

export function analyzeSentiment(text: string): SentimentResult {
  if (!text) return { score: 0, wordsMatched: [], verdict: "NEUTRAL" as const };
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  const wordsMatched: string[] = [];

  for (const word of words) {
    if (financialLexicon[word]) {
      score += financialLexicon[word];
      if (!wordsMatched.includes(word)) {
        wordsMatched.push(word);
      }
    }
  }

  // Normalize score between -10 and 10
  score = Math.max(-10, Math.min(10, score));

  return { score, wordsMatched, verdict: score > 1 ? "POSITIVE" : score < -1 ? "NEGATIVE" : "NEUTRAL" };
}

export function aggregateSentiment(news: { headline: string; category?: string }[]): SentimentResult {
  if (!news || news.length === 0) return { score: 0, wordsMatched: [], verdict: "NEUTRAL" as const };
  
  let totalScore = 0;
  const allMatched: Set<string> = new Set();
  
  for (const item of news) {
    const { score, wordsMatched } = analyzeSentiment(item.headline);
    totalScore += score;
    wordsMatched.forEach((w) => allMatched.add(w));
  }
  
  const avgScore = totalScore / news.length;
  const normalized = Math.max(-10, Math.min(10, avgScore));
  
  const verdict = normalized > 1 ? "POSITIVE" as const : normalized < -1 ? "NEGATIVE" as const : "NEUTRAL" as const;

  return {
    score: Number(normalized.toFixed(2)),
    wordsMatched: Array.from(allMatched).slice(0, 5),
    verdict,
  };
}
