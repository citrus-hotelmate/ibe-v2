import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { getHotelIPGByHotelId } from '@/controllers/hotelIPGController';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { hotelId, ...params } = req.body as Record<string, string>;
    
    if (!hotelId) {
      return res.status(400).json({ error: 'Hotel ID is required' });
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

    // Get the signed field names and create signature
    const signedFieldNames = params.signed_field_names?.split(',') || [];
    
    const dataToSign = signedFieldNames
      .map((field) => `${field}=${params[field]}`)
      .join(',');

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(dataToSign, 'utf8')
      .digest('base64');

    return res.status(200).json({ signature });
  } catch (error) {
    console.error('Error generating CyberSource signature:', error);
    return res.status(500).json({ error: 'Failed to generate signature' });
  }
}
