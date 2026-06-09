import type { ClientBrief, CampaignIdea, PerformanceAnalysis, UUID } from '@materfold/core';
import { createCampaignRecord, findCampaignRecord, updateCampaignRecord } from '@materfold/data';
import type { InputJsonValue, JsonValue } from '@prisma/client/runtime/library';

export interface CampaignRecord {
  id: UUID;
  organizationId: UUID;
  clientId: UUID;
  brief: ClientBrief;
  status: 'ideation_pending' | 'idea_review' | 'scoring' | 'analysis_pending' | 'completed';
  ideas?: CampaignIdea[];
  score?: unknown;
  analysis?: PerformanceAnalysis;
}

export interface CampaignCreateInput {
  organizationId: UUID;
  clientId: UUID;
  brief: ClientBrief;
  status: CampaignRecord['status'];
}

export interface CampaignRepository {
  create(input: CampaignCreateInput): Promise<CampaignRecord>;
  findById(id: UUID): Promise<CampaignRecord | null>;
  update(id: UUID, patch: Partial<CampaignRecord>): Promise<CampaignRecord>;
}

export class InMemoryCampaignRepository implements CampaignRepository {
  private readonly campaigns = new Map<UUID, CampaignRecord>();

  async create(input: CampaignCreateInput): Promise<CampaignRecord> {
    const campaign: CampaignRecord = {
      id: crypto.randomUUID(),
      ...input,
    };
    this.campaigns.set(campaign.id, campaign);
    void createCampaignRecord({
      organizationId: input.organizationId,
      clientId: input.clientId,
      brief: input.brief as unknown as InputJsonValue,
      status: input.status,
    }).catch(() => undefined);
    return campaign;
  }

  async findById(id: UUID): Promise<CampaignRecord | null> {
    const cached = this.campaigns.get(id);
    if (cached) {
      return cached;
    }

    const record = await findCampaignRecord(id).catch(() => null);
    if (!record) {
      return null;
    }

    return {
      id: record.id,
      organizationId: record.organizationId,
      clientId: record.clientId,
      brief: record.brief as unknown as ClientBrief,
      status: record.status as CampaignRecord['status'],
    };
  }

  async update(id: UUID, patch: Partial<CampaignRecord>): Promise<CampaignRecord> {
    const existing = this.campaigns.get(id);
    if (!existing) {
      throw new Error(`Campaign not found: ${id}`);
    }

    const updated = { ...existing, ...patch };
    this.campaigns.set(id, updated);
    void updateCampaignRecord(id, {
      brief: updated.brief as unknown as InputJsonValue,
      status: updated.status,
    }).catch(() => undefined);
    return updated;
  }
}

export const campaignRepo: CampaignRepository = new InMemoryCampaignRepository();