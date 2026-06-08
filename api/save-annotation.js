const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;

  if (data.password !== process.env.STUDY_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const allowed = (process.env.ALLOWED_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  if (!allowed.includes((data.user || '').toLowerCase())) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const filename = `annotations/${data.user.replace('@', '_at_')}.json`;
  await put(filename, JSON.stringify({ ...data, savedAt: new Date().toISOString() }), {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return res.status(200).json({ success: true });
};
