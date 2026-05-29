import { describe, it, expect } from 'vitest';
import { analyzeSentiment, aggregateSentiment } from './sentiment';

describe('sentiment utility', () => {
  it('analyzes positive sentiment correctly', () => {
    const text = 'The stock market saw a massive surge today as bulls rally.';
    const result = analyzeSentiment(text);
    expect(result.score).toBeGreaterThan(0);
    expect(result.wordsMatched).toContain('surge');
    expect(result.wordsMatched).toContain('rally');
  });

  it('analyzes negative sentiment correctly', () => {
    const text = 'Stocks plunge amid fears of a crash and bear market.';
    const result = analyzeSentiment(text);
    expect(result.score).toBeLessThan(0);
    expect(result.wordsMatched).toContain('plunge');
    expect(result.wordsMatched).toContain('crash');
    expect(result.wordsMatched).toContain('bear');
  });

  it('aggregates news sentiment', () => {
    const news = [
      { headline: 'Markets surge to new highs' },
      { headline: 'Investors jump in on tech rally' }
    ];
    const result = aggregateSentiment(news);
    expect(result.score).toBeGreaterThan(0);
    expect(result.verdict).toBe('POSITIVE');
  });

  it('returns verdict field from analyzeSentiment', () => {
    expect(analyzeSentiment('massive surge rally').verdict).toBe('POSITIVE');
    expect(analyzeSentiment('plunge crash tumble').verdict).toBe('NEGATIVE');
    expect(analyzeSentiment('the weather is nice').verdict).toBe('NEUTRAL');
  });
});
