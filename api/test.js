// Simple test API for Vercel
module.exports = (req, res) => {
  if (req.url === '/api/test') {
    res.status(200).json({
      message: 'Test endpoint working',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};
