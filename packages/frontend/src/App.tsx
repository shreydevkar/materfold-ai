import { useEffect, useState } from 'react';

type FeatureCard = {
  title: string;
  description: string;
  accent: string;
};

const features: FeatureCard[] = [
  {
    title: 'Brief to launch',
    description: 'Convert intake, ideation, scoring, and analysis into a single agentic pipeline.',
    accent: 'from-[#f97316] to-[#fb7185]',
  },
  {
    title: 'Leak-free context',
    description: 'Keep system, agency, and client memory isolated with scoped prompt assembly.',
    accent: 'from-[#0f766e] to-[#14b8a6]',
  },
  {
    title: 'Token-aware execution',
    description: 'Track every Claude call per campaign so cost and usage remain visible.',
    accent: 'from-[#1d4ed8] to-[#60a5fa]',
  },
];

const milestones = [
  'Client brief captured',
  'Ideas generated and reviewed',
  'Creative scored with diagnostics',
  'Performance feedback folded back into memory',
];

const apiKeyStorageKey = 'materfold:anthropicApiKey';
const apiBaseUrl = 'http://localhost:3000';

type CampaignIdea = {
  concept: string;
  tone: string;
  visualApproach: string;
  expectedKpiLift: string;
};

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [savedApiKey, setSavedApiKey] = useState('');
  const [clientId, setClientId] = useState('demo-client');
  const [platform, setPlatform] = useState('instagram');
  const [ageMin, setAgeMin] = useState('25');
  const [ageMax, setAgeMax] = useState('34');
  const [budget, setBudget] = useState('1500');
  const [kpis, setKpis] = useState('CTR,ROAS');
  const [messagingDirection, setMessagingDirection] = useState('Performance creatives for DTC growth');
  const [campaignId, setCampaignId] = useState('');
  const [ideas, setIdeas] = useState<CampaignIdea[]>([]);
  const [runnerStatus, setRunnerStatus] = useState('Ready');
  const [runnerError, setRunnerError] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const storedKey = window.localStorage.getItem(apiKeyStorageKey) ?? '';
    setApiKey(storedKey);
    setSavedApiKey(storedKey);
  }, []);

  const handleSaveApiKey = () => {
    const trimmedKey = apiKey.trim();
    window.localStorage.setItem(apiKeyStorageKey, trimmedKey);
    setSavedApiKey(trimmedKey);
  };

  const handleClearApiKey = () => {
    window.localStorage.removeItem(apiKeyStorageKey);
    setApiKey('');
    setSavedApiKey('');
  };

  const runCampaign = async () => {
    setRunnerError('');
    setRunnerStatus('Creating campaign...');
    setIsRunning(true);

    try {
      if (!savedApiKey.trim()) {
        throw new Error('Save your Anthropic API key first.');
      }

      const brief = {
        clientId,
        platform,
        audience: {
          ageMin: Number(ageMin),
          ageMax: Number(ageMax),
        },
        budget: Number(budget),
        kpis: kpis.split(',').map((item) => item.trim()).filter(Boolean),
        messagingDirection,
      };

      const createdCampaignResponse = await fetch(`${apiBaseUrl}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-anthropic-api-key': savedApiKey,
        },
        body: JSON.stringify({ clientId, brief }),
      });

      if (!createdCampaignResponse.ok) {
        const failure = await createdCampaignResponse.json().catch(() => ({}));
        throw new Error(failure.error ?? 'Campaign creation failed');
      }

      const createdCampaign = (await createdCampaignResponse.json()) as { id: string };
      setCampaignId(createdCampaign.id);
      setRunnerStatus('Generating ideas...');

      const ideationResponse = await fetch(`${apiBaseUrl}/api/campaigns/${createdCampaign.id}/ideate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-anthropic-api-key': savedApiKey,
        },
      });

      if (!ideationResponse.ok) {
        const failure = await ideationResponse.json().catch(() => ({}));
        throw new Error(failure.error ?? 'Ideation failed');
      }

      const ideationResult = (await ideationResponse.json()) as { ideas: CampaignIdea[] };
      setIdeas(ideationResult.ideas ?? []);
      setRunnerStatus('Ideas generated successfully.');
    } catch (error) {
      setRunnerError(error instanceof Error ? error.message : 'Unexpected error');
      setRunnerStatus('Ready');
    } finally {
      setIsRunning(false);
    }
  };

  const maskedKey = savedApiKey ? `${savedApiKey.slice(0, 6)}${'•'.repeat(Math.max(0, Math.min(10, savedApiKey.length - 6)))}` : 'Not set';

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">Materfold AI</p>
          <h1>Marketing agency workflow orchestration with institutional memory.</h1>
          <p className="lede">
            A leak-free agentic system for campaign briefing, ideation, scoring, and post-campaign analysis.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#pipeline">
              Explore pipeline
            </a>
            <a className="secondary-button" href="#architecture">
              View architecture
            </a>
          </div>
        </div>

        <div className="status-card">
          <div className="status-card__header">
            <span>Live workflow</span>
            <span className="status-pill">Operational</span>
          </div>
          <div className="status-grid">
            <div>
              <strong>5</strong>
              <span>pipeline stages</span>
            </div>
            <div>
              <strong>3</strong>
              <span>context tiers</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>scope validation</span>
            </div>
            <div>
              <strong>1</strong>
              <span>shared memory model</span>
            </div>
          </div>
        </div>
      </section>

      <section className="settings-card" aria-label="API key settings">
        <div>
          <p className="section-label">Settings</p>
          <h2>Save your Anthropic API key locally</h2>
          <p className="settings-copy">
            Store the key in this browser so you can prototype quickly after downloading the project from GitHub.
            It stays in localStorage on this device only.
          </p>
        </div>

        <label className="api-key-field">
          <span>Anthropic API Key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="sk-ant-..."
            autoComplete="off"
            spellCheck={false}
          />
        </label>

        <div className="settings-actions">
          <button type="button" className="primary-button" onClick={handleSaveApiKey}>
            Save locally
          </button>
          <button type="button" className="secondary-button" onClick={handleClearApiKey}>
            Clear
          </button>
        </div>

        <div className="settings-status">
          <span>Current value</span>
          <strong>{maskedKey}</strong>
        </div>
      </section>

      <section className="runner-card" aria-label="Campaign runner">
        <div>
          <p className="section-label">Try it now</p>
          <h2>Run a real campaign brief through the API</h2>
          <p className="settings-copy">
            This creates a campaign, sends your brief to the backend, and uses the Anthropic key you saved locally to generate campaign ideas.
          </p>
        </div>

        <div className="runner-form">
          <label>
            <span>Client ID</span>
            <input value={clientId} onChange={(event) => setClientId(event.target.value)} />
          </label>
          <label>
            <span>Platform</span>
            <select value={platform} onChange={(event) => setPlatform(event.target.value)}>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="google">Google Ads</option>
              <option value="tiktok">TikTok</option>
            </select>
          </label>
          <label>
            <span>Age Min</span>
            <input type="number" value={ageMin} onChange={(event) => setAgeMin(event.target.value)} />
          </label>
          <label>
            <span>Age Max</span>
            <input type="number" value={ageMax} onChange={(event) => setAgeMax(event.target.value)} />
          </label>
          <label>
            <span>Budget</span>
            <input type="number" value={budget} onChange={(event) => setBudget(event.target.value)} />
          </label>
          <label className="runner-form__wide">
            <span>KPIs</span>
            <input value={kpis} onChange={(event) => setKpis(event.target.value)} />
          </label>
          <label className="runner-form__wide">
            <span>Messaging direction</span>
            <textarea value={messagingDirection} onChange={(event) => setMessagingDirection(event.target.value)} rows={3} />
          </label>
        </div>

        <div className="settings-actions">
          <button type="button" className="primary-button" onClick={runCampaign} disabled={isRunning}>
            {isRunning ? 'Running...' : 'Create campaign and generate ideas'}
          </button>
        </div>

        <div className="settings-status">
          <span>Status</span>
          <strong>{runnerStatus}</strong>
          {campaignId ? <span className="runner-meta">Campaign ID: {campaignId}</span> : null}
          {runnerError ? <span className="runner-error">{runnerError}</span> : null}
        </div>

        {ideas.length > 0 ? (
          <div className="ideas-grid">
            {ideas.map((idea) => (
              <article key={idea.concept} className="idea-card">
                <h3>{idea.concept}</h3>
                <p><strong>Tone:</strong> {idea.tone}</p>
                <p><strong>Visual:</strong> {idea.visualApproach}</p>
                <p><strong>Expected lift:</strong> {idea.expectedKpiLift}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>

      <section className="feature-row" id="architecture">
        {features.map((feature) => (
          <article key={feature.title} className="feature-card">
            <div className={`feature-card__accent bg-gradient-to-br ${feature.accent}`} />
            <h2>{feature.title}</h2>
            <p>{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="pipeline-grid" id="pipeline">
        <article className="pipeline-card">
          <p className="section-label">Workflow</p>
          <h2>Campaign lifecycle</h2>
          <ol className="milestone-list">
            {milestones.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
        </article>

        <article className="pipeline-card pipeline-card--dark">
          <p className="section-label">Guardrails</p>
          <h2>Built for isolation</h2>
          <ul className="guardrail-list">
            <li>Org-scoped database access</li>
            <li>Client-scoped context assembly</li>
            <li>Prompt injection detection</li>
            <li>Token usage tracking</li>
          </ul>
        </article>
      </section>
    </main>
  );
}