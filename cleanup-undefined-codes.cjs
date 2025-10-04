const mongoose = require('mongoose');
require('dotenv').config({ quiet: true });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';

async function cleanupUndefinedCodes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const electivesCollection = db.collection('electives');

    // Find all electives
    console.log('\n📊 Checking all electives...');
    const allElectives = await electivesCollection.find({}).toArray();
    
    console.log(`Total electives: ${allElectives.length}\n`);
    
    allElectives.forEach((e, i) => {
      console.log(`${i + 1}. ${e.name}`);
      console.log(`   code field exists: ${e.hasOwnProperty('code')}`);
      console.log(`   code value: ${JSON.stringify(e.code)}`);
      console.log(`   code type: ${typeof e.code}\n`);
    });

    // Update each elective individually to remove undefined codes
    console.log('\n🔧 Removing undefined code fields...');
    let fixed = 0;
    
    for (const elective of allElectives) {
      if (elective.hasOwnProperty('code') && 
          (elective.code === undefined || 
           elective.code === null || 
           elective.code === '' || 
           elective.code === 'null' || 
           elective.code === 'undefined')) {
        
        console.log(`  Fixing: ${elective.name}`);
        await electivesCollection.updateOne(
          { _id: elective._id },
          { $unset: { code: 1 } }
        );
        fixed++;
      }
    }
    
    console.log(`\n✅ Fixed ${fixed} electives`);

    // Verify
    console.log('\n📊 Final verification...');
    const finalElectives = await electivesCollection.find({}).toArray();
    
    finalElectives.forEach((e, i) => {
      console.log(`${i + 1}. ${e.name}`);
      console.log(`   has code field: ${e.hasOwnProperty('code')}`);
      if (e.hasOwnProperty('code')) {
        console.log(`   code: "${e.code}"`);
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected');
  }
}

cleanupUndefinedCodes();
