import type { VercelRequest, VercelResponse } from '@vercel/node';

const AUTH_SECRET = process.env.AUTH_SECRET || '';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { grant_type, code } = req.body || {};

  if (grant_type === 'authorization_code') {
    // Verify the code matches our secret
    const decoded = Buffer.from(code || '', 'base64url').toString();
    if (decoded !== AUTH_SECRET) {
      return res.status(401).json({ error: 'invalid_grant' });
    }

    return res.json({
      access_token: AUTH_SECRET,
      token_type: 'Bearer',
      expires_in: 86400 * 365,
    });
  }

  if (grant_type === 'refresh_token') {
    return res.json({
      access_token: AUTH_SECRET,
      token_type: 'Bearer',
      expires_in: 86400 * 365,
    });
  }

  return res.status(400).json({ error: 'unsupported_grant_type' });
}
