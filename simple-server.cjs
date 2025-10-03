const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config({ quiet: true });

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));

// Increase payload size limit for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, 'dist')));

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
// Validator function to limit array size
const arrayLimit = (val) => {
  return val.length <= 10;
};

const electiveSchema = new mongoose.Schema({
  name: String,
  code: { 
    type: String, 
    required: false,
    unique: true,
    sparse: true // This allows multiple documents with null/undefined values
  },
  department: String,
  semester: Number,
  credits: Number,
  description: String,
  instructor: String,
  maxStudents: Number, // Legacy field - keeping for backward compatibility
  minEnrollment: Number, // Minimum students required for elective to run
  maxEnrollment: Number, // Maximum students allowed in elective
  enrolledStudents: Number,
  image: String,
  deadline: Date,
  category: { 
    type: [String], 
    default: ['Departmental'],
    validate: [arrayLimit, '{PATH} exceeds the limit of 10 categories']
  },
  electiveCategory: String,
  subjectType: { 
    type: String, 
    enum: ['Theory', 'Practical', 'Theory+Practical'],
    default: 'Theory'
  },
  track: String,
  createdAt: { type: Date, default: Date.now }
});

const Elective = mongoose.model('Elective', electiveSchema);

// Student Elective Selection Schema
const studentElectiveSelectionSchema = new mongoose.Schema({
  studentId: { type: String, required: true, index: true },
  electiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'Elective', required: true },
  semester: { type: Number, required: true },
  category: [String], // The categories this elective belongs to
  status: { type: String, enum: ['selected', 'confirmed', 'dropped'], default: 'selected' },
  selectedAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  droppedAt: Date
}, {
  timestamps: true
});

// Compound index to prevent duplicate selections
studentElectiveSelectionSchema.index({ studentId: 1, electiveId: 1, semester: 1 }, { unique: true });

const StudentElectiveSelection = mongoose.model('StudentElectiveSelection', studentElectiveSelectionSchema);

// Track schema
const trackSchema = new mongoose.Schema({
  name: String,
  department: String,
  category: String,
  credits: Number,
  createdAt: { type: Date, default: Date.now }
});

const Track = mongoose.model('Track', trackSchema);

