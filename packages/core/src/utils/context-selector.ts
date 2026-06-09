import type { ContextBundle, ContextSelection } from '../types/context.js';
import type { UUID } from '../types/campaign.js';

export interface CampaignHistorySummary {
  campaignId: UUID;
  platform: string;
  audienceSegments?: string[];
  performance?: { impressions?: number; ctr?: number; roas?: number };
  creativeNotes?: string[];
}

export interface ContextLoaders {
  loadAllCampaigns(clientId: UUID): Promise<ContextBundle['clientHistory']>;
  loadLearnings(clientId: UUID, minConfidence: number): Promise<Array<{ insight: string; confidence: number }>>;
}

export class ContextSelector {
  constructor(private readonly loaders: ContextLoaders) {}

  async selectRelevantContext(clientId: UUID, campaignCount: number): Promise<ContextSelection> {
    const allCampaigns = await this.loaders.loadAllCampaigns(clientId);
    const recent = allCampaigns.slice(Math.max(0, allCampaigns.length - 2));
    const midTerm = allCampaigns.slice(Math.max(0, allCampaigns.length - 5), Math.max(0, allCampaigns.length - 2)).map((campaign) => ({
      campaignId: campaign.campaignId,
      platform: campaign.previousCampaigns[0]?.platform ?? 'unknown',
      summary: this.summarizeCampaign(campaign.previousCampaigns[0]),
    }));
    const patterns = this.extractPatterns(allCampaigns.map((campaign) => this.toSummary(campaign)));
    const learnings = await this.loaders.loadLearnings(clientId, 50);

    return {
      recent,
      midTerm,
      patterns,
      learnings,
    };
  }

  private summarizeCampaign(campaign?: ContextBundle['clientHistory'][number]['previousCampaigns'][number]): string {
    if (!campaign) {
      return 'No prior campaign details available.';
    }

    const metrics = campaign.performance;
    const metricSummary = [
      typeof metrics.ctr === 'number' ? `CTR ${Math.round(metrics.ctr * 100)}%` : undefined,
      typeof metrics.roas === 'number' ? `ROAS ${metrics.roas.toFixed(2)}` : undefined,
    ]
      .filter(Boolean)
      .join(', ');

    const segmentSummary = campaign.audienceSegments?.slice(0, 2).join(', ') ?? 'general audience';
    return `${campaign.platform} | ${segmentSummary}${metricSummary ? ` | ${metricSummary}` : ''}`;
  }

  private toSummary(campaign: ContextBundle['clientHistory'][number]): CampaignHistorySummary {
    const latest = campaign.previousCampaigns[0];
    const summary: CampaignHistorySummary = {
      campaignId: campaign.campaignId,
      platform: latest?.platform ?? 'unknown',
    };

    if (latest?.audienceSegments) {
      summary.audienceSegments = latest.audienceSegments;
    }

    if (latest?.performance) {
      summary.performance = latest.performance;
    }

    if (latest?.creativeNotes) {
      summary.creativeNotes = latest.creativeNotes;
    }

    return summary;
  }

  private extractPatterns(campaigns: CampaignHistorySummary[]): ContextSelection['patterns'] {
    const topSegments = new Map<string, number>();
    const provenCTAs = new Map<string, number>();
    const platformPrefs = new Map<string, number>();

    for (const campaign of campaigns) {
      platformPrefs.set(campaign.platform, (platformPrefs.get(campaign.platform) ?? 0) + 1);
      for (const segment of campaign.audienceSegments ?? []) {
        topSegments.set(segment, (topSegments.get(segment) ?? 0) + 1);
      }
      for (const note of campaign.creativeNotes ?? []) {
        if (/cta|call to action|shop now|learn more|book now/i.test(note)) {
          provenCTAs.set(note, (provenCTAs.get(note) ?? 0) + 1);
        }
      }
    }

    return {
      topSegments: [...topSegments.entries()].sort((left, right) => right[1] - left[1]).slice(0, 3).map(([segment]) => segment),
      provenCTAs: [...provenCTAs.entries()].sort((left, right) => right[1] - left[1]).slice(0, 3).map(([cta]) => cta),
      platformPrefs: Object.fromEntries(platformPrefs.entries()),
    };
  }
}