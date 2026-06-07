import { getStore } from '@netlify/blobs';

// Admin-only endpoint — returns all annotators' data as JSON.
// Access: GET /api/get-annotations?password=YOUR_ADMIN_PASSWORD
//
// To download as CSV instead, add &format=csv to the URL.

export default async (req, context) => {
  const url      = new URL(req.url);
  const password = url.searchParams.get('password');

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const store        = getStore({ name: 'annotations', context });
  const { blobs }    = await store.list();
  const results      = [];

  for (const blob of blobs) {
    const data = await store.get(blob.key, { type: 'json' });
    if (data) results.push(data);
  }

  // Optional CSV export
  if (url.searchParams.get('format') === 'csv') {
    const rows = ['user,clips_reviewed,clips_total,total_spikes,clip_name,spike_sample,spike_time_s,saved_at'];
    for (const r of results) {
      const anns = r.annotations || {};
      const rev  = r.reviewed    || {};
      for (const fname of Object.keys(rev)) {
        const clipName = fname.replace('.csv', '');
        const spikes   = anns[fname] || [];
        if (spikes.length > 0) {
          for (const s of spikes) {
            rows.push(`${r.user},${r.clipsReviewed},${r.clipsTotal},${r.totalSpikes},${clipName},${s},${(s/1000).toFixed(4)},${r.savedAt}`);
          }
        } else {
          rows.push(`${r.user},${r.clipsReviewed},${r.clipsTotal},${r.totalSpikes},${clipName},,,${r.savedAt}`);
        }
      }
    }
    return new Response(rows.join('\n'), {
      headers: {
        'Content-Type':        'text/csv',
        'Content-Disposition': 'attachment; filename="annotations.csv"',
      },
    });
  }

  return Response.json(results);
};

export const config = { path: '/api/get-annotations' };
