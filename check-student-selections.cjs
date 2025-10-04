const mongoose = require('mongoose');
require('dotenv').config({ quiet: true });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';

async function checkStudentElectives() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    
    // Check all collections
    const collections = await db.listCollections().toArray();
    console.log('📚 Available collections:');
    collections.forEach(col => {
      console.log(`  - ${col.name}`);
    });
    
    // Check for studentelectiveselections collection
    const selectionCollection = db.collection('studentelectiveselections');
    const selectionCount = await selectionCollection.countDocuments();
    
    console.log(`\n📊 Student Elective Selections:`);
    console.log(`   Total records: ${selectionCount}\n`);
    
    if (selectionCount > 0) {
      console.log('✅ Student selections ARE being stored!\n');
      
      // Show some sample selections
      const samples = await selectionCollection.find({}).limit(5).toArray();
      
      console.log('📝 Sample selections:');
      samples.forEach((selection, i) => {
        console.log(`\n${i + 1}. Selection ID: ${selection._id}`);
        console.log(`   Student ID: ${selection.studentId}`);
        console.log(`   Elective ID: ${selection.electiveId}`);
        console.log(`   Semester: ${selection.semester}`);
        console.log(`   Status: ${selection.status}`);
        console.log(`   Categories: ${JSON.stringify(selection.category)}`);
        console.log(`   Selected At: ${selection.selectedAt || selection.createdAt}`);
      });
      
      // Group by student
      console.log('\n\n📊 Selections grouped by student:');
      const pipeline = [
        {
          $group: {
            _id: '$studentId',
            count: { $sum: 1 },
            selections: { $push: { electiveId: '$electiveId', semester: '$semester', status: '$status' } }
          }
        },
        { $sort: { count: -1 } }
      ];
      
      const grouped = await selectionCollection.aggregate(pipeline).toArray();
      grouped.forEach(student => {
        console.log(`\n  Student ${student._id}:`);
        console.log(`    Total selections: ${student.count}`);
        student.selections.forEach((sel, i) => {
          console.log(`    ${i + 1}. Semester ${sel.semester} - Elective ${sel.electiveId} (${sel.status})`);
        });
      });
      
      // Check by semester
      console.log('\n\n📊 Selections by semester:');
      const bySemester = await selectionCollection.aggregate([
        {
          $group: {
            _id: '$semester',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();
      
      bySemester.forEach(sem => {
        console.log(`  Semester ${sem._id}: ${sem.count} selections`);
      });
      
      // Check by status
      console.log('\n\n📊 Selections by status:');
      const byStatus = await selectionCollection.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]).toArray();
      
      byStatus.forEach(status => {
        console.log(`  ${status._id}: ${status.count} selections`);
      });
      
    } else {
      console.log('⚠️ No student selections found in database!');
      console.log('\nPossible reasons:');
      console.log('  1. No students have selected electives yet');
      console.log('  2. Selections are stored in a different collection');
      console.log('  3. Database connection is pointing to wrong database');
      console.log('  4. Data is only in localStorage (not synced to backend)');
    }
    
    // Also check users collection for students
    console.log('\n\n👥 Checking users:');
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    const studentCount = await usersCollection.countDocuments({ role: 'student' });
    
    console.log(`  Total users: ${userCount}`);
    console.log(`  Students: ${studentCount}`);
    
    if (studentCount > 0) {
      const students = await usersCollection.find({ role: 'student' }).limit(3).toArray();
      console.log('\n  Sample students:');
      students.forEach((student, i) => {
        console.log(`    ${i + 1}. ${student.name} (ID: ${student._id || student.studentId})`);
        console.log(`       Semester: ${student.semester}, Dept: ${student.department}`);
      });
    }
    
    // Check electives
    console.log('\n\n📚 Checking electives:');
    const electivesCollection = db.collection('electives');
    const electiveCount = await electivesCollection.countDocuments();
    console.log(`  Total electives: ${electiveCount}`);

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n\n👋 Disconnected from MongoDB');
  }
}

checkStudentElectives();
