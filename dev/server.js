// dev/server.js - simple Express mock for /api/v2/properties
const express = require('express');
const app = express();
const port = process.env.PORT || 8004;

// Simple request logger to aid debugging (prints method, url, origin and auth header preview)
app.use((req, res, next) => {
  try{
    const origin = req.get('origin') || '-';
    const auth = req.get('authorization') || req.get('x-api-key') || '-';
    console.log(`[DEV API] ${new Date().toISOString()} ${req.method} ${req.url} Origin:${origin} Auth:${auth}`);
  }catch(e){ /* swallow */ }
  next();
});

// CORS middleware: allow requests from the requesting origin and support credentials
app.use((req, res, next) => {
  const origin = req.get('origin');
  if(origin){
    // Allow the specific origin (required when credentials are used)
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-API-KEY');
  }
  // Handle preflight
  if(req.method === 'OPTIONS'){
    return res.status(204).end();
  }
  next();
});

// Sample data (matches the "real" JSON schema discussed)
const PROPERTIES = [
  {
    key: 'nexefiiSaoPaulo',
    id: 'nexefiiSaoPaulo',
    slug: 'nexefiiSaoPaulo',
    name: { pt: 'Nexefii São Paulo', en: 'Nexefii São Paulo', es: 'Nexefii São Paulo' },
    title: 'Nexefii São Paulo',
    location: { city: 'São Paulo', country: 'BR', timezone: 'America/Sao_Paulo' },
    modules: ['engineering','housekeeping','alerts'],
    active: true
  },
  {
    key: 'nexefiiMiami',
    id: 'nexefiiMiami',
    slug: 'nexefiiMiami',
    name: { pt: 'Nexefii Miami', en: 'Nexefii Miami', es: 'Nexefii Miami' },
    title: 'Nexefii Miami',
    location: { city: 'Miami', country: 'US', timezone: 'America/New_York' },
    modules: ['engineering','alerts'],
    active: true
  }
];

// Simple token values for optional validation
const DEV_BEARER_TOKEN = process.env.DEV_BEARER_TOKEN || 'dev-token';
const DEV_API_KEY = process.env.DEV_API_KEY || 'dev-key';

app.get('/api/v2/properties', (req, res) => {
  // Simulate 401 if env var SIMULATE_401 is set to '1'
  if(process.env.SIMULATE_401 === '1'){
    return res.status(401).json({ error: 'unauthorized', message: 'Simulated 401 by dev server' });
  }

  // Optional token validation when VALIDATE_TOKEN=1
  if(process.env.VALIDATE_TOKEN === '1'){
    const auth = req.get('authorization') || req.get('x-api-key') || '';
    if(!auth){
      return res.status(401).json({ error: 'missing_token' });
    }
    // Normalize checks
    if(auth.toLowerCase().startsWith('bearer ')){
      const token = auth.slice(7).trim();
      if(token !== DEV_BEARER_TOKEN) return res.status(401).json({ error: 'invalid_token' });
    } else {
      // assume x-api-key header value
      const token = auth.trim();
      if(token !== DEV_API_KEY) return res.status(401).json({ error: 'invalid_token' });
    }
  }

  // Return array of properties
  res.json(PROPERTIES);
});

app.listen(port, () => {
  console.log(`Dev API mock running: http://localhost:${port}/api/v2/properties`);
  if(process.env.SIMULATE_401 === '1') console.log('SIMULATE_401=1 active — all requests will receive 401');
  if(process.env.VALIDATE_TOKEN === '1') console.log('VALIDATE_TOKEN=1 active — requests must present valid token');
});
