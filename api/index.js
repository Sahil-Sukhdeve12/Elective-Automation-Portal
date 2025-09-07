const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
if (!global.mongoose) {
  global.mongoose = mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-system', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
}

// Simple User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  studentId: String,
  department: String,
  semester: Number,
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  profile: {
    year: Number,
    cgpa: Number,
    track: String,
    interests: [String]
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Simple Elective schema
const electiveSchema = new mongoose.Schema({
  name: String,
  code: String,
  department: String,
  semester: Number,
  credits: Number,
  description: String,
  instructor: String,
  maxStudents: Number,
  schedule: {
    day: String,
    time: String
  },
  electiveCategory: String,
  track: String,
  image: String,
  deadline: Date,
  createdAt: { type: Date, default: Date.now }
});

const Elective = mongoose.models.Elective || mongoose.model('Elective', electiveSchema);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all electives
app.get('/api/electives', async (req, res) => {
  try {
    const electives = await Elective.find({});
    res.json(electives);
  } catch (error) {
    console.error('Error fetching electives:', error);
    res.status(500).json({ error: 'Failed to fetch electives' });
  }
});

// Export the Express API
module.exports = app;
