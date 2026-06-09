import { Router, type RequestHandler } from 'express';
import { campaignRepo } from '../services/campaign-repo.js';
import { authenticate, type AuthRequest, validateUserAccess, withClientScope } from '../middleware/auth.js';
import { contextManager } from '../services/context-manager.js';
import { tokenMeter } from '../services/token-meter.js';
import { learningsService } from '../services/learnings-service.js';
import { IdeationAgent, ScoringAgent, AnalysisAgent } from '@materfold/core';

export const campaignsRouter = Router();

const createCampaignHandler: RequestHandler = async (req, res) => {
  try {
    const authReq = req as AuthRequest;
    const { clientId, brief } = req.body as { clientId: string; brief: Parameters<typeof contextManager.initializeCampaignContext>[2] };
    validateUserAccess(authReq.user, clientId);

    const campaign = await campaignRepo.create({
      organizationId: authReq.org.id,
      clientId,
      brief,
      status: 'ideation_pending',
    });

    await contextManager.initializeCampaignContext(clientId, campaign.id, brief);
    res.status(201).json(campaign);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

campaignsRouter.post('/campaigns', authenticate, withClientScope, createCampaignHandler);

const ideateCampaignHandler: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const clientScope = authReq.clientScope;
  const campaignId = req.params.campaignId;
  if (!campaignId) {
    res.status(400).json({ error: 'campaignId is required' });
    return;
  }

  const campaign = await campaignRepo.findById(campaignId);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  validateUserAccess(authReq.user, campaign.clientId);

  const agent = new IdeationAgent({
    client: { messages: { create: async () => ({ content: [{ type: 'text', text: '[]' }] }) } },
    tokenMeter,
    contextManager,
    organizationId: authReq.org.id,
    clientId: campaign.clientId,
    campaignId: campaign.id,
  });

  const ideas = await agent.execute(campaign.brief);
  await campaignRepo.update(campaign.id, { ideas, status: 'idea_review' });
  void clientScope;
  res.json({ ideas, campaignId: campaign.id });
};

campaignsRouter.post('/campaigns/:campaignId/ideate', authenticate, withClientScope, ideateCampaignHandler);

const scoreCampaignHandler: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const campaignId = req.params.campaignId;
  if (!campaignId) {
    res.status(400).json({ error: 'campaignId is required' });
    return;
  }

  const campaign = await campaignRepo.findById(campaignId);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  validateUserAccess(authReq.user, campaign.clientId);

  const agent = new ScoringAgent({
    client: { messages: { create: async () => ({ content: [{ type: 'text', text: '{}' }] }) } },
    tokenMeter,
    contextManager,
    organizationId: authReq.org.id,
    clientId: campaign.clientId,
    campaignId: campaign.id,
  });

  const score = await agent.execute({ creativeAsset: 'placeholder', brandGuidelines: [] });
  await campaignRepo.update(campaign.id, { score, status: 'scoring' });
  res.json({ score, campaignId: campaign.id });
};

campaignsRouter.post('/campaigns/:campaignId/score', authenticate, withClientScope, scoreCampaignHandler);

const analyzeCampaignHandler: RequestHandler = async (req, res) => {
  const authReq = req as AuthRequest;
  const clientScope = authReq.clientScope;
  const campaignId = req.params.campaignId;
  if (!campaignId) {
    res.status(400).json({ error: 'campaignId is required' });
    return;
  }

  const campaign = await campaignRepo.findById(campaignId);
  if (!campaign) {
    res.status(404).json({ error: 'Campaign not found' });
    return;
  }

  validateUserAccess(authReq.user, campaign.clientId);

  const agent = new AnalysisAgent({
    client: { messages: { create: async () => ({ content: [{ type: 'text', text: '{}' }] }) } },
    tokenMeter,
    contextManager,
    organizationId: authReq.org.id,
    clientId: campaign.clientId,
    campaignId: campaign.id,
  });

  const analysis = await agent.execute({
    metrics: { impressions: 0, clicks: 0, conversions: 0, spend: 0 },
    previousContext: [],
  });

  await contextManager.appendPerformanceAnalysis(clientScope?.clientId ?? campaign.clientId, campaign.id, analysis);
  await learningsService.updateLearnings(clientScope?.clientId ?? campaign.clientId, analysis, campaign.id);
  await campaignRepo.update(campaign.id, { analysis, status: 'completed' });
  res.json({ analysis, campaignId: campaign.id });
};

campaignsRouter.post('/campaigns/:campaignId/analyze', authenticate, withClientScope, analyzeCampaignHandler);