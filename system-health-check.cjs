const mongoose = require('mongoose');
require('dotenv').config({ quiet: true });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';

async function checkSystemHealth() {
  try {
    console.log('🏥 SYSTEM HEALTH CHECK\n');
    console.log('=' .repeat(60));
    
    // 1. MongoDB Connection
    console.log('\n1️⃣  DATABASE CONNECTION');
    console.log('-'.repeat(60));
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ MongoDB Atlas connected successfully');
      console.log(`📍 Database: ${mongoose.connection.name}`);
    } catch (error) {
      console.log('❌ MongoDB connection failed:', error.message);
      return;
    }

    const db = mongoose.connection.db;

    // 2. Collections Check
    console.log('\n2️⃣  COLLECTIONS STATUS');
    console.log('-'.repeat(60));
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const expectedCollections = [
      'users',
      'electives',
      'studentelectiveselections',
      'tracks',
      'syllabuses',
      'feedbacktemplates',
      'feedbackresponses',
      'systemconfigs'
    ];

    expectedCollections.forEach(name => {
      if (collectionNames.includes(name)) {
        console.log(`✅ ${name}`);
      } else {
        console.log(`⚠️  ${name} - MISSING`);
      }
    });

    // 3. Data Count Check
    console.log('\n3️⃣  DATA STATISTICS');
    console.log('-'.repeat(60));
    
    const stats = {
      users: await db.collection('users').countDocuments(),
      students: await db.collection('users').countDocuments({ role: 'student' }),
      admins: await db.collection('users').countDocuments({ role: 'admin' }),
      electives: await db.collection('electives').countDocuments(),
      selections: await db.collection('studentelectiveselections').countDocuments(),
      tracks: await db.collection('tracks').countDocuments(),
      syllabuses: await db.collection('syllabuses').countDocuments(),
      feedbackTemplates: await db.collection('feedbacktemplates').countDocuments(),
      feedbackResponses: await db.collection('feedbackresponses').countDocuments()
    };

    console.log(`📊 Total Users: ${stats.users}`);
    console.log(`   👨‍🎓 Students: ${stats.students}`);
    console.log(`   👨‍💼 Admins: ${stats.admins}`);
    console.log(`📚 Electives: ${stats.electives}`);
    console.log(`🎯 Student Selections: ${stats.selections}`);
    console.log(`🛤️  Tracks: ${stats.tracks}`);
    console.log(`📄 Syllabi: ${stats.syllabuses}`);
    console.log(`📝 Feedback Templates: ${stats.feedbackTemplates}`);
    console.log(`💬 Feedback Responses: ${stats.feedbackResponses}`);

    // 4. Index Health Check
    console.log('\n4️⃣  INDEX HEALTH');
    console.log('-'.repeat(60));
    
    // Check electives indexes
    const electiveIndexes = await db.collection('electives').indexes();
    const codeIndex = electiveIndexes.find(i => i.name === 'code_1');
    
    if (codeIndex) {
      const isSparse = codeIndex.sparse ? '✅ sparse' : '❌ NOT sparse';
      const isUnique = codeIndex.unique ? '🔒 unique' : '';
      console.log(`Course Code Index: ${isSparse} ${isUnique}`);
    } else {
      console.log('⚠️  Course code index missing');
    }

    // Check studentelectiveselections indexes
    const selectionIndexes = await db.collection('studentelectiveselections').indexes();
    const compoundIndex = selectionIndexes.find(i => 
      i.name && (i.name.includes('studentId') || i.name.includes('electiveId'))
    );
    
    if (compoundIndex) {
      console.log(`✅ Student selection compound index exists`);
    } else {
      console.log('⚠️  Student selection compound index missing');
    }

    // 5. Sample Data Check
    console.log('\n5️⃣  SAMPLE DATA VALIDATION');
    console.log('-'.repeat(60));
    
    // Check for sample student
    const sampleStudent = await db.collection('users').findOne({ role: 'student' });
    if (sampleStudent) {
      console.log('✅ Sample Student Found:');
      console.log(`   Name: ${sampleStudent.name}`);
      console.log(`   Email: ${sampleStudent.email}`);
      console.log(`   Department: ${sampleStudent.department}`);
      console.log(`   Semester: ${sampleStudent.semester}`);
      console.log(`   Roll No: ${sampleStudent.rollNumber || sampleStudent.rollNo || 'N/A'}`);
    } else {
      console.log('⚠️  No students found');
    }

    // Check for sample admin
    const sampleAdmin = await db.collection('users').findOne({ role: 'admin' });
    if (sampleAdmin) {
      console.log('✅ Sample Admin Found:');
      console.log(`   Name: ${sampleAdmin.name}`);
      console.log(`   Email: ${sampleAdmin.email}`);
    } else {
      console.log('⚠️  No admin found');
    }

    // Check for electives with null/invalid codes
    const invalidCodes = await db.collection('electives').countDocuments({
      $or: [
        { code: null },
        { code: '' },
        { code: 'null' },
        { code: 'undefined' }
      ]
    });
    
    if (invalidCodes > 0) {
      console.log(`⚠️  ${invalidCodes} electives have invalid course codes`);
    } else {
      console.log('✅ All electives have valid course codes');
    }

    // 6. Configuration Check
    console.log('\n6️⃣  SYSTEM CONFIGURATION');
    console.log('-'.repeat(60));
    
    const systemConfig = await db.collection('systemconfigs').findOne();
    if (systemConfig) {
      console.log('✅ System configuration exists');
      if (systemConfig.departments) {
        console.log(`   Departments configured: ${systemConfig.departments.length}`);
      }
      if (systemConfig.semesters) {
        console.log(`   Semesters configured: ${systemConfig.semesters.length}`);
      }
      if (systemConfig.sections) {
        console.log(`   Sections configured: ${systemConfig.sections.length}`);
      }
    } else {
      console.log('⚠️  No system configuration found (using defaults)');
    }

    // 7. Critical Issues Check
    console.log('\n7️⃣  CRITICAL ISSUES CHECK');
    console.log('-'.repeat(60));
    
    let issuesFound = 0;

    // Check for duplicate emails
    const duplicateEmails = await db.collection('users').aggregate([
      { $group: { _id: '$email', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (duplicateEmails.length > 0) {
      console.log(`❌ Duplicate emails found: ${duplicateEmails.length}`);
      issuesFound++;
    } else {
      console.log('✅ No duplicate emails');
    }

    // Check for duplicate roll numbers
    const duplicateRolls = await db.collection('users').aggregate([
      { $match: { rollNumber: { $ne: null, $exists: true } } },
      { $group: { _id: '$rollNumber', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (duplicateRolls.length > 0) {
      console.log(`❌ Duplicate roll numbers found: ${duplicateRolls.length}`);
      issuesFound++;
    } else {
      console.log('✅ No duplicate roll numbers');
    }

    // Check for orphaned selections (selections for non-existent electives)
    const selections = await db.collection('studentelectiveselections').find().toArray();
    const electiveIds = (await db.collection('electives').find().toArray()).map(e => e._id.toString());
    
    const orphanedSelections = selections.filter(sel => {
      const electiveId = sel.electiveId.toString();
      return !electiveIds.includes(electiveId);
    });
    
    if (orphanedSelections.length > 0) {
      console.log(`⚠️  Orphaned selections found: ${orphanedSelections.length}`);
      issuesFound++;
    } else {
      console.log('✅ No orphaned selections');
    }

    // 8. Summary
    console.log('\n8️⃣  SUMMARY');
    console.log('='.repeat(60));
    
    if (issuesFound === 0 && stats.users > 0 && stats.electives > 0) {
      console.log('🎉 SYSTEM STATUS: HEALTHY');
      console.log('✅ All checks passed');
      console.log('✅ Database is properly configured');
      console.log('✅ Data integrity maintained');
    } else if (issuesFound > 0) {
      console.log('⚠️  SYSTEM STATUS: NEEDS ATTENTION');
      console.log(`❌ ${issuesFound} critical issue(s) found`);
      console.log('📋 Please review the issues above');
    } else {
      console.log('ℹ️  SYSTEM STATUS: EMPTY');
      console.log('📝 Database is healthy but has minimal data');
      console.log('💡 Consider adding sample data for testing');
    }

    console.log('\n' + '='.repeat(60));
    console.log('🏁 Health check completed\n');

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed\n');
  }
}

// Run the health check
checkSystemHealth();
