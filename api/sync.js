// api/sync.js
// Cloud synchronization endpoint for StartSmart enterprise portals across multiple devices

const KV_BUCKET = process.env.KV_BUCKET || 'KutRJmC9xoDZrkyAohp4pE';
const KV_BASE = `https://kvdb.io/${KV_BUCKET}`;

// In-memory cache for ultra-fast responses in warm lambdas
let memoryBundle = {
  team_messages: null,
  task_reviews: null,
  task_status: null,
  team_plans: null,
  team_blocks: null,
  in_app_messages: null,
  updatedAt: 0
};
let lastFetchedFromKv = 0;

async function fetchFromKv(key) {
  try {
    const res = await fetch(`${KV_BASE}/${key}`, {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.status === 200) {
      return await res.json();
    }
    return null;
  } catch (err) {
    console.error(`Error fetching key ${key} from KV:`, err);
    return null;
  }
}

async function writeToKv(key, value) {
  try {
    const res = await fetch(`${KV_BASE}/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value)
    });
    return res.ok;
  } catch (err) {
    console.error(`Error writing key ${key} to KV:`, err);
    return false;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Handle specific single-key fetch (e.g. proof files: key=proof_xxx)
  if (req.method === 'GET') {
    const { key } = req.query || {};

    if (key && key.startsWith('proof_')) {
      const proofData = await fetchFromKv(key);
      if (proofData) {
        return res.status(200).json({ success: true, key, data: proofData });
      }
      return res.status(404).json({ success: false, message: 'Proof not found' });
    }

    if (key) {
      const data = await fetchFromKv(key);
      return res.status(200).json({ success: true, key, data });
    }

    // Default: fetch entire sync bundle
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
      serverTime: now
    });
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (e) { }
    }

    const { key, value, updates } = body || {};

    // Handle proof storage (stored as individual key to keep sync_bundle small)
    if (key && key.startsWith('proof_')) {
      await writeToKv(key, value);
      return res.status(200).json({ success: true, key });
    }

    // Handle single key or batch updates
    const toUpdate = updates || (key ? { [key]: value } : {});
    const now = Date.now();

    // Ensure we have current bundle from KV
    if (now - lastFetchedFromKv > 2000) {
      const remoteBundle = await fetchFromKv('sync_bundle');
      if (remoteBundle && typeof remoteBundle === 'object') {
        memoryBundle = { ...memoryBundle, ...remoteBundle };
      }
    }

    // Merge updates
    for (const [k, v] of Object.entries(toUpdate)) {
      memoryBundle[k] = v;
      // also write individual key to KV in background
      writeToKv(k, v).catch(() => {});
    }
    memoryBundle.updatedAt = now;
    lastFetchedFromKv = now;

    // Persist master bundle to KV
    await writeToKv('sync_bundle', memoryBundle);

    return res.status(200).json({
      success: true,
      updatedAt: now
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