// Elective Limit Schema
const electiveLimitSchema = new mongoose.Schema({
  department: { type: String, required: true },
  semester: { type: Number, required: true },
  category: { type: String, required: true },
  maxElectives: { type: Number, required: true, default: 1 },
  isActive: { type: Boolean, default: true },
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound index to ensure unique limit per department/semester/category
electiveLimitSchema.index({ department: 1, semester: 1, category: 1 }, { unique: true });

const ElectiveLimit = mongoose.model('ElectiveLimit', electiveLimitSchema);

// System Config schema
const systemConfigSchema = new mongoose.Schema({
  departments: [String],
  semesters: [Number],
  sections: [String],
  electiveCategories: [String],
  updatedAt: { type: Date, default: Date.now }
});

const SystemConfig = mongoose.model('SystemConfig', systemConfigSchema);

// Syllabus schema
const syllabusSchema = new mongoose.Schema({
  electiveId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: String,
  pdfData: { type: String, required: true }, // Base64 encoded PDF
  pdfFileName: { type: String, required: true },
  uploadedBy: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  academicYear: String,
  semester: Number,
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Index for quick lookup
syllabusSchema.index({ electiveId: 1, isActive: 1 });

const Syllabus = mongoose.model('Syllabus', syllabusSchema);

// Password Reset Token Schema
const passwordResetTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Auto-delete expired tokens after 24 hours
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 86400 });

const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);

// Email Configuration
const createEmailTransporter = () => {
  // Check if email is configured
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.warn('⚠️ Email not configured. Email notifications will be disabled.');
    return null;
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
};

const emailTransporter = createEmailTransporter();

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
        semester: user.semester,
        section: user.section,
        mobile: user.mobile,
        rollNo: user.rollNo,
        rollNumber: user.rollNumber || user.rollNo
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
    const { name, email, password, role, department, semester, registrationNumber, mobile, section } = req.body;

    console.log('📝 Registration attempt:', { 
      email, 
      role, 
      department, 
      semester,
      registrationNumber,
      mobile,
      section,
      body: req.body 
    });

    if (!name || !email || !password) {
      console.log('❌ Missing required fields:', { name: !!name, email: !!email, password: !!password });
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (role === 'student' && (!department || !semester || !registrationNumber)) {
      console.log('❌ Missing student fields:', { 
        department: !!department, 
        semester: !!semester,
        registrationNumber: !!registrationNumber
      });
      return res.status(400).json({ 
        error: 'Department, semester, and class roll number are required for students' 
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Check if class roll number already exists for students
    if (role === 'student' && registrationNumber) {
      const existingRegNumber = await User.findOne({ rollNumber: registrationNumber });
      if (existingRegNumber) {
        console.log('❌ Class roll number already exists:', registrationNumber);
        return res.status(400).json({ error: 'Class roll number already exists' });
      }
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      department: role === 'student' ? department : undefined,
      semester: role === 'student' ? semester : undefined,
      rollNumber: role === 'student' ? registrationNumber : undefined,
      mobile: role === 'student' ? mobile : undefined,
      section: role === 'student' ? section : undefined
    });

    await newUser.save();
    console.log('✅ User created successfully:', { email, registrationNumber });

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
        semester: newUser.semester,
        rollNumber: newUser.rollNumber,
        mobile: newUser.mobile,
        section: newUser.section
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// Forgot Password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Don't reveal whether user exists for security
      return res.status(200).json({ 
        success: true, 
        message: `If an account with ${email} exists, a password reset link has been sent.` 
      });
    }

    // Generate crypto-secure random token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token expiration (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Delete any existing tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Create new reset token
    await PasswordResetToken.create({
      userId: user._id,
      token: hashedToken,
      expiresAt,
      used: false
    });

    // Send email if transporter is configured
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    
    if (emailTransporter) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Password Reset Request - Elective Selection System',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .button { display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              .warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔐 Password Reset Request</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${user.name}</strong>,</p>
                
                <p>We received a request to reset your password for your Elective Selection System account.</p>
                
                <p>Click the button below to reset your password:</p>
                
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="background-color: #e5e7eb; padding: 10px; word-break: break-all; font-size: 12px;">
                  ${resetUrl}
                </p>
                
                <div class="warning">
                  <strong>⏰ Important:</strong> This link will expire in <strong>30 minutes</strong> for security reasons.
                </div>
                
                <p><strong>Didn't request this?</strong></p>
                <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
                
                <p>For security reasons:</p>
                <ul>
                  <li>Never share this link with anyone</li>
                  <li>This link can only be used once</li>
                  <li>We will never ask for your password via email</li>
                </ul>
              </div>
              <div class="footer">
                <p>This is an automated email from Elective Selection System</p>
                <p>© ${new Date().getFullYear()} Elective Selection System. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      try {
        await emailTransporter.sendMail(mailOptions);
        console.log('✅ Password reset email sent to:', email);
      } catch (emailError) {
        console.error('❌ Failed to send reset email:', emailError);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send reset email. Please try again later.' 
        });
      }
    } else {
      // Email not configured - log token to console for manual password reset
      console.log('\n' + '='.repeat(80));
      console.log('📧 EMAIL NOT CONFIGURED - MANUAL PASSWORD RESET REQUIRED');
      console.log('='.repeat(80));
      console.log(`User: ${user.name} (${email})`);
      console.log(`Reset URL: ${resetUrl}`);
      console.log(`\n⚠️  Copy the URL above and send it to the user manually`);
      console.log(`⏰  Link expires in 30 minutes\n`);
      console.log('='.repeat(80) + '\n');
    }

    res.status(200).json({ 
      success: true, 
      message: `Password reset instructions have been sent to ${email}` 
    });

  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again later.' 
    });
  }
});

// Reset Password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Hash the token to match stored hash
    const crypto = require('crypto');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find valid token
    const resetToken = await PasswordResetToken.findOne({
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token. Please request a new password reset.' 
      });
    }

    // Find user
    const user = await User.findById(resetToken.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Mark token as used
    resetToken.used = true;
    await resetToken.save();

    // Delete all reset tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id });

    console.log('✅ Password reset successful for user:', user.email);

    // Send confirmation email
    if (emailTransporter) {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: 'Password Changed Successfully - Elective Selection System',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
              .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
              .alert { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>✅ Password Changed Successfully</h1>
              </div>
              <div class="content">
                <p>Hello <strong>${user.name}</strong>,</p>
                
                <p>Your password has been successfully changed for your Elective Selection System account.</p>
                
                <p><strong>Account Details:</strong></p>
                <ul>
                  <li>Email: ${user.email}</li>
                  <li>Changed at: ${new Date().toLocaleString()}</li>
                </ul>
                
                <div class="alert">
                  <strong>⚠️ Didn't make this change?</strong><br>
                  If you didn't change your password, please contact your administrator immediately as your account may be compromised.
                </div>
                
                <p>You can now log in with your new password.</p>
              </div>
              <div class="footer">
                <p>This is an automated email from Elective Selection System</p>
                <p>© ${new Date().getFullYear()} Elective Selection System. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      };

      try {
        await emailTransporter.sendMail(mailOptions);
        console.log('✅ Password change confirmation email sent to:', user.email);
      } catch (emailError) {
        console.error('❌ Failed to send confirmation email:', emailError);
        // Don't fail the request if confirmation email fails
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now log in with your new password.' 
    });

  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred. Please try again later.' 
    });
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

