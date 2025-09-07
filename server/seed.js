import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

import User from './models/User.js';
import Elective from './models/Elective.js';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Elective.deleteMany({});
    
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@college.edu',
      password: adminPassword,
      role: 'admin'
    });
    await admin.save();
    console.log('Created admin user: admin@college.edu / admin123');

    // Create student user
    const studentPassword = await bcrypt.hash('student123', 10);
    const student = new User({
      name: 'John Doe',
      email: 'student@college.edu',
      password: studentPassword,
      role: 'student',
      department: 'Computer Science',
      semester: 5
    });
    await student.save();
    console.log('Created student user: student@college.edu / student123');

    // Create sample electives
    const electives = [
      {
        name: 'Machine Learning',
        code: 'CS501',
        semester: 5,
        track: 'Artificial Intelligence',
        description: 'Introduction to machine learning algorithms and their applications',
        credits: 3,
        department: 'Computer Science',
        category: 'Theory',
        electiveCategory: 'Departmental',
        image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
        selectionDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        createdBy: admin._id
      },
      {
        name: 'Web Development',
        code: 'CS502',
        semester: 5,
        track: 'Web Development',
        description: 'Full-stack web development using modern frameworks',
        credits: 3,
        department: 'Computer Science',
        category: 'Theory',
        electiveCategory: 'Departmental',
        image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop',
        selectionDeadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days from now
        createdBy: admin._id
      },
      {
        name: 'Data Visualization',
        code: 'CS503',
        semester: 5,
        track: 'Data Science',
        description: 'Creating interactive visualizations and dashboards',
        credits: 3,
        department: 'Computer Science',
        category: 'Theory',
        electiveCategory: 'Departmental',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
        selectionDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
        createdBy: admin._id
      },
      {
        name: 'Psychology of Learning',
        code: 'HU501',
        semester: 5,
        track: 'General',
        description: 'Understanding how humans learn and process information',
        credits: 2,
        department: 'Humanities',
        category: 'Theory',
        electiveCategory: 'Humanities',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=300&fit=crop',
        selectionDeadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
        createdBy: admin._id
      },
      {
        name: 'Digital Marketing',
        code: 'MK501',
        semester: 5,
        track: 'General',
        description: 'Modern digital marketing strategies and tools',
        credits: 3,
        department: 'Management',
        category: 'Theory',
        electiveCategory: 'Open Elective',
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
        selectionDeadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        createdBy: admin._id
      },
      {
        name: 'Mobile App Development',
        code: 'CS504',
        semester: 6,
        track: 'Mobile Development',
        description: 'Building native and cross-platform mobile applications',
        credits: 4,
        department: 'Computer Science',
        category: 'Theory',
        electiveCategory: 'Departmental',
        image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop',
        selectionDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        createdBy: admin._id
      }
    ];

    for (const electiveData of electives) {
      const elective = new Elective(electiveData);
      await elective.save();
    }

    console.log(`Created ${electives.length} sample electives`);
    console.log('Database seeded successfully!');
    
    console.log('\n=== LOGIN CREDENTIALS ===');
    console.log('Admin: admin@college.edu / admin123');
    console.log('Student: student@college.edu / student123');
    console.log('========================\n');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
  }
};

const runSeed = async () => {
  await connectDB();
  await seedData();
};

runSeed();
