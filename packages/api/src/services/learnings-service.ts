import type { UUID, PerformanceAnalysis } from '@materfold/core';
import { listClientLearnings, upsertClientLearning, type StoredLearningRecord } from '@materfold/data';

export interface ClientLearning {
  clientId: UUID;
  insight: string;
  confidence: number;
  campaignIds: UUID[];
  lastObserved: string;
  conflicted: boolean;
}

export interface LearningsStore {
  list(clientId: UUID): Promise<ClientLearning[]>;
  save(learning: ClientLearning): Promise<void>;
}

export class InMemoryLearningsStore implements LearningsStore {
  private readonly learnings = new Map<UUID, ClientLearning[]>();

  async list(clientId: UUID): Promise<ClientLearning[]> {
    return [...(this.learnings.get(clientId) ?? [])];
  }

  async save(learning: ClientLearning): Promise<void> {
    const current = this.learnings.get(learning.clientId) ?? [];
    const updated = current.filter((item) => item.insight !== learning.insight);
    updated.push(learning);
    this.learnings.set(learning.clientId, updated);
  }
}

export class LearningsService {
  constructor(private readonly store: LearningsStore = new InMemoryLearningsStore()) {}

  async updateLearnings(clientId: UUID, analysis: PerformanceAnalysis, campaignId: UUID): Promise<ClientLearning[]> {
    const existing = await this.store.list(clientId);
    const extractedInsights = this.extractInsights(analysis);

    for (const insight of extractedInsights) {
      const matching = existing.find((item) => item.insight.toLowerCase() === insight.toLowerCase());
      const nextConfidence = matching ? Math.min(100, matching.confidence + 10) : 40;

      const nextLearning: ClientLearning = {
        clientId,
        insight,
        confidence: nextConfidence,
        campaignIds: matching ? [...new Set([...matching.campaignIds, campaignId])] : [campaignId],
        lastObserved: new Date().toISOString(),
        conflicted: Boolean(matching && matching.confidence > nextConfidence),
      };

      await this.store.save(nextLearning);
      void upsertClientLearning({
        clientId,
        insight: nextLearning.insight,
        confidence: nextLearning.confidence,
        campaignIds: nextLearning.campaignIds,
        conflicted: nextLearning.conflicted,
      }).catch(() => undefined);
    }

    return this.store.list(clientId);
  }

  async getHighConfidenceLearnings(clientId: UUID, minConfidence = 50): Promise<ClientLearning[]> {
    const learnings = await this.store.list(clientId);
    const persisted = await listClientLearnings(clientId).catch(() => [] as StoredLearningRecord[]);
    const merged = [
      ...learnings,
      ...persisted.map((learning: StoredLearningRecord) => ({
        clientId: learning.clientId,
        insight: learning.insight,
        confidence: learning.confidence,
        campaignIds: Array.isArray(learning.campaignIds) ? (learning.campaignIds as UUID[]) : [],
        lastObserved: learning.lastObserved.toISOString(),
        conflicted: learning.conflicted,
      })),
    ];

    return merged.filter((learning) => learning.confidence >= minConfidence);
  }

  private extractInsights(analysis: PerformanceAnalysis): string[] {
    return [
      ...analysis.whatWorked.slice(0, 3).map((item) => `Worked: ${item}`),
      ...analysis.whatDidnt.slice(0, 2).map((item) => `Did not work: ${item}`),
      ...analysis.recommendations.slice(0, 3).map((item) => `Next: ${item}`),
    ];
  }
}

export const learningsService = new LearningsService();