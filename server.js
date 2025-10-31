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

    const allowedDomains = ['now.gg', 'api.now.gg', 'account.api.now.gg'];
    const urlObj = new URL(url);
    if (!allowedDomains.some(domain => urlObj.hostname.includes(domain))) {
      console.log('Error: Domain not allowed:', urlObj.hostname);
      return res.status(403).json({ error: 'Domain not allowed' });
    }
    
    console.log('Proxying request to:', url);

    const proxyHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...headers
    };

    // Remove headers that should not be forwarded
    delete proxyHeaders['host'];
    delete proxyHeaders['origin'];
    delete proxyHeaders['referer'];

    const fetchOptions = {
      method: method,
      headers: proxyHeaders,
      timeout: 10000 // 10 second timeout
    };

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url, fetchOptions);

    const data = await response.text();
    console.log('Response status:', response.status);
    console.log('Response headers:', JSON.stringify([...response.headers.entries()]));
    console.log('Response data (first 500 chars):', data.substring(0, 500));
    
    let jsonData;
    try {
      jsonData = JSON.parse(data);
    } catch (e) {
      console.log('Failed to parse JSON response:', e.message);
      jsonData = { 
        rawResponse: data,
        parseError: 'Response is not valid JSON'
      };
    }

    // Forward response headers
    const responseHeaders = {};
    response.headers.forEach((value, key) => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        responseHeaders[key] = value;
      }
    });

    res.set(responseHeaders);
    res.status(response.status).json(jsonData);
  } catch (error) {
    console.error('Proxy error:', error);
    
    // More detailed error information
    const errorResponse = {
      error: 'Proxy request failed',
      message: error.message,
      code: error.code || 'UNKNOWN',
      type: error.type || 'unknown'
    };

    // If DNS resolution failed, provide guidance
    if (error.code === 'ENOTFOUND') {
      errorResponse.suggestion = 'The API endpoint could not be found. This may indicate the API is not publicly accessible or requires authentication/IP whitelisting.';
    }

    res.status(500).json(errorResponse);
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
