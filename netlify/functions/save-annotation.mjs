import { getStore } from '@netlify/blobs';

export default async (req) => {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Check study password
  if (data.password !== process.env.STUDY_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check email whitelist
  const allowed = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  if (!allowed.includes((data.user || '').toLowerCase())) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Write to Netlify Blobs — one entry per user, overwritten each sync
  const store = getStore('annotations');
  await store.setJSON(data.user, { ...data, savedAt: new Date().toISOString() });

  return Response.json({ success: true });
};

export const config = { path: '/api/save-annotation' };