// Get current authenticated user (for token verification)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        semester: user.semester,
        section: user.section,
        mobile: user.mobile,
        rollNo: user.rollNo,
        rollNumber: user.rollNumber || user.rollNo
      }
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

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
    
    const { 
      name, 
      department, 
      semester, 
      rollNo, 
      rollNumber, 
      mobile, 
      section, 
      preferences,
      profile 
    } = req.body;
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (department !== undefined) updateData.department = department;
    if (semester !== undefined) updateData.semester = semester;
    if (rollNo !== undefined) updateData.rollNo = rollNo;
    if (rollNumber !== undefined) updateData.rollNumber = rollNumber;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (section !== undefined) updateData.section = section;
    if (preferences !== undefined) updateData.preferences = preferences;
    
    // Handle nested profile fields
    if (profile !== undefined) {
      if (!updateData.profile) updateData.profile = {};
      if (profile.year !== undefined) updateData['profile.year'] = profile.year;
      if (profile.cgpa !== undefined) updateData['profile.cgpa'] = profile.cgpa;
      if (profile.track !== undefined) updateData['profile.track'] = profile.track;
      if (profile.interests !== undefined) updateData['profile.interests'] = profile.interests;
    }

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
        preferences: user.preferences,
        profile: user.profile
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

// Delete user (Admin only)
app.delete('/api/auth/users/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin role required.' });
    }

    const { id } = req.params;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Also delete related student electives if user was a student
    if (deletedUser.role === 'student') {
      await StudentElective.deleteMany({ studentId: id });
    }

    console.log('✅ User deleted successfully:', deletedUser._id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete user error:', error);
    res.status(500).json({
      error: 'Failed to delete user',
      details: error.message
    });
  }
});

// Get all electives
app.get('/api/electives', async (req, res) => {
  try {
    console.log('📚 Fetching electives...');
    const electives = await Elective.find({});
    console.log(`✅ Found ${electives.length} electives`);
    
    // Log categories of all electives
    electives.forEach((elective, index) => {
      console.log(`Elective ${index + 1}: ${elective.name} - category: ${elective.category}, electiveCategory: ${elective.electiveCategory}`);
    });
    
    // Add deadline status to each elective
    const electivesWithStatus = electives.map(elective => {
      const now = new Date();
      const deadline = elective.deadline;
      const isExpired = deadline && deadline < now;
      
      return {
        ...elective.toObject(),
        isExpired,
        canSelect: !isExpired,
        daysLeft: deadline ? Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)) : null
      };
    });
    
    res.json({
      success: true,
      count: electivesWithStatus.length,
      electives: electivesWithStatus
    });
  } catch (error) {
    console.error('❌ Error fetching electives:', error);
    res.status(500).json({ error: 'Failed to fetch electives' });
  }
});

// Create new elective (Admin only)
app.post('/api/electives', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('🔥 Creating new elective:', req.body);
    console.log('📋 Category value:', req.body.category);
    console.log('📋 ElectiveCategory value:', req.body.electiveCategory);
    console.log('📋 SubjectType value:', req.body.subjectType);
    
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
      subjectType,
      image,
      deadline,
      selectionDeadline, // Support both field names
      prerequisites,
      futureOptions,
      instructor,
      maxStudents,
      minEnrollment,
      maxEnrollment
    } = req.body;

    console.log('📥 Received create data:', {
      minEnrollment,
      maxEnrollment,
      deadline: deadline || selectionDeadline
    });

    // Create new elective
    const newElective = new Elective({
      name,
      code: code && code.trim() !== '' ? code.trim() : undefined, // Set to undefined if empty
      semester: parseInt(semester),
      track,
      description,
      credits: parseInt(credits),
      department,
      category: Array.isArray(category) ? category : [category], // Ensure category is always an array
      electiveCategory,
      subjectType: subjectType || 'Theory', // Default to Theory if not provided
      instructor,
      image,
      deadline: deadline && deadline !== '' ? new Date(deadline) : (selectionDeadline && selectionDeadline !== '' ? new Date(selectionDeadline) : undefined), // Support both field names, allow null/undefined for no deadline
      prerequisites: prerequisites || [],
      futureOptions: futureOptions || [],
      maxStudents: maxStudents || maxEnrollment || 50, // Support both field names, prefer maxEnrollment
      minEnrollment: minEnrollment !== undefined ? minEnrollment : 5,
      maxEnrollment: maxEnrollment !== undefined ? maxEnrollment : (maxStudents || 50),
      enrolledStudents: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const savedElective = await newElective.save();
    console.log('✅ Elective created successfully:', savedElective._id);
    console.log('✅ Saved category:', savedElective.category);
    console.log('✅ Saved electiveCategory:', savedElective.electiveCategory);
    console.log('✅ Saved subjectType:', savedElective.subjectType);
    console.log('💾 Saved enrollment values:', {
      minEnrollment: savedElective.minEnrollment,
      maxEnrollment: savedElective.maxEnrollment,
      deadline: savedElective.deadline
    });
    
    res.status(201).json({
      success: true,
      message: 'Elective created successfully',
      elective: savedElective
    });
  } catch (error) {
    console.error('❌ Error creating elective:', error);
    
    // Handle duplicate key error specifically
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      const value = error.keyValue ? error.keyValue[field] : 'unknown';
      
      return res.status(400).json({ 
        success: false,
        error: `Duplicate ${field}`,
        message: `An elective with ${field} "${value}" already exists. Please use a different ${field}.`,
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to create elective',
      details: error.message 
    });
  }
});

