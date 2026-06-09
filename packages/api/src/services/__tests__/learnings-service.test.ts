import { describe, expect, it } from 'vitest';
import { LearningsService, InMemoryLearningsStore } from '../learnings-service.js';

describe('LearningsService', () => {
  it('upgrades repeated learnings confidence', async () => {
    const store = new InMemoryLearningsStore();
    const service = new LearningsService(store);

    await service.updateLearnings(
      'client-1',
      {
        whatWorked: ['short-form video'],
        whatDidnt: ['long captions'],
        recommendations: ['test new hooks'],
        metrics: { impressions: 100, clicks: 10, conversions: 2, spend: 50 },
      },
      'campaign-1',
    );

    await service.updateLearnings(
      'client-1',
      {
        whatWorked: ['short-form video'],
        whatDidnt: ['long captions'],
        recommendations: ['test new hooks'],
        metrics: { impressions: 200, clicks: 20, conversions: 4, spend: 80 },
      },
      'campaign-2',
    );

    const highConfidence = await service.getHighConfidenceLearnings('client-1', 50);
    expect(highConfidence.some((learning) => learning.insight.includes('Worked: short-form video'))).toBe(true);
  });
});