const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', true);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {trustProxy: false}
});

app.use('/api/', limiter);

app.post('/api/proxy', async (req, res) => {
  try {
    console.log('Proxy request received:', JSON.stringify(req.body, null, 2));
    const { url, method = 'POST', body, headers = {} } = req.body;
    
    if (!url) {
      console.log('Error: URL is required');
      return res.status(400).json({ error: 'URL is required' });
    }

    const allowedDomains = ['now.gg', 'api.now.gg'];
    const urlObj = new URL(url);
    if (!allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
      console.log('Error: Domain not allowed:', urlObj.hostname);
      return res.status(403).json({ error: 'Domain not allowed' });
    }
    
    console.log('Proxying request to:', url);

    const proxyHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    };

    delete proxyHeaders['host'];
    delete proxyHeaders['origin'];

    const response = await fetch(url, {
      method: method,
      headers: proxyHeaders,
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.text();
    console.log('Response status:', response.status);
    console.log('Response data (first 200 chars):', data.substring(0, 200));
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      jsonData = { rawResponse: data };
    }

    res.status(response.status).json(jsonData);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Proxy request failed',
      message: error.message 
    });
  }
});

app.use(express.static(path.join(__dirname), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (filePath.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on port ${PORT}`);
  console.log(`Health check: http://0.0.0.0:${PORT}/health`);
  console.log(`Proxy endpoint: http://0.0.0.0:${PORT}/api/proxy`);
});
