// Simple sync client: attempts to talk to a local server (http://localhost:4000)
const DEFAULT_BASE = 'http://localhost:4000';

async function tryJson(res) {
  try { return await res.json(); } catch (e) { return null; }
}

export async function pushToServer({ userId, items, baseUrl } = {}) {
  const base = baseUrl || DEFAULT_BASE;
  try {
    const res = await fetch(`${base}/sync/push`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items })
    });
    const json = await tryJson(res);
    return json || { ok: false };
  } catch (e) {
    // fallback to local stub
    return { ok: false, error: 'network' };
  }
}

export async function pullFromServer({ userId, since, baseUrl } = {}) {
  const base = baseUrl || DEFAULT_BASE;
  try {
    const url = new URL(`${base}/sync/pull`);
    if (userId) url.searchParams.set('userId', userId);
    if (since) url.searchParams.set('since', since);
    const res = await fetch(url.toString());
    const json = await tryJson(res);
    return json?.items || [];
  } catch (e) {
    return [];
  }
}

export default { pushToServer, pullFromServer };
