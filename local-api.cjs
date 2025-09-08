const express = require('express');
const app = express();

// Import the API handler from the Vercel function
const apiHandler = require('./api/index.js');

// Use the API handler for all routes
app.use('/', apiHandler);

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`);
  console.log(`📡 All /api routes are available`);
});
