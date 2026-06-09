import { AgentBase, type AnthropicMessage } from './AgentBase.js';
import type { PerformanceAnalysis, PerformanceMetrics } from '../types/campaign.js';

export interface AnalysisRequest {
  metrics: PerformanceMetrics;
  previousContext: string[];
}

export class AnalysisAgent extends AgentBase {
  async execute(request: AnalysisRequest): Promise<PerformanceAnalysis> {
    const context = await this.loadContext();
    const response = await this.callClaude(JSON.stringify(request), context);
    await this.recordTokenUsage(response, 'analysis');
    const analysis = this.parseResponse(response) as PerformanceAnalysis;
    this.validateOutput(analysis);
    return analysis;
  }

  protected getSystemPrompt(): string {
    return 'Summarize campaign performance and return actionable insights as JSON.';
  }

  protected parseResponse(response: AnthropicMessage): unknown {
    const text = response.content.find((chunk) => chunk.type === 'text')?.text ?? '{}';
    return JSON.parse(text) as PerformanceAnalysis;
  }
}