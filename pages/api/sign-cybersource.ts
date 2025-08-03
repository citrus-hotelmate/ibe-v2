// pages/api/sign-cybersource.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const SECRET_KEY = process.env.CYBERSOURCE_SECRET_KEY; // Keep this in .env

function signFields(fields: Record<string, string>, secretKey: string): string {
  const dataToSign = Object.entries(fields)
    .filter(([key]) => fields.signed_field_names.includes(key))
    .map(([key]) => `${key}=${fields[key]}`)
    .join(',');

  return crypto
    .createHmac('sha256', secretKey)
    .update(dataToSign)
    .digest('base64');
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { fields } = req.body;

  if (!fields || !fields.signed_field_names) {
    return res.status(400).json({ error: 'Missing signed fields' });
  }

  const signature = signFields(fields, SECRET_KEY);
  res.status(200).json({ signature });
}