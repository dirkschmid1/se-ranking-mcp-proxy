import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const AUTH_SECRET = process.env.AUTH_SECRET || '';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { redirect_uri, state, code_challenge, code_challenge_method, client_id } = 
    req.method === 'GET' ? req.query : req.body;

  if (req.method === 'GET') {
    const html = `<!DOCTYPE html>
<html><head><title>SE Ranking MCP – Authorize</title>
<style>
  body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; }
  .card { background: #1e293b; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); max-width: 400px; width: 90%; }
  h2 { margin-top: 0; color: #60a5fa; }
  input[type=password] { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #334155; border-radius: 8px; box-sizing: border-box; background: #0f172a; color: #e2e8f0; font-size: 15px; }
  button { width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; }
  button:hover { background: #1d4ed8; }
  p { color: #94a3b8; font-size: 14px; }
</style></head>
<body>
<div class="card">
  <h2>🔐 SE Ranking MCP</h2>
  <p>Enter your access token to authorize Claude:</p>
  <form method="POST" action="/api/oauth/authorize">
    <input type="hidden" name="redirect_uri" value="${redirect_uri || ''}" />
    <input type="hidden" name="state" value="${state || ''}" />
    <input type="hidden" name="code_challenge" value="${code_challenge || ''}" />
    <input type="hidden" name="code_challenge_method" value="${code_challenge_method || ''}" />
    <input type="hidden" name="client_id" value="${client_id || ''}" />
    <input type="password" name="token" placeholder="Access Token" required autofocus />
    <button type="submit">Authorize</button>
  </form>
</div>
</body></html>`;
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }

  if (req.method === 'POST') {
    const body = req.body;
    const token = body?.token;
    const redir = body?.redirect_uri as string;
    const st = body?.state as string;

    if (!token || token !== AUTH_SECRET) {
      const html = `<!DOCTYPE html>
<html><head><title>Error</title>
<style>
  body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; }
  .card { background: #1e293b; padding: 2rem; border-radius: 12px; max-width: 400px; }
  .error { color: #f87171; }
  a { color: #60a5fa; }
</style></head>
<body><div class="card"><h2 class="error">❌ Invalid token</h2><p><a href="javascript:history.back()">Try again</a></p></div></body></html>`;
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    // Generate auth code
    const code = crypto.randomBytes(32).toString('hex');
    // Store code temporarily by encoding the secret into it
    const signedCode = Buffer.from(JSON.stringify({ code, secret: AUTH_SECRET, exp: Date.now() + 300000 })).toString('base64url');

    const redirectUrl = new URL(redir);
    redirectUrl.searchParams.set('code', signedCode);
    if (st) redirectUrl.searchParams.set('state', st);

    return res.redirect(302, redirectUrl.toString());
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
