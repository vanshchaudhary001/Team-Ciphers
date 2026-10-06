import { Router, Request, Response } from 'express';

const syncRouter = Router();

const KV_BUCKET = process.env.KV_BUCKET || 'KutRJmC9xoDZrkyAohp4pE';
const KV_BASE = `https://kvdb.io/${KV_BUCKET}`;

let memoryBundle: Record<string, any> = {
  team_messages: null,
  task_reviews: null,
  task_status: null,
  team_plans: null,
  team_blocks: null,
  in_app_messages: null,
  updatedAt: 0,
};
let lastFetchedFromKv = 0;

async function fetchFromKv(key: string) {
  try {
    const res = await fetch(`${KV_BASE}/${key}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (res.status === 200) {
      return await res.json();
    }
    return null;
  } catch {
    return null;
  }
}

async function writeToKv(key: string, value: any) {
  try {
    const res = await fetch(`${KV_BASE}/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value),
    });
    return res.ok;
  } catch {
    return false;
  }
}

syncRouter.get('/', async (req: Request, res: Response) => {
  const { key } = req.query;

  if (typeof key === 'string' && key.startsWith('proof_')) {
    const proofData = await fetchFromKv(key);
    if (proofData) {
      return res.status(200).json({ success: true, key, data: proofData });
    }
    return res.status(404).json({ success: false, message: 'Proof not found' });
  }

  if (typeof key === 'string') {
    const data = await fetchFromKv(key);
    return res.status(200).json({ success: true, key, data });
  }

  const now = Date.now();
  if (now - lastFetchedFromKv > 1000 || !memoryBundle.team_messages) {
    const remoteBundle = await fetchFromKv('sync_bundle');
    if (remoteBundle && typeof remoteBundle === 'object') {
      memoryBundle = { ...memoryBundle, ...remoteBundle };
      lastFetchedFromKv = now;
    }
  }

  return res.status(200).json({
    success: true,
    bundle: memoryBundle,
    serverTime: now,
  });
});

syncRouter.post('/', async (req: Request, res: Response) => {
  const { key, value, updates } = req.body || {};

  if (typeof key === 'string' && key.startsWith('proof_')) {
    await writeToKv(key, value);
    return res.status(200).json({ success: true, key });
  }

  const toUpdate = updates || (key ? { [key]: value } : {});
  const now = Date.now();

  if (now - lastFetchedFromKv > 2000) {
    const remoteBundle = await fetchFromKv('sync_bundle');
    if (remoteBundle && typeof remoteBundle === 'object') {
      memoryBundle = { ...memoryBundle, ...remoteBundle };
    }
  }

  for (const [k, v] of Object.entries(toUpdate)) {
    memoryBundle[k] = v;
    writeToKv(k, v).catch(() => {});
  }
  memoryBundle.updatedAt = now;
  lastFetchedFromKv = now;

  await writeToKv('sync_bundle', memoryBundle);

  return res.status(200).json({
    success: true,
    updatedAt: now,
  });
});

export default syncRouter;
