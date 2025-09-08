const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'OK', message: 'Test server is running' });
});

const PORT = 5001;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Test server running on http://127.0.0.1:${PORT}`);
}).on('error', (err) => {
  console.error('Server error:', err);
});
