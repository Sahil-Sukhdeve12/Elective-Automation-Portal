const mongoose = require('mongoose');
require('dotenv').config();

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  selectedElectives: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Elective' }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Elective Schema  
const electiveSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  credits: { type: Number, required: true },
  semester: { type: String, required: true },
  department: { type: String, required: true },
  maxStudents: { type: Number, default: 30 },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

const Elective = mongoose.model('Elective', electiveSchema);

async function viewUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB Atlas\n');

    // Get all users with populated electives
    const users = await User.find({}).populate('selectedElectives').lean();
    
    console.log('👥 USER MANAGEMENT DASHBOARD');
    console.log('=' .repeat(50));
    console.log(`Total Users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`👤 User ${index + 1}:`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Roll Number: ${user.rollNumber || 'N/A'}`);
      console.log(`   Role: ${user.role.toUpperCase()}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Registration Date: ${user.createdAt.toLocaleDateString()}`);
      console.log(`   Selected Electives: ${user.selectedElectives?.length || 0}`);
      
      if (user.selectedElectives && user.selectedElectives.length > 0) {
        console.log(`   📚 Enrolled in:`);
        user.selectedElectives.forEach(elective => {
          console.log(`      - ${elective.name} (${elective.credits} credits)`);
        });
      }
      console.log('-'.repeat(40));
    });

    // Get statistics
    const adminCount = users.filter(u => u.role === 'admin').length;
    const studentCount = users.filter(u => u.role === 'student').length;
    
    console.log('\n📊 STATISTICS:');
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Students: ${studentCount}`);
    console.log(`   Total Users: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the function
viewUsers();
