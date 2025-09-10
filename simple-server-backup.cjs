const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ quiet: true });

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

// Increase payload size limit for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  if (req.headers.authorization) {
    console.log('🔑 Authorization header present');
  } else {
    console.log('❌ No authorization header');
  }
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✅ Connected to MongoDB Atlas');
}).catch((error) => {
  console.error('❌ MongoDB connection error:', error);
});

// User schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  studentId: String,
  department: String,
  semester: Number,
  rollNo: String,
  rollNumber: String,
  mobile: String,
  section: String,
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  profile: {
    year: Number,
    cgpa: Number,
    track: String,
    interests: [String]
  },
  preferences: {
    interests: [String],
    careerGoals: String,
    difficulty: String
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Elective schema
const electiveSchema = new mongoose.Schema({
  name: String,
  code: String,
  department: String,
  semester: Number,
  credits: Number,
  description: String,
  instructor: String,
  maxStudents: Number,
  enrolledStudents: Number,
  image: String,
  deadline: Date,
  category: String,
  electiveCategory: String,
  track: String,
  createdAt: { type: Date, default: Date.now }
});

const Elective = mongoose.model('Elective', electiveSchema);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('👤 Found user:', { email: user.email, role: user.role });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful:', email);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, department, semester } = req.body;

    console.log('📝 Registration attempt:', { 
      email, 
      role, 
      department, 
      semester,
      body: req.body 
    });

    if (!name || !email || !password) {
      console.log('❌ Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (role === 'student' && (!department || !semester)) {
      console.log('❌ Missing student fields:', { 
        department: !!department, 
        semester: !!semester 
      });
      return res.status(400).json({ 
        error: 'Department and semester are required for students' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ error: 'Email already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      department: role === 'student' ? department : undefined,
      semester: role === 'student' ? semester : undefined
    });

    await newUser.save();
    console.log('✅ User created successfully:', { email });

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        semester: newUser.semester
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Profile GET request received');
    console.log('🔧 User from token:', req.user);
    
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      console.log('❌ User not found with ID:', req.user.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Profile fetched for user:', user.email);

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      semester: user.semester,
      rollNo: user.rollNo,
      rollNumber: user.rollNumber,
      mobile: user.mobile,
      section: user.section,
      preferences: user.preferences
    });
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    console.log('🔧 Profile update request received:', req.body);
    console.log('🔧 User from token:', req.user);
    
    const { name, department, semester, rollNo, rollNumber, mobile, section, preferences } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (department !== undefined) updateData.department = department;
    if (semester !== undefined) updateData.semester = semester;
    if (rollNo !== undefined) updateData.rollNo = rollNo;
    if (rollNumber !== undefined) updateData.rollNumber = rollNumber;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (section !== undefined) updateData.section = section;
    if (preferences !== undefined) updateData.preferences = preferences;

    console.log('🔧 Update data:', updateData);

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      console.log('❌ User not found with ID:', req.user.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Profile updated successfully for user:', user.email);

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        rollNo: user.rollNo,
        rollNumber: user.rollNumber,
        mobile: user.mobile,
        section: user.section,
        preferences: user.preferences
      }
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (for debugging)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    console.log('👥 Found users:', users.length);
    res.json({
      success: true,
      count: users.length,
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        department: user.department,
        semester: user.semester,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all electives
app.get('/api/electives', async (req, res) => {
  try {
    const electives = await Elective.find({});
    res.json({
      success: true,
      count: electives.length,
      electives: electives
    });
  } catch (error) {
    console.error('Error fetching electives:', error);
    res.status(500).json({ error: 'Failed to fetch electives' });
  }
});

// Create new elective (Admin only)
app.post('/api/electives', async (req, res) => {
  try {
    console.log('🔥 Creating new elective:', req.body);
    
    const {
      name,
      code,
      semester,
      track,
      description,
      credits,
      department,
      category,
      electiveCategory,
      image,
      selectionDeadline,
      prerequisites,
      futureOptions
    } = req.body;

    // Create new elective
    const newElective = new Elective({
      name,
      code,
      semester: parseInt(semester),
      track,
      description,
      credits: parseInt(credits),
      department,
      category,
      electiveCategory,
      image,
      selectionDeadline: selectionDeadline ? new Date(selectionDeadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      prerequisites: prerequisites || [],
      futureOptions: futureOptions || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedElective = await newElective.save();
    console.log('✅ Elective created successfully:', savedElective._id);
    
    res.status(201).json({
      success: true,
      message: 'Elective created successfully',
      elective: savedElective
    });
  } catch (error) {
    console.error('❌ Error creating elective:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create elective',
      details: error.message 
    });
  }
});

// Update elective (Admin only)
app.put('/api/electives/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔄 Updating elective:', id, req.body);
    
    const updatedElective = await Elective.findByIdAndUpdate(
      id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedElective) {
      return res.status(404).json({ 
        success: false,
        error: 'Elective not found' 
      });
    }

    console.log('✅ Elective updated successfully:', updatedElective._id);
    res.json({
      success: true,
      message: 'Elective updated successfully',
      elective: updatedElective
    });
  } catch (error) {
    console.error('❌ Error updating elective:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update elective',
      details: error.message 
    });
  }
});

// Delete elective (Admin only)
app.delete('/api/electives/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting elective:', id);
    
    const deletedElective = await Elective.findByIdAndDelete(id);

    if (!deletedElective) {
      return res.status(404).json({ 
        success: false,
        error: 'Elective not found' 
      });
    }

    console.log('✅ Elective deleted successfully:', deletedElective._id);
    res.json({
      success: true,
      message: 'Elective deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting elective:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete elective',
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Authentication server running on port ${PORT}`);
});

module.exports = app;
