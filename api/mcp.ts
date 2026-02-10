import type { VercelRequest, VercelResponse } from '@vercel/node';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SeoApiMcpServer } from '../src/seo-api-mcp-server.js';

const DATA_API_TOKEN = process.env.DATA_API_TOKEN || '';
const PROJECT_API_TOKEN = process.env.PROJECT_API_TOKEN || '';
const AUTH_SECRET = process.env.AUTH_SECRET || '';

function extractTokenFromHeader(authorization?: string) {
  const m = authorization?.match(/^Bearer\s+(.+)$/i);
  return m?.[1]?.trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers für Claude.ai Connector
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Mcp-Session-Id');
  res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Auth check: Bearer token muss mit AUTH_SECRET übereinstimmen
  if (AUTH_SECRET) {
    const bearer = extractTokenFromHeader(req.headers.authorization as string);
    if (bearer !== AUTH_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const server = new McpServer({
    name: 'ser-data-api-mcp-server',
    version: '1.0.0'
  });

  new SeoApiMcpServer(server).init();

  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  let cleaned = false;
  const cleanup = async () => {
    if (cleaned) return;
    cleaned = true;
    try { await transport.close(); } catch {}
    try { await server.close(); } catch {}
  };

  res.on('close', () => void cleanup().catch(console.error));
  res.on('finish', () => void cleanup().catch(console.error));

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('MCP Server Error:', err);
    void cleanup().catch(console.error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