// Update elective (Admin only)
app.put('/api/electives/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    console.log('🔄 Updating elective:', id);
    console.log('📥 Full request body:', req.body);
    console.log('📥 Received update data:', {
      minEnrollment: req.body.minEnrollment,
      maxEnrollment: req.body.maxEnrollment,
      deadline: req.body.deadline,
      types: {
        minEnrollment: typeof req.body.minEnrollment,
        maxEnrollment: typeof req.body.maxEnrollment,
        deadline: typeof req.body.deadline
      }
    });
    
    // Build update object, excluding undefined values
    const updateData = {};
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        // Special handling for deadline - empty string should clear it
        if (key === 'deadline' && req.body[key] === '') {
          updateData[key] = null;
        } else if (key === 'deadline' && req.body[key]) {
          updateData[key] = new Date(req.body[key]);
        } else {
          updateData[key] = req.body[key];
        }
      }
    });
    updateData.updatedAt = new Date();
    
    console.log('📝 Processed update data:', updateData);
    console.log('📝 Enrollment values in update:', {
      minEnrollment: updateData.minEnrollment,
      maxEnrollment: updateData.maxEnrollment,
      deadline: updateData.deadline
    });
    
    const updatedElective = await Elective.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedElective) {
      return res.status(404).json({ 
        success: false,
        error: 'Elective not found' 
      });
    }

    console.log('✅ Elective updated successfully:', updatedElective._id);
    console.log('💾 Saved values:', {
      minEnrollment: updatedElective.minEnrollment,
      maxEnrollment: updatedElective.maxEnrollment,
      deadline: updatedElective.deadline
    });
    
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
app.delete('/api/electives/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

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

// Select elective (Student only)
app.post('/api/electives/select/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Student access required' });
    }

    const electiveId = req.params.id;
    const {semester} = req.body; // Get semester from request
    const studentId = req.user.userId;
    
    const elective = await Elective.findById(electiveId);

    if (!elective) {
      return res.status(404).json({ error: 'Elective not found' });
    }

    // Check if deadline has passed
    const now = new Date();
    if (elective.deadline && elective.deadline < now) {
      return res.status(400).json({ 
        error: 'Selection deadline has passed',
        deadline: elective.deadline 
      });
    }

    // Check if elective is full
    if (elective.enrolledStudents >= elective.maxStudents) {
      return res.status(400).json({ error: 'Elective is full' });
    }

    // Check if student already selected this elective for this semester
    const existingSelection = await StudentElectiveSelection.findOne({
      studentId,
      electiveId,
      semester: semester || elective.semester
    });

    if (existingSelection) {
      return res.status(400).json({ error: 'You have already selected this elective for this semester' });
    }

    // Create student selection record
    const selection = new StudentElectiveSelection({
      studentId,
      electiveId,
      semester: semester || elective.semester,
      category: elective.category,
      status: 'selected'
    });

    await selection.save();

    // Update elective enrollment count
    elective.enrolledStudents = (elective.enrolledStudents || 0) + 1;
    await elective.save();

    console.log(`✅ Student ${studentId} selected elective ${elective.name} for semester ${semester || elective.semester}`);
    
    res.json({
      success: true,
      message: 'Elective selected successfully',
      elective: elective,
      selection: selection
    });
  } catch (error) {
    console.error('❌ Error selecting elective:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to select elective',
      details: error.message 
    });
  }
});

// Get student's elective selections
app.get('/api/student/selections', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const { semester } = req.query;
    
    const query = { studentId };
    if (semester) {
      query.semester = parseInt(semester);
    }
    
    const selections = await StudentElectiveSelection.find(query)
      .populate('electiveId')
      .sort({ semester: 1, selectedAt: -1 });
    
    console.log(`📚 Found ${selections.length} elective selections for student ${studentId}`);
    
    res.json({
      success: true,
      count: selections.length,
      selections: selections
    });
  } catch (error) {
    console.error('❌ Error fetching student selections:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch selections',
      details: error.message 
    });
  }
});

// Update student track selection
app.put('/api/student/track', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Student access required' });
    }

    const studentId = req.user.userId;
    const { track } = req.body;
    
    if (!track) {
      return res.status(400).json({ error: 'Track is required' });
    }
    
    const user = await User.findById(studentId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update track in profile
    if (!user.profile) {
      user.profile = {};
    }
    user.profile.track = track;
    
    await user.save();
    
    console.log(`✅ Updated track for student ${studentId} to ${track}`);
    
    res.json({
      success: true,
      message: 'Track updated successfully',
      track: track
    });
  } catch (error) {
    console.error('❌ Error updating student track:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update track',
      details: error.message 
    });
  }
});

