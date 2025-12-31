const https = require('https');

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  return new Promise((resolve) => {
    try {
      const apiKey = process.env.GROQ_API_KEY;
      
      if (!apiKey) {
        resolve({
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'API key not configured' })
        });
        return;
      }

      const requestBody = JSON.parse(event.body);
      const { messages, model } = requestBody;

      const postData = JSON.stringify({
        model: model || 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.3,
        max_tokens: 300
      });

      const options = {
        hostname: 'api.groq.com',
        port: 443,
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers,
            body: data
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: error.message })
        });
      });

      req.write(postData);
      req.end();

    } catch (error) {
      resolve({
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      });
    }
  });
};
