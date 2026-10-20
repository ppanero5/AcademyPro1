import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
});

export const config = {
  api: {
    bodyParser: false, // Per consentire streaming di video pesanti fino a 90s/centinaia di MB
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
    const chunks = [];

    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    await s3.send(
      new PutObjectCommand({
        Bucket: 'academy-videos',
        Key: filename,
        Body: buffer,
        ContentType: 'video/mp4',
      })
    );

    const publicUrl = `${process.env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_URL}/${filename}`;
    return res.status(200).json({ url: publicUrl });
  } catch (err) {
    console.error('R2 upload error:', err);
    return res.status(500).json({ error: 'Errore durante il caricamento del video su Cloudflare R2' });
  }
}
