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
  }
  next();
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✅ Connected to MongoDB Atlas');
}).catch((error) => {
  console.error('❌ MongoDB connection error:', error);
});

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  studentId: String,
  rollNumber: String,
  rollNo: String,
  department: String,
  semester: Number,
  section: String,
  mobile: String,
  role: { type: String, enum: ['admin', 'student'], default: 'student' },
  profile: {
    avatar: String,
    bio: String,
    interests: [String]
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Elective Schema
const electiveSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  semester: { type: Number, required: true },
  track: String,
  department: String,
  semester: Number,
  credits: Number,
  description: String,
  instructor: String,
  maxStudents: Number,
  enrolledStudents: { type: Number, default: 0 },
  image: String,
  selectionDeadline: Date,
  deadline: Date,
  category: String,
  electiveCategory: String,
  prerequisites: [String],
  futureOptions: [String],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Student Elective Schema
const studentElectiveSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  electiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Elective', required: true },
  semester: Number,
  track: String,
  enrollmentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['enrolled', 'completed', 'dropped'], default: 'enrolled' },
  grade: String,
  completedAt: Date,
  feedback: {
    rating: Number,
    comment: String,
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
    recommendation: Boolean
  }
});

// Elective Feedback Schema
const electiveFeedbackSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  electiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Elective', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: String,
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  recommendation: { type: Boolean, required: true },
  semester: Number,
  createdAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Elective = mongoose.model('Elective', electiveSchema);
const StudentElective = mongoose.model('StudentElective', studentElectiveSchema);
const ElectiveFeedback = mongoose.model('ElectiveFeedback', electiveFeedbackSchema);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      console.log('JWT verification error:', err);
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Student middleware
const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }
  next();
};

// ===================== ROUTES =====================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', timestamp: new Date().toISOString() });
});

// ===================== AUTH ROUTES =====================

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt for:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    console.log('✅ Login successful for:', email);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        rollNumber: user.rollNumber || user.rollNo,
        section: user.section
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, rollNumber, department, semester, section, role } = req.body;
    console.log('📝 Registration attempt for:', email);

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      rollNumber,
      rollNo: rollNumber,
      department,
      semester: semester ? parseInt(semester) : undefined,
      section,
      role: role || 'student'
    });

    await user.save();
    console.log('✅ User registered:', email);

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        name: user.name 
      },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        rollNumber: user.rollNumber,
        section: user.section
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        rollNumber: user.rollNumber || user.rollNo,
        section: user.section,
        mobile: user.mobile,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('❌ Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile', details: error.message });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email, department, semester, section, mobile, profile } = req.body;
    console.log('📝 Profile update for user:', req.user.id);

    const updateData = {
      updatedAt: new Date()
    };

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (department) updateData.department = department;
    if (semester) updateData.semester = parseInt(semester);
    if (section) updateData.section = section;
    if (mobile) updateData.mobile = mobile;
    if (profile) updateData.profile = profile;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('✅ Profile updated for:', user.email);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        rollNumber: user.rollNumber || user.rollNo,
        section: user.section,
        mobile: user.mobile,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile', details: error.message });
  }
});

// ===================== USER ROUTES =====================

// Get all users (Admin only)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('❌ Users fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch users', details: error.message });
  }
});

// ===================== ELECTIVE ROUTES =====================

// Get all electives
app.get('/api/electives', async (req, res) => {
  try {
    console.log('📚 Fetching electives...');
    const electives = await Elective.find({ isActive: true })
      .populate('createdBy', 'name email')
      .sort({ semester: 1, name: 1 });
    
    console.log(`✅ Found ${electives.length} electives`);
    
    res.json({
      success: true,
      count: electives.length,
      electives
    });
  } catch (error) {
    console.error('❌ Electives fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch electives', details: error.message });
  }
});

// Create new elective (Admin only)
app.post('/api/electives', authenticateToken, requireAdmin, async (req, res) => {
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
      futureOptions,
      instructor,
      maxStudents
    } = req.body;

    // Check if elective with same code exists
    const existingElective = await Elective.findOne({ code });
    if (existingElective) {
      return res.status(400).json({ error: 'Elective with this code already exists' });
    }

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
      instructor,
      maxStudents: maxStudents ? parseInt(maxStudents) : undefined,
      selectionDeadline: selectionDeadline ? new Date(selectionDeadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      prerequisites: prerequisites || [],
      futureOptions: futureOptions || [],
      isActive: true,
      createdBy: req.user.id,
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
app.put('/api/electives/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('📝 Updating elective:', req.params.id);
    
    const updateData = {
      ...req.body,
      updatedAt: new Date()
    };

    if (updateData.semester) updateData.semester = parseInt(updateData.semester);
    if (updateData.credits) updateData.credits = parseInt(updateData.credits);
    if (updateData.maxStudents) updateData.maxStudents = parseInt(updateData.maxStudents);

    const elective = await Elective.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!elective) {
      return res.status(404).json({ error: 'Elective not found' });
    }

    console.log('✅ Elective updated:', elective._id);

    res.json({
      success: true,
      message: 'Elective updated successfully',
      elective
    });
  } catch (error) {
    console.error('❌ Error updating elective:', error);
    res.status(500).json({ error: 'Failed to update elective', details: error.message });
  }
});

