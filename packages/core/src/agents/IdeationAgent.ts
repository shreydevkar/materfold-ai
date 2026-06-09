import { AgentBase, type AnthropicMessage } from './AgentBase.js';
import type { CampaignIdea, ClientBrief } from '../types/campaign.js';

export class IdeationAgent extends AgentBase {
  async execute(brief: ClientBrief): Promise<CampaignIdea[]> {
    const context = await this.loadContext();
    const response = await this.callClaude(this.buildBriefPayload(brief), context);
    await this.recordTokenUsage(response, 'ideation');
    const ideas = this.parseResponse(response) as CampaignIdea[];
    this.validateOutput(ideas);
    return ideas;
  }

  protected getSystemPrompt(): string {
    return 'Generate 5-10 campaign ideas as valid JSON only.';
  }

  protected parseResponse(response: AnthropicMessage): unknown {
    const text = response.content.find((chunk) => chunk.type === 'text')?.text ?? '[]';
    return JSON.parse(text) as CampaignIdea[];
  }
}