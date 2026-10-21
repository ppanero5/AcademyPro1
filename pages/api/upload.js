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
    bodyParser: {
      sizeLimit: '100mb', // Supporta file fino a 100MB
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { filename, fileData, contentType } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: 'Dati file mancanti' });
    }

    const cleanFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const base64Data = fileData.split(';base64,').pop();
    const buffer = Buffer.from(base64Data, 'base64');

    await s3.send(
      new PutObjectCommand({
        Bucket: 'academy-videos',
        Key: cleanFilename,
        Body: buffer,
        ContentType: contentType || 'video/mp4',
      })
    );

    const publicUrl = `${process.env.NEXT_PUBLIC_CLOUDFLARE_PUBLIC_URL}/${cleanFilename}`;
    return res.status(200).json({ publicUrl });
  } catch (err) {
    console.error('R2 upload error:', err);
    return res.status(500).json({ error: 'Errore durante il caricamento su Cloudflare R2' });
  }
}