// Delete elective (Admin only)
app.delete('/api/electives/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🗑️ Deleting elective:', req.params.id);
    
    const elective = await Elective.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedAt: new Date() },
      { new: true }
    );

    if (!elective) {
      return res.status(404).json({ error: 'Elective not found' });
    }

    console.log('✅ Elective deleted (deactivated):', elective._id);

    res.json({
      success: true,
      message: 'Elective deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting elective:', error);
    res.status(500).json({ error: 'Failed to delete elective', details: error.message });
  }
});

// ===================== STUDENT ELECTIVE ROUTES =====================

// Get student's electives
app.get('/api/student-electives/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Check if user can access this data
    if (req.user.role !== 'admin' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const studentElectives = await StudentElective.find({ studentId })
      .populate('electiveId')
      .sort({ enrollmentDate: -1 });

    res.json({
      success: true,
      count: studentElectives.length,
      studentElectives
    });
  } catch (error) {
    console.error('❌ Error fetching student electives:', error);
    res.status(500).json({ error: 'Failed to fetch student electives', details: error.message });
  }
});

// Enroll in elective (Student only)
app.post('/api/student-electives', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { electiveId, semester } = req.body;
    const studentId = req.user.id;

    console.log('📝 Student enrollment:', { studentId, electiveId });

    // Check if already enrolled
    const existingEnrollment = await StudentElective.findOne({ studentId, electiveId });
    if (existingEnrollment) {
      return res.status(400).json({ error: 'Already enrolled in this elective' });
    }

    // Check elective exists and is active
    const elective = await Elective.findById(electiveId);
    if (!elective || !elective.isActive) {
      return res.status(404).json({ error: 'Elective not found or inactive' });
    }

    // Check enrollment limit
    if (elective.maxStudents && elective.enrolledStudents >= elective.maxStudents) {
      return res.status(400).json({ error: 'Elective is full' });
    }

    // Create enrollment
    const studentElective = new StudentElective({
      studentId,
      electiveId,
      semester: semester || elective.semester,
      track: elective.track,
      enrollmentDate: new Date(),
      status: 'enrolled'
    });

    await studentElective.save();

    // Update enrolled count
    await Elective.findByIdAndUpdate(electiveId, {
      $inc: { enrolledStudents: 1 }
    });

    console.log('✅ Student enrolled successfully');

    res.status(201).json({
      success: true,
      message: 'Enrolled successfully',
      studentElective
    });
  } catch (error) {
    console.error('❌ Error enrolling student:', error);
    res.status(500).json({ error: 'Failed to enroll', details: error.message });
  }
});

// Drop elective (Student only)
app.delete('/api/student-electives/:id', authenticateToken, requireStudent, async (req, res) => {
  try {
    const studentElective = await StudentElective.findById(req.params.id);
    
    if (!studentElective) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    if (studentElective.studentId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await StudentElective.findByIdAndDelete(req.params.id);

    // Update enrolled count
    await Elective.findByIdAndUpdate(studentElective.electiveId, {
      $inc: { enrolledStudents: -1 }
    });

    console.log('✅ Student dropped elective');

    res.json({
      success: true,
      message: 'Dropped successfully'
    });
  } catch (error) {
    console.error('❌ Error dropping elective:', error);
    res.status(500).json({ error: 'Failed to drop elective', details: error.message });
  }
});

// ===================== FEEDBACK ROUTES =====================

// Submit feedback
app.post('/api/elective-feedback', authenticateToken, requireStudent, async (req, res) => {
  try {
    const { electiveId, rating, comment, difficulty, recommendation } = req.body;
    const studentId = req.user.id;

    // Check if student is enrolled in this elective
    const enrollment = await StudentElective.findOne({ studentId, electiveId });
    if (!enrollment) {
      return res.status(400).json({ error: 'Must be enrolled to give feedback' });
    }

    // Check if feedback already exists
    const existingFeedback = await ElectiveFeedback.findOne({ studentId, electiveId });
    if (existingFeedback) {
      return res.status(400).json({ error: 'Feedback already submitted' });
    }

    const feedback = new ElectiveFeedback({
      studentId,
      electiveId,
      rating: parseInt(rating),
      comment,
      difficulty,
      recommendation: Boolean(recommendation),
      semester: enrollment.semester
    });

    await feedback.save();

    // Update student elective with feedback
    await StudentElective.findByIdAndUpdate(enrollment._id, {
      feedback: {
        rating: parseInt(rating),
        comment,
        difficulty,
        recommendation: Boolean(recommendation)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('❌ Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback', details: error.message });
  }
});

// Get feedback for elective
app.get('/api/elective-feedback/:electiveId', async (req, res) => {
  try {
    const feedback = await ElectiveFeedback.find({ electiveId: req.params.electiveId })
      .populate('studentId', 'name department')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: feedback.length,
      feedback
    });
  } catch (error) {
    console.error('❌ Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback', details: error.message });
  }
});

// ===================== ANALYTICS ROUTES =====================

// Get admin dashboard analytics
app.get('/api/analytics/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalElectives = await Elective.countDocuments({ isActive: true });
    const totalEnrollments = await StudentElective.countDocuments();
    const totalFeedback = await ElectiveFeedback.countDocuments();

    const departmentStats = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const electiveStats = await Elective.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$electiveCategory', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      analytics: {
        totalUsers,
        totalStudents,
        totalElectives,
        totalEnrollments,
        totalFeedback,
        departmentStats,
        electiveStats
      }
    });
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics', details: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Authentication server running on port ${PORT}`);
});

module.exports = app;
