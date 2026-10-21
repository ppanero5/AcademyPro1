import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, contentType } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Nome file mancante' });
    }

    const cleanFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    const command = new PutObjectCommand({
      Bucket: 'academy-videos', // Assicurati coincida con il nome del bucket su Cloudflare
      Key: cleanFilename,
      ContentType: contentType || 'video/mp4',
    });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });
    const publicUrl = `${process.env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_URL}/${cleanFilename}`;

    return res.status(200).json({ uploadUrl, publicUrl });
  } catch (err) {
    console.error('R2 upload error:', err);
    return res.status(500).json({ error: `${err.name || 'Errore'}: ${err.message || 'Errore R2'}` });
  }
}
