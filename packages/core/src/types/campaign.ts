export type UUID = string;

export type Platform = 'facebook' | 'instagram' | 'google' | 'tiktok';

export interface AudienceProfile {
  ageMin: number;
  ageMax: number;
  interests?: string[];
  geographicConcentration?: string[];
  psychographics?: string[];
}

export interface ClientBrief {
  clientId: UUID;
  platform: Platform;
  audience: AudienceProfile;
  budget: number;
  kpis: string[];
  brandGuidelines?: string[];
  messagingDirection?: string;
}

export interface CampaignIdea {
  concept: string;
  tone: string;
  visualApproach: string;
  expectedKpiLift: string;
  platform?: Platform;
  audienceFit?: string;
  riskFactors?: string[];
  confidence?: 'untested' | 'low' | 'medium' | 'high';
}

export interface CampaignScoreBreakdown {
  brandAlignment: number;
  audienceResonance: number;
  hookStrength: number;
  ctaClarity: number;
  historicalMatch: number;
  compositeScore: number;
  confidence?: number;
  needsManualReview?: boolean;
}

export interface PerformanceMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  roas?: number;
  ctr?: number;
  cpc?: number;
}

export interface PerformanceAnalysis {
  whatWorked: string[];
  whatDidnt: string[];
  recommendations: string[];
  metrics: PerformanceMetrics;
}