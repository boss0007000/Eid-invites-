const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { URL } = require('node:url');
const { appendRsvp, normalizeRsvp } = require('./rsvpStore');

const HOST = '0.0.0.0';
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIRECTORY = path.join(__dirname, 'public');
const BODY_LIMIT = 1_000_000;
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

async function serveStaticFile(urlPath, response) {
  const requestPath = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = path.resolve(PUBLIC_DIRECTORY, `.${requestPath}`);
  const relativePath = path.relative(PUBLIC_DIRECTORY, filePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    response.writeHead(404);
    response.end('Not found');
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const extension = path.extname(filePath);

    response.writeHead(200, {
      'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
    });
    response.end(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      response.writeHead(404);
      response.end('Not found');
      return;
    }

    response.writeHead(500);
    response.end('Something went wrong');
  }
}

function collectRequestBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        reject(new Error('Request body is too large.'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });

    request.on('end', () => {
      try {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve(body ? JSON.parse(body) : {});
      } catch {
        reject(new Error('Please submit a valid RSVP.'));
      }
    });

    request.on('error', () => {
      reject(new Error('Unable to read the request.'));
    });
  });
}

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

  if (request.method === 'POST' && requestUrl.pathname === '/api/rsvp') {
    try {
      const payload = await collectRequestBody(request);
      const rsvp = normalizeRsvp(payload);
      await appendRsvp(rsvp);
      sendJson(response, 201, { message: 'RSVP saved successfully.' });
    } catch (error) {
      sendJson(response, 400, { message: error.message || 'Unable to save RSVP.' });
    }
    return;
  }

  if (request.method === 'GET') {
    await serveStaticFile(requestUrl.pathname, response);
    return;
  }

  response.writeHead(405, {
    Allow: 'GET, POST',
  });
  response.end('Method not allowed');
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`Eid invitation running at http://${HOST}:${PORT}`);
  });
}

module.exports = { server };
