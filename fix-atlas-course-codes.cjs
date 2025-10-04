const mongoose = require('mongoose');
require('dotenv').config({ quiet: true });

// Use MongoDB Atlas URI from environment
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';

async function fixNullCourseCodesAtlas() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const electivesCollection = db.collection('electives');

    // Step 1: Count all electives
    const totalCount = await electivesCollection.countDocuments();
    console.log(`\n📊 Total electives in database: ${totalCount}`);

    // Step 2: Find all electives with null/invalid course codes
    console.log('\n📊 Finding electives with null/invalid course codes...');
    const invalidCodes = await electivesCollection.find({
      $or: [
        { code: null },
        { code: 'null' },
        { code: 'undefined' },
        { code: 'NULL' },
        { code: '' }
      ]
    }).toArray();

    console.log(`\n🔍 Found ${invalidCodes.length} electives with invalid course codes:`);
    if (invalidCodes.length > 0) {
      invalidCodes.forEach(elective => {
        console.log(`  📝 ${elective.name} (code: ${JSON.stringify(elective.code)})`);
      });
    }

    if (invalidCodes.length === 0) {
      console.log('✅ No invalid course codes found!');
      
      // Still need to check if index is sparse
      console.log('\n🔧 Checking if index needs to be fixed...');
      const indexes = await electivesCollection.indexes();
      const codeIndex = indexes.find(i => i.name === 'code_1');
      
      if (codeIndex && !codeIndex.sparse) {
        console.log('⚠️ Index exists but is NOT sparse. Fixing...');
        await electivesCollection.dropIndex('code_1');
        await electivesCollection.createIndex(
          { code: 1 }, 
          { unique: true, sparse: true, name: 'code_1' }
        );
        console.log('✅ Recreated index as sparse');
      }
    } else {
      // Step 3: First, DROP the index before updating documents
      console.log('\n🔧 Dropping code_1 index before update...');
      try {
        await electivesCollection.dropIndex('code_1');
        console.log('✅ Dropped code_1 index');
      } catch (error) {
        console.log('ℹ️ code_1 index does not exist or already dropped:', error.message);
      }

      // Step 4: Now remove the code field from invalid documents
      console.log('\n🔧 Removing invalid course code fields...');
      const updateResult = await electivesCollection.updateMany(
        {
          $or: [
            { code: null },
            { code: 'null' },
            { code: 'undefined' },
            { code: 'NULL' },
            { code: '' }
          ]
        },
        {
          $unset: { code: "" } // This removes the field entirely
        }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} documents`);
      console.log(`   Matched: ${updateResult.matchedCount}`);
      
      // Step 5: Recreate the index as sparse
      console.log('\n🔧 Creating new sparse unique index...');
      await electivesCollection.createIndex(
        { code: 1 }, 
        { 
          unique: true, 
          sparse: true, // This allows multiple documents without the code field
          name: 'code_1'
        }
      );
      console.log('✅ Created new sparse unique index on code field');
    }

    // Show current indexes
    const indexes = await electivesCollection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(index => {
      const key = JSON.stringify(index.key);
      const unique = index.unique ? '🔒 unique' : '';
      const sparse = index.sparse ? '✅ sparse' : '';
      console.log(`  ${index.name}: ${key} ${unique} ${sparse}`);
    });

    // Verify the fix
    console.log('\n📊 Final Verification:');
    const finalTotal = await electivesCollection.countDocuments();
    const withCode = await electivesCollection.countDocuments({ code: { $exists: true, $ne: null } });
    const withoutCode = await electivesCollection.countDocuments({ $or: [{ code: { $exists: false } }, { code: null }] });

    console.log(`  📊 Total electives: ${finalTotal}`);
    console.log(`  ✅ With valid course codes: ${withCode}`);
    console.log(`  ⭕ Without course codes: ${withoutCode}`);

    // Check for any remaining invalid codes
    const remainingInvalid = await electivesCollection.countDocuments({
      $or: [
        { code: null },
        { code: 'null' },
        { code: 'undefined' },
        { code: 'NULL' },
        { code: '' }
      ]
    });

    if (remainingInvalid > 0) {
      console.log(`\n⚠️ Warning: ${remainingInvalid} electives still have invalid course codes!`);
      
      // Show them
      const stillInvalid = await electivesCollection.find({
        $or: [
          { code: null },
          { code: 'null' },
          { code: 'undefined' },
          { code: 'NULL' },
          { code: '' }
        ]
      }).toArray();
      
      stillInvalid.forEach(e => {
        console.log(`  ⚠️ ${e.name}: code = ${JSON.stringify(e.code)}`);
      });
    } else {
      console.log('\n✅ No invalid course codes remaining!');
    }

    console.log('\n✅ Course code fix completed successfully!');
    console.log('\n📝 Summary:');
    console.log('  ✅ Invalid course codes have been removed from documents');
    console.log('  ✅ Sparse unique index has been created/verified');
    console.log('  ✅ Multiple electives can now exist without course codes');
    console.log('  ✅ Course codes that ARE provided must still be unique');
    console.log('\n💡 You can now add multiple electives without course codes!');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the fix
fixNullCourseCodesAtlas();
