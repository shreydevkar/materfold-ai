import type { Prisma } from '@prisma/client';
import type { JsonValue } from '@prisma/client/runtime/library';
import { prisma } from './prisma.js';

export interface StoredCampaignRecord {
  id: string;
  organizationId: string;
  clientId: string;
  brief: JsonValue;
  status: string;
}

export interface StoredLearningRecord {
  clientId: string;
  insight: string;
  confidence: number;
  campaignIds: JsonValue;
  lastObserved: Date;
  conflicted: boolean;
}

export interface CreateCampaignRecordInput {
  organizationId: string;
  clientId: string;
  brief: JsonValue;
  status: string;
}

export async function createCampaignRecord(input: CreateCampaignRecordInput) {
  return prisma.campaign.create({
    data: {
      organizationId: input.organizationId,
      clientId: input.clientId,
      brief: input.brief as unknown as JsonValue,
      status: input.status,
    },
  }) as Promise<StoredCampaignRecord>;
}

export async function findCampaignRecord(id: string): Promise<StoredCampaignRecord | null> {
  return prisma.campaign.findUnique({
    where: { id },
  }) as Promise<StoredCampaignRecord | null>;
}

export async function updateCampaignRecord(id: string, patch: Partial<{ brief: JsonValue; status: string }>) {
  return prisma.campaign.update({
    where: { id },
    data: {
      ...(patch.brief ? { brief: patch.brief as unknown as JsonValue } : {}),
      ...(patch.status ? { status: patch.status } : {}),
    },
  }) as Promise<StoredCampaignRecord>;
}

export async function listClientLearnings(clientId: string): Promise<StoredLearningRecord[]> {
  return prisma.clientLearning.findMany({
    where: { clientId },
    orderBy: [{ confidence: 'desc' }, { lastObserved: 'desc' }],
  }) as Promise<StoredLearningRecord[]>;
}

export async function upsertClientLearning(input: {
  clientId: string;
  insight: string;
  confidence: number;
  campaignIds: string[];
  conflicted?: boolean;
}) {
  return prisma.clientLearning.upsert({
    where: {
      clientId_insight: {
        clientId: input.clientId,
        insight: input.insight,
      },
    },
    create: {
      clientId: input.clientId,
      insight: input.insight,
      confidence: input.confidence,
      campaignIds: input.campaignIds,
      lastObserved: new Date(),
      conflicted: input.conflicted ?? false,
    },
    update: {
      confidence: input.confidence,
      campaignIds: input.campaignIds,
      lastObserved: new Date(),
      conflicted: input.conflicted ?? false,
    },
  }) as Promise<StoredLearningRecord>;
}

export async function createTokenUsageLog(input: {
  organizationId: string;
  clientId: string;
  campaignId: string;
  agentType: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: string;
}) {
  return prisma.tokenUsageLog.create({
    data: {
      organizationId: input.organizationId,
      clientId: input.clientId,
      campaignId: input.campaignId,
      agentType: input.agentType,
      modelId: input.modelId,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      estimatedCost: input.estimatedCost,
    },
  }) as Promise<unknown>;
}