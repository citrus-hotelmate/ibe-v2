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

    console.log("🔍 CyberSource Signature Request:", {
      hotelId,
      fieldsReceived: Object.keys(fields),
      signedFieldNames: fields.signed_field_names
    });

    if (hotelId === null || hotelId === undefined) {
      console.error("❌ Missing hotel ID");
      return res.status(400).json({ error: 'Hotel ID is required' });
    }

    if (!fields || !fields.signed_field_names) {
      console.error("❌ Missing signed fields");
      return res.status(400).json({ error: 'Missing signed fields' });
    }

    // Get the access token from environment
    const token = process.env.NEXT_PUBLIC_ACCESS_TOKEN;
    if (!token) {
      console.error("❌ Access token not configured");
      return res.status(500).json({ error: 'Access token not configured' });
    }

    // TESTING: Hardcode hotel ID to 0
    const testHotelId = 0;
    console.log("🔄 Fetching IPG credentials for hotel:", testHotelId, "(hardcoded for testing)");
    const ipgCredentials = await getHotelIPGByHotelId({ 
      token, 
      hotelId: testHotelId 
    });

    console.log("IPG Credentials:", ipgCredentials);

    if (!ipgCredentials || ipgCredentials.length === 0) {
      console.error("❌ IPG credentials not found for hotel:", hotelId);
      return res.status(404).json({ error: 'IPG credentials not found for this hotel' });
    }

    console.log("✅ IPG Credentials found:", {
      ipgId: ipgCredentials[0].ipgId,
      ipgName: ipgCredentials[0].ipgName,
      isSandBoxMode: ipgCredentials[0].isSandBoxMode,
      OnTestMode: ipgCredentials[0].OnTestMode,
      hasSecretKey: !!ipgCredentials[0].secretKey,
      hasAccessKey: !!ipgCredentials[0].accessKeyUSD,
      hasProfileId: !!ipgCredentials[0].profileIdUSD
    });
    
    console.log("🔑 IPG Credential Details (Masked):", {
      accessKeyUSD: ipgCredentials[0].accessKeyUSD ? 
        `${ipgCredentials[0].accessKeyUSD.substring(0, 10)}...` : 'MISSING',
      profileIdUSD: ipgCredentials[0].profileIdUSD ? 
        `${ipgCredentials[0].profileIdUSD.substring(0, 10)}...` : 'MISSING',
      secretKey: ipgCredentials[0].secretKey ? 
        `${ipgCredentials[0].secretKey.substring(0, 10)}...` : 'MISSING',
      secretKeyLength: ipgCredentials[0].secretKey?.length || 0
    });

    const secretKey = ipgCredentials[0].secretKey;
    const isSandBoxMode = ipgCredentials[0].isSandBoxMode;
    
    if (!secretKey) {
      console.error("❌ Secret key not found in IPG credentials");
      return res.status(500).json({ error: 'Secret key not found' });
    }

    const signature = signFields(fields, secretKey);
    
    // Determine the correct endpoint based on sandbox mode
    const endpoint = isSandBoxMode 
      ? "https://testsecureacceptance.cybersource.com/pay"
      : "https://secureacceptance.cybersource.com/pay";
    
    console.log("✅ CyberSource signature generated for hotel:", hotelId);
    console.log("🔗 Endpoint determined:", endpoint, "(Sandbox:", isSandBoxMode + ")");
    console.log("📝 Signature length:", signature.length);
    
    return res.status(200).json({ 
      signature,
      endpoint,
      isSandBoxMode 
    });
    
  } catch (error) {
    console.error('❌ Error generating CyberSource signature:', error);
    return res.status(500).json({ error: 'Failed to generate signature', details: error instanceof Error ? error.message : 'Unknown error' });
  }
}