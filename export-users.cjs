const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

// Define schemas inline
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  studentId: String,
  department: String,
  year: Number,
  semester: Number,
  createdAt: { type: Date, default: Date.now }
});

const electiveSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: String,
  credits: { type: Number, required: true },
  instructor: { type: String, required: true },
  capacity: { type: Number, required: true },
  enrolled: { type: Number, default: 0 },
  semester: { type: String, required: true },
  department: { type: String, required: true },
  prerequisites: [String],
  schedule: {
    day: String,
    time: String,
    duration: String
  },
  category: { type: String, enum: ['Theory', 'Practical'], required: true },
  electiveCategory: { type: String, enum: ['Humanities', 'Departmental', 'Open Elective'], required: true },
  track: String,
  image: String,
  difficulty: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  tags: [String],
  deadlines: {
    registration: Date,
    withdrawal: Date
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const studentElectiveSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  elective: { type: mongoose.Schema.Types.ObjectId, ref: 'Elective', required: true },
  semester: { type: String, required: true },
  status: { type: String, enum: ['enrolled', 'completed', 'dropped'], default: 'enrolled' },
  grade: String,
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },
  selectedAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', userSchema);
const Elective = mongoose.model('Elective', electiveSchema);
const StudentElective = mongoose.model('StudentElective', studentElectiveSchema);

async function exportUserData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB Atlas');

    // Get all data
    console.log('📊 Fetching all data...');
    const users = await User.find({}).select('-password');
    const electives = await Elective.find({});
    const studentElectives = await StudentElective.find({})
      .populate('student', 'name email studentId')
      .populate('elective', 'code name');

    // Prepare export data
    const exportData = {
      summary: {
        totalUsers: users.length,
        totalElectives: electives.length,
        totalEnrollments: studentElectives.length,
        exportDate: new Date().toISOString()
      },
      users: users.map(user => ({
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        department: user.department,
        year: user.year,
        semester: user.semester,
        createdAt: user.createdAt
      })),
      electives: electives.map(elective => ({
        code: elective.code,
        name: elective.name,
        description: elective.description,
        credits: elective.credits,
        instructor: elective.instructor,
        capacity: elective.capacity,
        enrolled: elective.enrolled,
        semester: elective.semester,
        department: elective.department,
        category: elective.category,
        electiveCategory: elective.electiveCategory,
        track: elective.track,
        difficulty: elective.difficulty,
        tags: elective.tags,
        deadlines: elective.deadlines,
        isActive: elective.isActive
      })),
      studentElectives: studentElectives.map(se => ({
        student: se.student ? {
          name: se.student.name,
          email: se.student.email,
          studentId: se.student.studentId
        } : null,
        elective: se.elective ? {
          code: se.elective.code,
          name: se.elective.name
        } : null,
        semester: se.semester,
        status: se.status,
        grade: se.grade,
        feedback: se.feedback,
        selectedAt: se.selectedAt
      }))
    };

    // Save to file
    const filename = `user_data_export_${new Date().toISOString().slice(0, 10)}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));

    console.log('\n📋 EXPORT SUMMARY:');
    console.log('===================');
    console.log(`📊 Total Users: ${users.length}`);
    console.log(`📚 Total Electives: ${electives.length}`);
    console.log(`🎓 Total Enrollments: ${studentElectives.length}`);
    console.log(`📁 Exported to: ${filename}`);
    
    console.log('\n👥 USER ACCOUNTS:');
    console.log('==================');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role.toUpperCase()}`);
      if (user.studentId) console.log(`   Student ID: ${user.studentId}`);
      if (user.department) console.log(`   Department: ${user.department}`);
      if (user.year) console.log(`   Year: ${user.year}, Semester: ${user.semester}`);
      console.log(`   Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });

    console.log('\n📚 AVAILABLE ELECTIVES:');
    console.log('========================');
    electives.forEach((elective, index) => {
      console.log(`${index + 1}. ${elective.code} - ${elective.name}`);
      console.log(`   Credits: ${elective.credits} | Instructor: ${elective.instructor}`);
      console.log(`   Category: ${elective.electiveCategory} (${elective.category})`);
      console.log(`   Enrolled: ${elective.enrolled}/${elective.capacity}`);
      if (elective.track) console.log(`   Track: ${elective.track}`);
      console.log('');
    });

    console.log(`\n✅ Data exported successfully to ${filename}`);
    console.log('🚀 Ready for deployment!');

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

exportUserData();
