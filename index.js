// hello.js

// server.js

const http = require('http');

// Create server
const server = http.createServer((req, res) => {
  res.statusCode = 200; // OK
  res.setHeader('Content-Type', 'text/html');
  res.end('<h1>Hello, World!</h1>');
});

// Start server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
