import { AgentBase, type AnthropicMessage } from './AgentBase.js';
import type { CampaignScoreBreakdown } from '../types/campaign.js';

export interface ScoreRequest {
  creativeAsset: string;
  brandGuidelines: string[];
}

export interface ScoringResponse extends CampaignScoreBreakdown {
  confidence?: number;
  justifications?: Record<string, string>;
  recommendations?: string[];
}

export class ScoringAgent extends AgentBase {
  async execute(request: ScoreRequest): Promise<CampaignScoreBreakdown> {
    const context = await this.loadContext();
    let lastScore: ScoringResponse | undefined;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const prompt = attempt === 0 ? JSON.stringify(request) : JSON.stringify({ ...request, outputFormat: 'strict-json', includeConfidence: true });
      const response = await this.callClaude(prompt, context);
      await this.recordTokenUsage(response, 'scoring');
      lastScore = this.parseResponse(response) as ScoringResponse;
      this.validateOutput(lastScore);

      if (typeof lastScore.confidence !== 'number' || lastScore.confidence >= 0.7) {
        return lastScore;
      }
    }

    return {
      ...(lastScore ?? {
        brandAlignment: 0,
        audienceResonance: 0,
        hookStrength: 0,
        ctaClarity: 0,
        historicalMatch: 0,
        compositeScore: 0,
      }),
      needsManualReview: true,
    };
  }

  protected getSystemPrompt(): string {
    return 'Score the creative across brand, audience, hook, CTA, and historical match. Return JSON with confidence.';
  }

  protected parseResponse(response: AnthropicMessage): unknown {
    const text = response.content.find((chunk) => chunk.type === 'text')?.text ?? '{}';
    return JSON.parse(text) as ScoringResponse;
  }
}