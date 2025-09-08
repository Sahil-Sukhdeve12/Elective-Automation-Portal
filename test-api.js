import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email === 'test@test.com' && password === 'test123') {
    res.json({ 
      message: 'Login successful',
      token: 'test-token',
      user: { id: 1, email, role: 'student' }
    });
  } else {
    res.status(400).json({ message: 'Invalid email or password' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  res.status(201).json({ 
    message: 'User registered successfully',
    token: 'test-token',
    user: { id: 1, name, email, role: 'student' }
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
});
