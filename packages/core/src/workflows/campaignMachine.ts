export type CampaignState = 'briefing' | 'ideation' | 'ideaReview' | 'scoring' | 'scoreReview' | 'analysis' | 'completed';

export interface CampaignMachineContext {
  brief: unknown | null;
  ideas: unknown[];
  selectedIdea: unknown | null;
  score: number;
}

export interface CampaignMachineDefinition {
  id: 'campaign';
  initial: CampaignState;
  context: CampaignMachineContext;
  states: Record<CampaignState, Record<string, unknown>>;
}

export const campaignMachine: CampaignMachineDefinition = {
  id: 'campaign',
  initial: 'briefing',
  context: {
    brief: null,
    ideas: [],
    selectedIdea: null,
    score: 0,
  },
  states: {
    briefing: {
      on: { BRIEF_SUBMITTED: { target: 'ideation', actions: 'setBrief' } },
    },
    ideation: {
      invoke: { src: 'ideationAgent', onDone: { target: 'ideaReview', actions: 'setIdeas' } },
      on: { IDEA_SELECTED: { target: 'scoring', actions: 'setSelectedIdea' } },
    },
    ideaReview: { type: 'final' },
    scoring: {
      invoke: { src: 'scoringAgent', onDone: { target: 'scoreReview', actions: 'setScore' } },
    },
    scoreReview: { type: 'final' },
    analysis: { type: 'final' },
    completed: { type: 'final' },
  },
};