import type { ClientBrief, Platform } from '../types/campaign.js';
import type { CampaignContext } from '../types/context.js';

const KNOWN_PLATFORMS: Platform[] = ['facebook', 'instagram', 'google', 'tiktok'];

export function validateClientBrief(brief: ClientBrief): string[] {
  const errors: string[] = [];

  if (!KNOWN_PLATFORMS.includes(brief.platform)) {
    errors.push(`Invalid platform: ${brief.platform}`);
  }

  if (brief.audience.ageMin > brief.audience.ageMax) {
    errors.push('Audience ageMin cannot exceed ageMax.');
  }

  if (brief.budget < 100) {
    errors.push('Budget must be at least 100.');
  }

  if (brief.kpis.length < 1 || brief.kpis.length > 5) {
    errors.push('KPIs must contain between 1 and 5 entries.');
  }

  return errors;
}

export class PromptGuard {
  private static readonly suspiciousPatterns = [
    /ignore.*previous.*instructions/i,
    /system.*prompt/i,
    /you are now/i,
  ];

  static detectInjection(input: string): boolean {
    return PromptGuard.suspiciousPatterns.some((pattern) => pattern.test(input));
  }
}

export function validateIdeas(ideas: Array<{ platform?: string; riskFactors?: string[] }>): string[] {
  const errors: string[] = [];

  for (const idea of ideas) {
    if (idea.platform && !KNOWN_PLATFORMS.includes(idea.platform as Platform)) {
      errors.push(`Invalid platform: ${idea.platform}`);
    }

    if (!idea.riskFactors || idea.riskFactors.length === 0) {
      errors.push('Each idea must include at least one risk factor.');
    }
  }

  return errors;
}

export function validateIdeaAgainstHistory(
  idea: { audienceFit?: string; platform?: string; confidence?: 'untested' | 'low' | 'medium' | 'high' },
  history: CampaignContext[],
): { valid: boolean; idea: typeof idea; errors: string[] } {
  const errors: string[] = [];
  const previousAudiences = history.flatMap((campaign) => campaign.previousCampaigns.flatMap((entry) => entry.audienceSegments ?? []));

  if (idea.audienceFit && !previousAudiences.some((segment) => segment.toLowerCase().includes(idea.audienceFit!.toLowerCase()))) {
    idea.confidence = 'untested';
  }

  if (idea.platform && !KNOWN_PLATFORMS.includes(idea.platform as Platform)) {
    errors.push(`Invalid platform: ${idea.platform}`);
  }

  return {
    valid: errors.length === 0,
    idea,
    errors,
  };
}