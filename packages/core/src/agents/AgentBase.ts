import type { CampaignContext, ContextBundle } from '../types/context.js';
import type { ClientBrief, UUID } from '../types/campaign.js';

export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

export interface AnthropicMessage {
  model?: string;
  usage?: AnthropicUsage;
  content: Array<{ type: 'text'; text: string }>;
}

export interface AnthropicClient {
  messages: {
    create(input: Record<string, unknown>): Promise<AnthropicMessage>;
  };
}

export interface TokenMeterLike {
  logUsage(params: {
    organizationId: UUID;
    clientId: UUID;
    campaignId: UUID;
    agentType: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
  }): Promise<void>;
}

export interface ContextManagerLike {
  loadClientContext(clientId: UUID, includeHistorical?: boolean): Promise<ContextBundle>;
}

export interface AgentDependencies {
  client: AnthropicClient;
  tokenMeter: TokenMeterLike;
  contextManager: ContextManagerLike;
  organizationId: UUID;
  clientId: UUID;
  campaignId: UUID;
  logger?: { info(message: string, meta?: Record<string, unknown>): void; error(message: string, meta?: Record<string, unknown>): void };
}

export abstract class AgentBase {
  protected readonly client: AnthropicClient;
  protected readonly tokenMeter: TokenMeterLike;
  protected readonly contextManager: ContextManagerLike;
  protected readonly logger: NonNullable<AgentDependencies['logger']>;
  protected readonly organizationId: UUID;
  protected readonly clientId: UUID;
  protected readonly campaignId: UUID;

  constructor(deps: AgentDependencies) {
    this.client = deps.client;
    this.tokenMeter = deps.tokenMeter;
    this.contextManager = deps.contextManager;
    this.logger = deps.logger ?? console;
    this.organizationId = deps.organizationId;
    this.clientId = deps.clientId;
    this.campaignId = deps.campaignId;
  }

  protected abstract getSystemPrompt(): string;

  protected abstract parseResponse(response: AnthropicMessage): unknown;

  protected async loadContext(): Promise<ContextBundle> {
    return this.contextManager.loadClientContext(this.clientId, true);
  }

  protected async callClaude(userPrompt: string, context: ContextBundle): Promise<AnthropicMessage> {
    return this.client.messages.create({
      system: this.getSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: JSON.stringify({ userPrompt, context }),
        },
      ],
    }) as Promise<AnthropicMessage>;
  }

  protected async recordTokenUsage(response: AnthropicMessage, agentType: string): Promise<void> {
    await this.tokenMeter.logUsage({
      organizationId: this.organizationId,
      clientId: this.clientId,
      campaignId: this.campaignId,
      agentType,
      model: response.model ?? 'unknown',
      inputTokens: response.usage?.input_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
    });
  }

  protected validateOutput(output: unknown): void {
    if (output === null || output === undefined) {
      throw new Error('Agent output cannot be empty.');
    }
  }

  protected buildBriefPayload(brief: ClientBrief): string {
    return JSON.stringify(brief);
  }
}