// ============ TRACKS API ENDPOINTS ============

// Get all tracks
app.get('/api/tracks', async (req, res) => {
  try {
    console.log('🎯 Fetching tracks from database...');
    const tracks = await Track.find({});
    console.log(`✅ Found ${tracks.length} tracks`);
    
    res.json({
      success: true,
      count: tracks.length,
      tracks: tracks
    });
  } catch (error) {
    console.error('❌ Error fetching tracks:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch tracks' 
    });
  }
});

// Create new track
app.post('/api/tracks', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, department, category, description, credits } = req.body;
    
    console.log('📝 Creating new track:', { name, department, category });

    const track = new Track({
      name,
      department,
      category,
      description,
      credits
    });

    await track.save();
    console.log('✅ Track created successfully:', track._id);

    res.status(201).json({
      success: true,
      message: 'Track created successfully',
      track: track
    });
  } catch (error) {
    console.error('❌ Error creating track:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create track',
      details: error.message
    });
  }
});

// Update track
app.put('/api/tracks/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const trackId = req.params.id;
    const updates = req.body;

    console.log('🔄 Updating track:', trackId);

    const track = await Track.findByIdAndUpdate(
      trackId,
      updates,
      { new: true, runValidators: true }
    );

    if (!track) {
      return res.status(404).json({ 
        success: false,
        error: 'Track not found' 
      });
    }

    console.log('✅ Track updated successfully');

    res.json({
      success: true,
      message: 'Track updated successfully',
      track: track
    });
  } catch (error) {
    console.error('❌ Error updating track:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update track',
      details: error.message
    });
  }
});

// Delete track
app.delete('/api/tracks/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const trackId = req.params.id;
    console.log('🗑️ Deleting track:', trackId);

    const track = await Track.findByIdAndDelete(trackId);

    if (!track) {
      return res.status(404).json({ 
        success: false,
        error: 'Track not found' 
      });
    }

    console.log('✅ Track deleted successfully');

    res.json({
      success: true,
      message: 'Track deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting track:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete track',
      details: error.message
    });
  }
});

// System Config endpoints
// Get system configuration (public - no auth required for reading)
app.get('/api/system-config', async (req, res) => {
  try {
    let config = await SystemConfig.findOne();
    
    // If no config exists, build it from actual database data
    if (!config) {
      console.log('⚙️ No system config found, building from database data...');
      
      // Get unique departments from students and electives
      const students = await User.find({ role: 'student' });
      const electives = await Elective.find();
      
      const departmentsFromStudents = [...new Set(students.map(s => s.department).filter(Boolean))];
      const departmentsFromElectives = [...new Set(electives.map(e => e.department).filter(Boolean))];
      const allDepartments = [...new Set([...departmentsFromStudents, ...departmentsFromElectives])];
      
      // Get unique sections and semesters from students
      const sections = [...new Set(students.map(s => s.section).filter(Boolean))];
      const semesters = [...new Set(students.map(s => s.semester).filter(Boolean))].sort((a, b) => a - b);
      
      // Get unique elective categories
      const categories = [...new Set(electives.map(e => e.category || e.electiveCategory).filter(Boolean))];
      
      config = new SystemConfig({
        departments: allDepartments.length > 0 ? allDepartments : ['Artificial Intelligence'],
        semesters: semesters.length > 0 ? semesters : [1, 2, 3, 4, 5, 6, 7, 8],
        sections: sections.length > 0 ? sections : ['A'],
        electiveCategories: categories.length > 0 ? categories : ['Professional Elective', 'Open Elective']
      });
      await config.save();
      console.log('✅ Created system configuration from database:', {
        departments: config.departments,
        semesters: config.semesters,
        sections: config.sections,
        categories: config.electiveCategories
      });
    }

    res.json({
      success: true,
      config: {
        departments: config.departments,
        semesters: config.semesters,
        sections: config.sections,
        electiveCategories: config.electiveCategories
      }
    });
  } catch (error) {
    console.error('❌ Error fetching system config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch system configuration'
    });
  }
});

// Update system configuration (Admin only)
app.put('/api/system-config', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { departments, semesters, sections, electiveCategories } = req.body;

    let config = await SystemConfig.findOne();
    
    if (!config) {
      config = new SystemConfig();
    }

    // Update fields if provided
    if (departments) config.departments = departments;
    if (semesters) config.semesters = semesters;
    if (sections) config.sections = sections;
    if (electiveCategories) config.electiveCategories = electiveCategories;
    
    config.updatedAt = new Date();
    await config.save();

    console.log('✅ System configuration updated');

    res.json({
      success: true,
      message: 'System configuration updated successfully',
      config: {
        departments: config.departments,
        semesters: config.semesters,
        sections: config.sections,
        electiveCategories: config.electiveCategories
      }
    });
  } catch (error) {
    console.error('❌ Error updating system config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update system configuration'
    });
  }
});

