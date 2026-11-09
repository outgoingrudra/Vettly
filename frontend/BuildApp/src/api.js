const base = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const reads = new Map();
let generation = 0;

export function invalidateReads(path) {
  if (path) reads.delete(path);
  else { generation++; reads.clear(); }
}

function cacheable(path) {
  // Authentication and join previews depend on the current session and clock.
  return !path.startsWith('/auth/') && !/^\/interviews\/[^/?]+\/join(?:\?|$)/.test(path);
}
export function auth(path, body, method) {
  return request('/auth/' + path, body, method);
}
export async function uploadProfileFile(path, field, file) {
  const body = new FormData();
  body.set(field, file);
  const response = await fetch(base + '/auth/' + path, {
    method: 'POST', credentials: 'include', cache: 'no-store', body,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.success !== true) {
    throw Object.assign(new Error(data.message || 'Upload failed. Please try again.'), { status: response.status });
  }
  invalidateReads();
  return data;
}
export async function request(path, body, method = body ? 'POST' : 'GET', { fresh = false } = {}) {
  const cached = method === 'GET' && cacheable(path);
  const entry = cached && reads.get(path);
  if (entry && !fresh && entry.expiresAt > Date.now()) return entry.value;
  if (method !== 'GET') invalidateReads();
  const requestGeneration = generation;
  const pending = fetch(base + path, {
    method, credentials: 'include', cache: 'no-store',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  }).then(async response => {
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success !== true) {
      if (response.status === 401) invalidateReads();
      const fallback = response.status === 429 ? 'Too many attempts. Please try again later.' : 'Could not reach Vettly. Please try again.';
      throw Object.assign(new Error(data.message || fallback), { status: response.status });
    }
    if (method !== 'GET') invalidateReads();
    if (cached && generation === requestGeneration && reads.get(path)?.value === pending)
      reads.set(path, { value: data, expiresAt: Date.now() + 30000 });
    return data;
  }).catch(error => {
    if (cached && reads.get(path)?.value === pending) reads.delete(path);
    throw error;
  });
  if (cached) reads.set(path, { value: pending, expiresAt: Date.now() + 30000 });
  return pending;
}
