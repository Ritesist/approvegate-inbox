import { describe, it, expect } from 'vitest';
import { computeClassMetrics, runEvaluation } from '../lib/eval';
import { Priority } from '../lib/types';

describe('Evaluation Metrics and Invariant Suite', () => {
  it('correctly calculates precision, recall, and F1 for classification classes', () => {
    const classes: Priority[] = ['P0', 'P1', 'P2', 'P3'];
    const pairs: Array<{ actual: Priority; predicted: Priority }> = [
      { actual: 'P0', predicted: 'P0' },
      { actual: 'P0', predicted: 'P0' },
      { actual: 'P0', predicted: 'P1' }, // 1 false negative for P0, 1 false positive for P1
      { actual: 'P1', predicted: 'P1' },
      { actual: 'P2', predicted: 'P2' },
      { actual: 'P3', predicted: 'P3' },
    ];

    const result = computeClassMetrics(classes, pairs);

    // Accuracy: 5 out of 6 correct
    expect(result.accuracy).toBe(0.833);

    // P0: 2 TP, 0 FP, 1 FN -> precision = 1.0, recall = 2/3 (0.667)
    expect(result.metrics.P0.precision).toBe(1.0);
    expect(result.metrics.P0.recall).toBe(0.667);
    expect(result.metrics.P0.support).toBe(3);

    // P1: 1 TP, 1 FP, 0 FN -> precision = 0.5, recall = 1.0
    expect(result.metrics.P1.precision).toBe(0.5);
    expect(result.metrics.P1.recall).toBe(1.0);
  });

  it('runs complete evaluation pipeline against golden dataset with zero invariant violations', async () => {
    const metrics = await runEvaluation();

    expect(metrics.evaluatedCount).toBe(36);
    expect(metrics.priorityAccuracy).toBeGreaterThanOrEqual(0.85);
    expect(metrics.categoryAccuracy).toBeGreaterThanOrEqual(0.85);

    // Hard invariant check: Violations detected MUST BE 0!
    expect(metrics.invariantPassed).toBe(true);
    expect(metrics.invariantDetails.violationsDetected).toBe(0);
  });
});
