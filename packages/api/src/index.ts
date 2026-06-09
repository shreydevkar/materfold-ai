import express from 'express';
import { campaignsRouter } from './routes/campaigns.js';

export function createApi() {
  const app = express();

  app.use(express.json());
  app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'materfold-api' });
  });
  app.use('/api', campaignsRouter);

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT ?? 3000);
  const app = createApi();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Materfold API listening on port ${port}`);
  });
}