import type { VercelRequest, VercelResponse } from '@vercel/node';

const AUTH_SECRET = process.env.AUTH_SECRET || '';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { redirect_uri, state, code_challenge, code_challenge_method } = req.query;

  if (req.method === 'GET') {
    // Show a simple login page
    const html = `<!DOCTYPE html>
<html><head><title>SE Ranking MCP - Authorize</title>
<style>
  body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
  .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
  h2 { margin-top: 0; }
  input { width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 6px; box-sizing: border-box; }
  button { width: 100%; padding: 10px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px; }
  button:hover { background: #1d4ed8; }
  .error { color: red; display: none; margin-top: 8px; }
</style></head>
<body>
<div class="card">
  <h2>🔐 SE Ranking MCP</h2>
  <p>Enter your access token to connect:</p>
  <form method="POST" action="/api/authorize">
    <input type="hidden" name="redirect_uri" value="${redirect_uri || ''}" />
    <input type="hidden" name="state" value="${state || ''}" />
    <input type="hidden" name="code_challenge" value="${code_challenge || ''}" />
    <input type="hidden" name="code_challenge_method" value="${code_challenge_method || ''}" />
    <input type="password" name="token" placeholder="Access Token" required />
    <button type="submit">Authorize</button>
  </form>
</div>
</body></html>`;
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
  }

  if (req.method === 'POST') {
    // Parse form body
    const body = req.body;
    const token = body?.token;
    const redir = body?.redirect_uri;
    const st = body?.state;

    if (!token || token !== AUTH_SECRET) {
      const html = `<!DOCTYPE html>
<html><head><title>SE Ranking MCP - Error</title>
<style>
  body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f5f5f5; }
  .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); max-width: 400px; }
  .error { color: #dc2626; }
</style></head>
<body><div class="card"><h2 class="error">❌ Invalid token</h2><p><a href="javascript:history.back()">Try again</a></p></div></body></html>`;
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(html);
    }

    // Generate a simple auth code (the token itself, encrypted-ish)
    const code = Buffer.from(AUTH_SECRET).toString('base64url');
    const redirectUrl = new URL(redir as string);
    redirectUrl.searchParams.set('code', code);
    if (st) redirectUrl.searchParams.set('state', st as string);

    return res.redirect(302, redirectUrl.toString());
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
