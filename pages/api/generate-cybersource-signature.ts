import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const credsRes = await fetch(`${BASE_URL}/API_IBE/GetIPGCredentials.aspx`);
  const credsData = await credsRes.json();
  const SECRET_KEY = credsData?.[0]?.SecretKey_USD;

  if (!SECRET_KEY) {
    return res.status(500).json({ error: 'Secret key not found' });
  }

  const params = req.body as Record<string, string>;
  const signedFieldNames = params.signed_field_names?.split(',') || [];

  const dataToSign = signedFieldNames
    .map((field) => `${field}=${params[field]}`)
    .join(',');

  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(dataToSign, 'utf8')
    .digest('base64');

  return res.status(200).json({ signature });
}