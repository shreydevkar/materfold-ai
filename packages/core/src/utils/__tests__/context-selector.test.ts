import { describe, expect, it } from 'vitest';
import { ContextSelector } from '../context-selector.js';

describe('ContextSelector', () => {
  it('returns recent context, summarized mid-tier, patterns, and learnings', async () => {
    const selector = new ContextSelector({
      async loadAllCampaigns() {
        return [
          {
            campaignId: 'c1',
            clientId: 'client-1',
            createdAt: '2026-01-01T00:00:00.000Z',
            version: 1,
            campaignBrief: {
              clientId: 'client-1',
              platform: 'facebook',
              audience: { ageMin: 25, ageMax: 34 },
              budget: 1000,
              kpis: ['ctr'],
            },
            previousCampaigns: [
              {
                campaignId: 'c1',
                platform: 'facebook',
                performance: { impressions: 100, clicks: 10, conversions: 1, spend: 100, ctr: 0.1, roas: 1.5 },
                audienceSegments: ['retargeting'],
                creativeNotes: ['Shop now CTA'],
              },
            ],
          },
          {
            campaignId: 'c2',
            clientId: 'client-1',
            createdAt: '2026-01-02T00:00:00.000Z',
            version: 1,
            campaignBrief: {
              clientId: 'client-1',
              platform: 'instagram',
              audience: { ageMin: 18, ageMax: 25 },
              budget: 1500,
              kpis: ['roas'],
            },
            previousCampaigns: [
              {
                campaignId: 'c2',
                platform: 'instagram',
                performance: { impressions: 200, clicks: 20, conversions: 2, spend: 200, ctr: 0.1, roas: 2.2 },
                audienceSegments: ['prospecting'],
                creativeNotes: ['Learn more CTA'],
              },
            ],
          },
          {
            campaignId: 'c3',
            clientId: 'client-1',
            createdAt: '2026-01-03T00:00:00.000Z',
            version: 1,
            campaignBrief: {
              clientId: 'client-1',
              platform: 'google',
              audience: { ageMin: 30, ageMax: 44 },
              budget: 2000,
              kpis: ['cpa'],
            },
            previousCampaigns: [
              {
                campaignId: 'c3',
                platform: 'google',
                performance: { impressions: 300, clicks: 30, conversions: 3, spend: 300, ctr: 0.1, roas: 2.8 },
                audienceSegments: ['retargeting'],
                creativeNotes: ['Book now CTA'],
              },
            ],
          },
        ];
      },
      async loadLearnings() {
        return [{ insight: 'Instagram feed dominates', confidence: 75 }];
      },
    });

    const selection = await selector.selectRelevantContext('client-1', 3);
    expect(selection.recent).toHaveLength(2);
    expect(selection.midTerm).toHaveLength(1);
    expect(selection.patterns.topSegments.length).toBeGreaterThan(0);
    expect(selection.learnings).toHaveLength(1);
  });
});