// ==================== SYLLABUS MANAGEMENT ENDPOINTS ====================

// Upload a new syllabus (Admin only)
app.post('/api/syllabi', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      electiveId,
      title,
      description,
      pdfData,
      pdfFileName,
      uploadedBy,
      academicYear,
      semester,
      version,
      isActive
    } = req.body;

    // Validate required fields
    if (!electiveId || !title || !pdfData || !pdfFileName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: electiveId, title, pdfData, pdfFileName'
      });
    }

    // Deactivate previous versions for this elective
    await Syllabus.updateMany(
      { electiveId, isActive: true },
      { $set: { isActive: false } }
    );

    // Create new syllabus
    const newSyllabus = new Syllabus({
      electiveId,
      title,
      description,
      pdfData,
      pdfFileName,
      uploadedBy,
      academicYear,
      semester,
      version: version || 1,
      isActive: isActive !== undefined ? isActive : true
    });

    await newSyllabus.save();

    console.log(`✅ Syllabus uploaded for elective ${electiveId}`);

    res.status(201).json({
      success: true,
      message: 'Syllabus uploaded successfully',
      syllabus: {
        id: newSyllabus._id.toString(),
        electiveId: newSyllabus.electiveId,
        title: newSyllabus.title,
        description: newSyllabus.description,
        pdfData: newSyllabus.pdfData,
        pdfFileName: newSyllabus.pdfFileName,
        uploadedBy: newSyllabus.uploadedBy,
        uploadedAt: newSyllabus.uploadedAt,
        academicYear: newSyllabus.academicYear,
        semester: newSyllabus.semester,
        version: newSyllabus.version,
        isActive: newSyllabus.isActive
      }
    });
  } catch (error) {
    console.error('❌ Error uploading syllabus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload syllabus'
    });
  }
});

// Get all active syllabi (Public - Students need access)
app.get('/api/syllabi', async (req, res) => {
  try {
    const syllabi = await Syllabus.find({ isActive: true })
      .sort({ uploadedAt: -1 });

    const formattedSyllabi = syllabi.map(syllabus => ({
      id: syllabus._id.toString(),
      electiveId: syllabus.electiveId,
      title: syllabus.title,
      description: syllabus.description,
      pdfData: syllabus.pdfData,
      pdfFileName: syllabus.pdfFileName,
      uploadedBy: syllabus.uploadedBy,
      uploadedAt: syllabus.uploadedAt,
      academicYear: syllabus.academicYear,
      semester: syllabus.semester,
      version: syllabus.version,
      isActive: syllabus.isActive
    }));

    console.log(`✅ Retrieved ${formattedSyllabi.length} active syllabi`);

    res.json({
      syllabi: formattedSyllabi
    });
  } catch (error) {
    console.error('❌ Error fetching syllabi:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch syllabi'
    });
  }
});

// Get syllabus for a specific elective (Public - Students need access)
app.get('/api/syllabi/elective/:electiveId', async (req, res) => {
  try {
    const { electiveId } = req.params;

    const syllabus = await Syllabus.findOne({ electiveId, isActive: true });

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        error: 'Syllabus not found for this elective'
      });
    }

    console.log(`✅ Retrieved syllabus for elective ${electiveId}`);

    res.json({
      syllabus: {
        id: syllabus._id.toString(),
        electiveId: syllabus.electiveId,
        title: syllabus.title,
        description: syllabus.description,
        pdfData: syllabus.pdfData,
        pdfFileName: syllabus.pdfFileName,
        uploadedBy: syllabus.uploadedBy,
        uploadedAt: syllabus.uploadedAt,
        academicYear: syllabus.academicYear,
        semester: syllabus.semester,
        version: syllabus.version,
        isActive: syllabus.isActive
      }
    });
  } catch (error) {
    console.error('❌ Error fetching syllabus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch syllabus'
    });
  }
});

// Update a syllabus (Admin only)
app.put('/api/syllabi/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const updates = req.body;

    const syllabus = await Syllabus.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        error: 'Syllabus not found'
      });
    }

    console.log(`✅ Syllabus ${id} updated`);

    res.json({
      success: true,
      message: 'Syllabus updated successfully',
      syllabus: {
        id: syllabus._id.toString(),
        electiveId: syllabus.electiveId,
        title: syllabus.title,
        description: syllabus.description,
        pdfData: syllabus.pdfData,
        pdfFileName: syllabus.pdfFileName,
        uploadedBy: syllabus.uploadedBy,
        uploadedAt: syllabus.uploadedAt,
        academicYear: syllabus.academicYear,
        semester: syllabus.semester,
        version: syllabus.version,
        isActive: syllabus.isActive
      }
    });
  } catch (error) {
    console.error('❌ Error updating syllabus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update syllabus'
    });
  }
});

// Delete a syllabus (Admin only)
app.delete('/api/syllabi/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    const syllabus = await Syllabus.findByIdAndDelete(id);

    if (!syllabus) {
      return res.status(404).json({
        success: false,
        error: 'Syllabus not found'
      });
    }

    console.log(`✅ Syllabus ${id} deleted`);

    res.json({
      success: true,
      message: 'Syllabus deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting syllabus:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete syllabus'
    });
  }
});

