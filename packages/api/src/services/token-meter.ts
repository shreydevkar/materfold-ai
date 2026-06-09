import type { UUID } from '@materfold/core';

export interface TokenUsageLogInput {
  organizationId: UUID;
  clientId: UUID;
  campaignId: UUID;
  agentType: 'ideation' | 'scoring' | 'analysis' | string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}

export interface TokenUsageSummary {
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCost: number;
}

const MODEL_PRICES: Record<string, { in: number; out: number }> = {
  'claude-opus-4-6': { in: 0.015, out: 0.045 },
  unknown: { in: 0, out: 0 },
};

export class TokenMeter {
  private readonly usageLogs: TokenUsageLogInput[] = [];

  async logUsage(params: TokenUsageLogInput): Promise<void> {
    this.usageLogs.push(params);
  }

  async getCampaignTokens(campaignId: UUID): Promise<TokenUsageSummary> {
    const matching = this.usageLogs.filter((log) => log.campaignId === campaignId);
    return this.summarize(matching);
  }

  async getOrgTokens(organizationId: UUID, startDate?: Date, endDate?: Date): Promise<TokenUsageSummary> {
    void startDate;
    void endDate;
    return this.summarize(this.usageLogs.filter((log) => log.organizationId === organizationId));
  }

  async alertIfOverBudget(organizationId: UUID, budgetLimit: number): Promise<boolean> {
    const summary = await this.getOrgTokens(organizationId);
    return summary.estimatedCost > budgetLimit;
  }

  private summarize(logs: TokenUsageLogInput[]): TokenUsageSummary {
    return logs.reduce<TokenUsageSummary>(
      (summary, log) => {
        const price = MODEL_PRICES[log.model] ?? { in: 0, out: 0 };
        return {
          totalInputTokens: summary.totalInputTokens + log.inputTokens,
          totalOutputTokens: summary.totalOutputTokens + log.outputTokens,
          estimatedCost: summary.estimatedCost + (log.inputTokens / 1000) * price.in + (log.outputTokens / 1000) * price.out,
        };
      },
      { totalInputTokens: 0, totalOutputTokens: 0, estimatedCost: 0 },
    );
  }
}

export const tokenMeter = new TokenMeter();