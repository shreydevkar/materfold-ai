import type { ClientBrief, PerformanceAnalysis, PerformanceMetrics, UUID } from './campaign.js';

export interface CampaignContext {
  campaignId: UUID;
  clientId: UUID;
  createdAt: string;
  version: number;
  campaignBrief: ClientBrief;
  previousCampaigns: Array<{
    campaignId: UUID;
    platform: string;
    performance: PerformanceMetrics;
    audienceSegments?: string[];
    creativeNotes?: string[];
  }>;
  audienceInsights?: Record<string, unknown>;
  creativePreferences?: Record<string, unknown>;
  performanceAnalysis?: PerformanceAnalysis;
  lastUpdated?: string;
}

export interface ContextBundle {
  systemKnowledge: string[];
  agencyKnowledge: string[];
  clientHistory: CampaignContext[];
}

export interface ContextSelection {
  recent: CampaignContext[];
  midTerm: Array<Record<string, unknown>>;
  patterns: {
    topSegments: string[];
    provenCTAs: string[];
    platformPrefs: Record<string, number>;
  };
  learnings: Array<{ insight: string; confidence: number; conflicted?: boolean }>;
}