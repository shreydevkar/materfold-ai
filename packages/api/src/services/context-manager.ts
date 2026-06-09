import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { CampaignContext } from '@materfold/core';
import type { ClientBrief, PerformanceAnalysis, UUID } from '@materfold/core';

export interface ContextManagerOptions {
  storePath: string;
}

export class ContextManager {
  constructor(private readonly options: ContextManagerOptions) {}

  async initializeCampaignContext(clientId: UUID, campaignId: UUID, brief: ClientBrief): Promise<void> {
    const context: CampaignContext = {
      campaignId,
      clientId,
      createdAt: new Date().toISOString(),
      version: 1,
      campaignBrief: brief,
      previousCampaigns: [],
      lastUpdated: new Date().toISOString(),
    };

    await mkdir(this.getClientFolder(clientId), { recursive: true });
    await writeFile(this.getContextFilePath(clientId, campaignId), JSON.stringify(context, null, 2), 'utf8');
  }

  async appendPerformanceAnalysis(clientId: UUID, campaignId: UUID, analysis: PerformanceAnalysis): Promise<void> {
    const context = await this.loadCampaignContext(clientId, campaignId);
    context.performanceAnalysis = analysis;
    context.lastUpdated = new Date().toISOString();
    await writeFile(this.getContextFilePath(context.clientId, campaignId), JSON.stringify(context, null, 2), 'utf8');
  }

  async loadClientContext(clientId: UUID, includeHistorical = true): Promise<{ systemKnowledge: string[]; agencyKnowledge: string[]; clientHistory: CampaignContext[] }> {
    void includeHistorical;
    const folder = this.getClientFolder(clientId);
    await mkdir(folder, { recursive: true });
    const files = await readdir(folder);
    const clientHistory: CampaignContext[] = [];

    for (const fileName of files.filter((file) => file.endsWith('.json'))) {
      const content = await readFile(join(folder, fileName), 'utf8');
      clientHistory.push(JSON.parse(content) as CampaignContext);
    }

    return {
      systemKnowledge: ['marketing best practices', 'platform guidelines'],
      agencyKnowledge: ['agency brand guidelines'],
      clientHistory,
    };
  }

  async validateContextFile(contextData: CampaignContext): Promise<boolean> {
    return contextData.campaignId.length > 0 && contextData.clientId.length > 0;
  }

  async getContextHistory(clientId: UUID): Promise<string[]> {
    const folder = this.getClientFolder(clientId);
    await mkdir(folder, { recursive: true });
    return readdir(folder);
  }

  async loadCampaignContext(clientId: UUID, campaignId: UUID): Promise<CampaignContext> {
    const filePath = this.getContextFilePath(clientId, campaignId);
    const content = await readFile(filePath, 'utf8');
    return JSON.parse(content) as CampaignContext;
  }

  private getStoreRoot(): string {
    return this.options.storePath;
  }

  private getClientFolder(clientId: UUID): string {
    return join(this.getStoreRoot(), `client-${clientId}`, 'campaign-contexts');
  }

  private getContextFilePath(clientId: UUID, campaignId: UUID): string {
    return join(this.getClientFolder(clientId), `${campaignId}.json`);
  }
}

export const contextManager = new ContextManager({
  storePath: process.env.CONTEXT_STORE_PATH ?? 'context-store',
});