// ==================== EMAIL NOTIFICATION ENDPOINTS ====================

// Send email notification to targeted students (Admin only)
app.post('/api/notifications/send-email', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { subject, message, recipients, alertType, filters } = req.body;

    // Validate required fields
    if (!subject || !message || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: subject, message, recipients'
      });
    }

    // Check if email is configured
    if (!emailTransporter) {
      console.warn('⚠️ Email not configured, simulating email send');
      return res.json({
        success: true,
        sentCount: recipients.length,
        failedCount: 0,
        message: `Simulated email send to ${recipients.length} recipients (Email service not configured)`
      });
    }

    let sentCount = 0;
    let failedCount = 0;
    const failedEmails = [];

    // Send email to each recipient
    for (const recipient of recipients) {
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM || '"Elective System" <noreply@example.com>',
          to: recipient.email,
          subject: subject,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
                .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
                .alert-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; margin-bottom: 15px; }
                .alert-general { background-color: #dbeafe; color: #1e40af; }
                .alert-deadline { background-color: #fee2e2; color: #991b1b; }
                .alert-reminder { background-color: #fef3c7; color: #92400e; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h2>${subject}</h2>
                </div>
                <div class="content">
                  ${alertType ? `<span class="alert-badge alert-${alertType}">${alertType.replace('_', ' ').toUpperCase()}</span>` : ''}
                  <p>Dear ${recipient.name},</p>
                  <p>${message.replace(/\n/g, '<br>')}</p>
                  ${filters ? `
                    <hr style="margin: 20px 0; border: 0; border-top: 1px solid #e5e7eb;">
                    <p style="font-size: 14px; color: #6b7280;">
                      <strong>Targeted to:</strong><br>
                      ${filters.department ? `Department: ${filters.department}<br>` : ''}
                      ${filters.semester ? `Semester: ${filters.semester}<br>` : ''}
                      ${filters.sections && filters.sections.length > 0 ? `Sections: ${filters.sections.join(', ')}` : ''}
                    </p>
                  ` : ''}
                </div>
                <div class="footer">
                  <p>This is an automated notification from the Elective Selection System.</p>
                  <p>&copy; ${new Date().getFullYear()} Elective Management System. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
        sentCount++;
        console.log(`✅ Email sent to ${recipient.email}`);
      } catch (emailError) {
        failedCount++;
        failedEmails.push(recipient.email);
        console.error(`❌ Failed to send email to ${recipient.email}:`, emailError.message);
      }
    }

    const responseMessage = `Email sent to ${sentCount} recipient(s).${failedCount > 0 ? ` Failed to send to ${failedCount} recipient(s).` : ''}`;
    
    console.log(`📧 Email notification completed: ${sentCount} sent, ${failedCount} failed`);

    res.json({
      success: true,
      sentCount,
      failedCount,
      message: responseMessage,
      failedEmails: failedCount > 0 ? failedEmails : undefined
    });
  } catch (error) {
    console.error('❌ Error sending email notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email notification',
      error: error.message
    });
  }
});

// Send email to specific users by IDs (Admin only)
app.post('/api/notifications/send-to-users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userIds, subject, message } = req.body;

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userIds, subject, message'
      });
    }

    // Get users from database
    const users = await User.find({ _id: { $in: userIds } }).select('email name');

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No users found with the provided IDs'
      });
    }

    const recipients = users.map(user => ({
      email: user.email,
      name: user.name
    }));

    // Check if email is configured
    if (!emailTransporter) {
      console.warn('⚠️ Email not configured, simulating email send');
      return res.json({
        success: true,
        sentCount: recipients.length,
        failedCount: 0,
        message: `Simulated email send to ${recipients.length} users (Email service not configured)`
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM || '"Elective System" <noreply@example.com>',
          to: recipient.email,
          subject: subject,
          html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2563eb;">${subject}</h2>
                <p>Dear ${recipient.name},</p>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <hr style="margin: 20px 0;">
                <p style="font-size: 12px; color: #6b7280;">
                  This is an automated notification from the Elective Selection System.
                </p>
              </div>
            </body>
            </html>
          `
        });
        sentCount++;
      } catch (emailError) {
        failedCount++;
        console.error(`❌ Failed to send email to ${recipient.email}:`, emailError.message);
      }
    }

    console.log(`📧 Emails sent to users: ${sentCount} sent, ${failedCount} failed`);

    res.json({
      success: true,
      sentCount,
      failedCount,
      message: `Email sent to ${sentCount} user(s).${failedCount > 0 ? ` Failed to send to ${failedCount}.` : ''}`
    });
  } catch (error) {
    console.error('❌ Error sending emails to users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send emails to users',
      error: error.message
    });
  }
});

// Test email configuration (Admin only)
app.post('/api/notifications/test-email', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { recipientEmail } = req.body;

    if (!recipientEmail) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email is required'
      });
    }

    // Check if email is configured
    if (!emailTransporter) {
      return res.json({
        success: false,
        message: 'Email service is not configured. Please configure SMTP settings in environment variables.'
      });
    }

    // Send test email
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || '"Elective System" <noreply@example.com>',
      to: recipientEmail,
      subject: 'Test Email - Elective System',
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #2563eb;">✅ Email Configuration Test</h2>
            <p>This is a test email from the Elective Selection System.</p>
            <p>If you're reading this, your email configuration is working correctly!</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 14px; color: #6b7280;">
              <strong>Configuration Details:</strong><br>
              SMTP Host: ${process.env.SMTP_HOST}<br>
              SMTP Port: ${process.env.SMTP_PORT}<br>
              From: ${process.env.EMAIL_FROM || 'Not configured'}<br>
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        </body>
        </html>
      `
    });

    console.log(`✅ Test email sent to ${recipientEmail}`);

    res.json({
      success: true,
      message: 'Test email sent successfully! Please check the inbox.'
    });
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
});

