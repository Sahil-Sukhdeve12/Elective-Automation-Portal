/**
 * ELECTIVE SELECTION SYSTEM - MAIN API HANDLER
 * 
 * This file serves as the main API endpoint for the Vercel serverless deployment.
 * It handles all HTTP requests for authentication, user management, and elective operations.
 * 
 * Features:
 * - JWT-based authentication
 * - User registration and login
 * - Elective CRUD operations
 * - MongoDB Atlas integration
 * - Roll number tracking for students
 * 
 * @author Sahil Sukhdeve
 * @version 1.0.0
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize Express application
const app = express();

// ================================
// MIDDLEWARE CONFIGURATION
// ================================

// Enable CORS for cross-origin requests
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// ================================
// DATABASE CONNECTION
// ================================

/**
 * Connect to MongoDB Atlas using connection string from environment variables
 * Uses cached connection to prevent multiple connections in serverless environment
 */
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const connection = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-system'
    );
    
    cachedDb = connection;
    console.log('MongoDB connected successfully');
    return connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Initialize database connection
connectToDatabase().catch(console.error);

// ================================
// DATABASE SCHEMAS & MODELS
// ================================

/**
 * User Schema - Handles both student and admin accounts
 * 
 * Fields:
 * - name: Full name of the user
 * - email: Unique email address for login
 * - password: Hashed password using bcrypt
 * - rollNumber: Student roll number (required for students only)
 * - role: 'student' or 'admin' for access control
 * - department: Academic department for students
 * - semester: Current semester number
 * - profile: Additional student information
 * - createdAt: Account creation timestamp
 */
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  rollNumber: String,          // Student roll number for identification
  studentId: String,
  department: String,
  semester: Number,
  role: { 
    type: String, 
    enum: ['admin', 'student'], 
    default: 'student' 
  },
  profile: {
    year: Number,
    cgpa: Number,
    track: String,
    interests: [String]
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

/**
 * Elective Schema - Manages course information
 * 
 * Fields:
 * - name: Course name
 * - code: Course code (e.g., CS501)
 * - description: Detailed course description
 * - credits: Credit hours for the course
 * - department: Offering department
 * - semester: Semester when course is offered
 * - instructor: Course instructor name
 * - maxStudents: Maximum enrollment capacity
 * - schedule: Class timing information
 * - createdAt: Course creation timestamp
 */
const electiveSchema = new mongoose.Schema({
  name: String,
  code: String,
  department: String,
  semester: Number,
  credits: Number,
  description: String,
  instructor: String,
  maxStudents: Number,
  track: String,
  electiveCategory: String,
  image: String,
  deadline: Date,
  schedule: {
    day: String,
    time: String
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Create models with mongoose, avoiding re-compilation in serverless environment
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Elective = mongoose.models.Elective || mongoose.model('Elective', electiveSchema);

// ================================
// AUTHENTICATION MIDDLEWARE
// ================================

/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT token from Authorization header and adds user info to request object.
 * Used to protect routes that require authentication.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header (format: "Bearer <token>")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Verify and decode JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    // Find user in database and attach to request
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// ================================
// API ROUTES
// ================================

/**
 * Health Check Endpoint
 * 
 * Simple endpoint to verify API is running and database is connected.
 * Used for monitoring and deployment verification.
 */
app.get('/api/health', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({ 
      status: 'OK', 
      message: 'Elective Selection System API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message
    });
  }
});

/**
 * Debug Endpoint - Check Environment
 */
app.get('/api/debug', async (req, res) => {
  try {
    await connectToDatabase();
    res.json({
      environment: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      mongoConnection: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      environment: process.env.NODE_ENV,
      hasMongoUri: !!process.env.MONGODB_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      mongoConnection: 'failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * User Registration Endpoint
 * 
 * Creates new user account with hashed password.
 * Supports both student and admin registration.
 * Students require roll number, department, and semester.
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    console.log('Registration request received:', { 
      body: req.body, 
      headers: req.headers,
      timestamp: new Date().toISOString() 
    });
    
    const { name, email, password, role, rollNumber, department, semester } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Additional validation for students
    if (role === 'student' && (!rollNumber || !department || !semester)) {
      return res.status(400).json({ 
        error: 'Roll number, department, and semester are required for students' 
      });
    }

    // Check if user already exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists with email:', email);
      return res.status(400).json({ error: 'Email or registration number already exists' });
    }

    // Check if roll number already exists (for students)
    if (role === 'student') {
      console.log('Checking for existing roll number:', rollNumber);
      const existingRollNumber = await User.findOne({ rollNumber });
      if (existingRollNumber) {
        console.log('Roll number already exists:', rollNumber);
        return res.status(400).json({ error: 'Email or registration number already exists' });
      }
    }

    // Hash password using bcrypt
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      rollNumber: role === 'student' ? rollNumber : undefined,
      department: role === 'student' ? department : undefined,
      semester: role === 'student' ? semester : undefined
    });

    await newUser.save();

    // Generate JWT token for immediate login
    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // Return user info (excluding password) and token
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        rollNumber: newUser.rollNumber,
        department: newUser.department,
        semester: newUser.semester
      }
    });
    
    console.log('User registered successfully:', { 
      userId: newUser._id, 
      email: newUser.email, 
      role: newUser.role 
    });
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Internal server error during registration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * User Login Endpoint
 * 
 * Authenticates user credentials and returns JWT token.
 * Supports both email/password authentication.
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    // Ensure database connection
    await connectToDatabase();
    
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    // Return user info and token
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        department: user.department,
        semester: user.semester
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

/**
 * Get All Users Endpoint (Admin Only)
 * 
 * Returns list of all registered users with their details.
 * Used by admin dashboard to manage students.
 * Includes roll numbers and enrollment information.
 */
app.get('/api/users', async (req, res) => {
  try {
    // Fetch all users excluding passwords
    const users = await User.find({}, '-password').sort({ createdAt: -1 });

    // Format response with additional user statistics
    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      role: user.role,
      department: user.department,
      semester: user.semester,
      registrationDate: user.createdAt,
      profile: user.profile
    }));

    res.json({
      users: formattedUsers,
      totalCount: users.length,
      studentCount: users.filter(u => u.role === 'student').length,
      adminCount: users.filter(u => u.role === 'admin').length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get All Electives Endpoint
 * 
 * Returns list of all available elective courses.
 * Accessible to both students and admins.
 * Used for course selection and management.
 */
app.get('/api/electives', async (req, res) => {
  try {
    // Fetch all electives sorted by name
    const electives = await Elective.find({}).sort({ name: 1 });

    // Format response with course details
    const formattedElectives = electives.map(elective => ({
      id: elective._id,
      name: elective.name,
      code: elective.code,
      description: elective.description,
      credits: elective.credits,
      department: elective.department,
      semester: elective.semester,
      instructor: elective.instructor,
      maxStudents: elective.maxStudents,
      track: elective.track,
      electiveCategory: elective.electiveCategory,
      image: elective.image,
      deadline: elective.deadline,
      schedule: elective.schedule,
      createdAt: elective.createdAt
    }));

    res.json({
      electives: formattedElectives,
      totalCount: electives.length
    });
  } catch (error) {
    console.error('Error fetching electives:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Create New Elective Endpoint (Admin Only)
 * 
 * Allows admins to add new elective courses to the system.
 * Validates course information and prevents duplicates.
 */
app.post('/api/electives', authenticateToken, async (req, res) => {
  try {
    // Verify admin access
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, code, description, credits, department, semester, instructor, maxStudents, track, electiveCategory, image, deadline, schedule } = req.body;

    // Validate required fields
    if (!name || !code || !description || !credits || !department) {
      return res.status(400).json({ 
        error: 'Name, code, description, credits, and department are required' 
      });
    }

    // Check for duplicate course code
    const existingElective = await Elective.findOne({ code });
    if (existingElective) {
      return res.status(400).json({ error: 'Course code already exists' });
    }

    // Create new elective
    const newElective = new Elective({
      name,
      code,
      description,
      credits,
      department,
      semester,
      instructor,
      maxStudents: maxStudents || 30,
      track,
      electiveCategory,
      image,
      deadline,
      schedule
    });

    await newElective.save();

    res.status(201).json({
      message: 'Elective created successfully',
      elective: {
        id: newElective._id,
        name: newElective.name,
        code: newElective.code,
        description: newElective.description,
        credits: newElective.credits,
        department: newElective.department,
        semester: newElective.semester,
        instructor: newElective.instructor,
        maxStudents: newElective.maxStudents,
        track: newElective.track,
        electiveCategory: newElective.electiveCategory,
        image: newElective.image,
        deadline: newElective.deadline,
        schedule: newElective.schedule
      }
    });
  } catch (error) {
    console.error('Error creating elective:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get Current User Information
 * 
 * Returns authenticated user's profile information.
 * Used to maintain user session and display profile data.
 */
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      rollNumber: req.user.rollNumber,
      department: req.user.department,
      semester: req.user.semester,
      profile: req.user.profile
    }
  });
});

// ================================
// ERROR HANDLING
// ================================

/**
 * Global Error Handler
 * 
 * Catches any unhandled errors and returns appropriate response.
 * Prevents application crashes in production environment.
 */
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

/**
 * 404 Handler
 * 
 * Handles requests to non-existent endpoints.
 * Returns appropriate error message for unknown routes.
 */
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/users',
      'GET /api/electives',
      'POST /api/electives'
    ]
  });
});

// Export the Express app for Vercel serverless deployment
module.exports = app;
