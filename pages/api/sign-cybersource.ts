// pages/api/sign-cybersource.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getHotelIPGByHotelId } from '@/controllers/hotelIPGController';

function signFields(fields: Record<string, string>, secretKey: string): string {
  const signedFieldNames = fields.signed_field_names.split(',');
  const dataToSign = signedFieldNames
    .map((field) => `${field}=${fields[field]}`)
    .join(',');

  return crypto
    .createHmac('sha256', secretKey)
    .update(dataToSign, 'utf8')
    .digest('base64');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { hotelId, ...fields } = req.body;

    if (!hotelId) {
      return res.status(400).json({ error: 'Hotel ID is required' });
    }

    if (!fields || !fields.signed_field_names) {
      return res.status(400).json({ error: 'Missing signed fields' });
    }

    // Get the access token from environment
    const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
    if (!token) {
      return res.status(500).json({ error: 'Access token not configured' });
    }

    // Fetch IPG credentials for the specific hotel
    const ipgCredentials = await getHotelIPGByHotelId({ 
      token, 
      hotelId: parseInt(hotelId) 
    });

    if (!ipgCredentials || ipgCredentials.length === 0) {
      return res.status(404).json({ error: 'IPG credentials not found for this hotel' });
    }

    const secretKey = ipgCredentials[0].secretKey;
    if (!secretKey) {
      return res.status(500).json({ error: 'Secret key not found' });
    }

    const signature = signFields(fields, secretKey);
    
    console.log("✅ CyberSource signature generated for hotel:", hotelId);
    
    return res.status(200).json({ signature });
    
  } catch (error) {
    console.error('Error generating CyberSource signature:', error);
    return res.status(500).json({ error: 'Failed to generate signature' });
  }
}