// ============================================
// ELECTIVE LIMITS ROUTES
// ============================================

// Get all elective limits
app.get('/api/elective-limits', authenticateToken, async (req, res) => {
  try {
    const limits = await ElectiveLimit.find({ isActive: true }).sort({ department: 1, semester: 1, category: 1 });
    res.json({ success: true, limits });
  } catch (error) {
    console.error('Error fetching elective limits:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch elective limits' });
  }
});

// Get specific elective limit
app.get('/api/elective-limits/:department/:semester/:category', authenticateToken, async (req, res) => {
  try {
    const { department, semester, category } = req.params;
    const limit = await ElectiveLimit.findOne({
      department,
      semester: parseInt(semester),
      category,
      isActive: true
    });
    
    // If no limit found, return default of 1
    res.json({ 
      success: true, 
      limit: limit ? limit.maxElectives : 1,
      found: !!limit
    });
  } catch (error) {
    console.error('Error fetching elective limit:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch elective limit' });
  }
});

// Create or update elective limit
app.post('/api/elective-limits', authenticateToken, async (req, res) => {
  try {
    const { department, semester, category, maxElectives } = req.body;
    
    if (!department || !semester || !category || !maxElectives) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if limit already exists
    const existingLimit = await ElectiveLimit.findOne({ department, semester, category });
    
    if (existingLimit) {
      // Update existing
      existingLimit.maxElectives = maxElectives;
      existingLimit.updatedAt = new Date();
      await existingLimit.save();
      res.json({ success: true, limit: existingLimit, updated: true });
    } else {
      // Create new
      const newLimit = new ElectiveLimit({
        department,
        semester,
        category,
        maxElectives,
        isActive: true,
        createdBy: req.user.id
      });
      await newLimit.save();
      res.json({ success: true, limit: newLimit, created: true });
    }
  } catch (error) {
    console.error('Error saving elective limit:', error);
    res.status(500).json({ success: false, error: 'Failed to save elective limit' });
  }
});

// Update elective limit
app.put('/api/elective-limits/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { maxElectives } = req.body;
    
    const limit = await ElectiveLimit.findByIdAndUpdate(
      id,
      { maxElectives, updatedAt: new Date() },
      { new: true }
    );
    
    if (!limit) {
      return res.status(404).json({ success: false, error: 'Limit not found' });
    }
    
    res.json({ success: true, limit });
  } catch (error) {
    console.error('Error updating elective limit:', error);
    res.status(500).json({ success: false, error: 'Failed to update elective limit' });
  }
});

// Delete elective limit
app.delete('/api/elective-limits/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await ElectiveLimit.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting elective limit:', error);
    res.status(500).json({ success: false, error: 'Failed to delete elective limit' });
  }
});

// Handle React Router - serve index.html for all non-API routes
app.use((req, res, next) => {
  // Only serve React app for non-API routes
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

const PORT = process.env.PORT || 5000;

// Initialize database with default admin on first run
async function initializeDatabase() {
  try {
    // Check if any admin user exists
    const adminExists = await User.findOne({ role: 'admin' });
    
    if (!adminExists) {
      console.log('\n' + '='.repeat(80));
      console.log('🔧 FIRST TIME SETUP - Creating default admin account');
      console.log('='.repeat(80));
      
      // Create default admin
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        name: 'System Administrator',
        email: 'admin@college.edu',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date()
      });
      
      console.log('✅ Default admin created successfully!\n');
      console.log('📧 Email: admin@college.edu');
      console.log('🔑 Password: admin123');
      console.log('\n⚠️  IMPORTANT: Change this password after first login!');
      console.log('='.repeat(80) + '\n');
    }
  } catch (error) {
    console.error('❌ Database initialization error:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Authentication server running on port ${PORT}`);
  await initializeDatabase();
});

module.exports = app;
