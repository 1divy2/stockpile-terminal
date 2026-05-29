import { describe, it, expect } from 'vitest';
import { evaluateTechnicals } from './indicators';

describe('evaluateTechnicals', () => {
  it('handles empty candle data', () => {
    const result = evaluateTechnicals([]);
    expect(result.verdict).toBe('NEUTRAL');
    expect(result.rsiVal).toBe(50);
  });

  it('handles small candle data gracefully', () => {
    const result = evaluateTechnicals([{ close: 100 }, { close: 110 }] as any);
    expect(result.verdict).toBeDefined();
    expect(result.rsiVal).toBeDefined();
  });
});
