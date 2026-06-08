const { list } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.query.password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { blobs } = await list({
    prefix: 'annotations/',
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  const results = [];
  for (const blob of blobs) {
    try {
      const r    = await fetch(blob.downloadUrl);
      const data = await r.json();
      results.push(data);
    } catch(e) {}
  }

  if (req.query.format === 'csv') {
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
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="annotations.csv"');
    return res.send(rows.join('\n'));
  }

  return res.status(200).json(results);
};
