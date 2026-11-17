const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { filename, contentType } = body || {};

    if (!filename) {
      return res.status(400).json({ error: 'Filename mancante' });
    }

    const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `videos/${Date.now()}-${cleanName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType || 'video/mp4',
    });

    const uploadUrl = await getSignedUrl(R2, command, { expiresIn: 3600 });
    const publicBase = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    const publicUrl = `${publicBase}/${key}`;

    return res.status(200).json({ uploadUrl, publicUrl, key });
  } catch (error) {
    console.error('Errore generazione URL R2:', error);
    return res.status(500).json({ error: error.message || 'Errore interno R2' });
  }
};
