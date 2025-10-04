const mongoose = require('mongoose');

// MongoDB connection
const MONGODB_URI = 'mongodb://localhost:27017/elective-selection';

async function fixNullCourseCodes() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const electivesCollection = db.collection('electives');

    // Step 1: Find all electives with null, "null", or "undefined" course codes
    console.log('\n📊 Finding electives with null/invalid course codes...');
    const invalidCodes = await electivesCollection.find({
      $or: [
        { code: null },
        { code: 'null' },
        { code: 'undefined' },
        { code: '' }
      ]
    }).toArray();

    console.log(`Found ${invalidCodes.length} electives with invalid course codes:`);
    invalidCodes.forEach(elective => {
      console.log(`  - ${elective.name} (code: ${JSON.stringify(elective.code)})`);
    });

    if (invalidCodes.length === 0) {
      console.log('\n✅ No invalid course codes found!');
    } else {
      // Step 2: Remove the code field from these documents (set to undefined)
      console.log('\n🔧 Removing invalid course code fields...');
      const updateResult = await electivesCollection.updateMany(
        {
          $or: [
            { code: null },
            { code: 'null' },
            { code: 'undefined' },
            { code: '' }
          ]
        },
        {
          $unset: { code: "" } // This removes the field entirely
        }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} documents`);
    }

    // Step 3: Drop and recreate the index to ensure it's sparse
    console.log('\n🔧 Fixing course code index...');
    
    // Get current indexes
    const indexes = await electivesCollection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));
    
    // Drop the existing code index if it exists
    try {
      await electivesCollection.dropIndex('code_1');
      console.log('✅ Dropped old code_1 index');
    } catch (error) {
      console.log('ℹ️ code_1 index does not exist or already dropped');
    }

    // Create new sparse unique index on code
    await electivesCollection.createIndex(
      { code: 1 }, 
      { 
        unique: true, 
        sparse: true, // This allows multiple documents without the code field
        name: 'code_1'
      }
    );
    console.log('✅ Created new sparse unique index on code field');

    // Step 4: Verify the fix
    console.log('\n📊 Verification:');
    const totalElectives = await electivesCollection.countDocuments();
    const electivesWithCode = await electivesCollection.countDocuments({ code: { $exists: true } });
    const electivesWithoutCode = totalElectives - electivesWithCode;

    console.log(`Total electives: ${totalElectives}`);
    console.log(`Electives with course codes: ${electivesWithCode}`);
    console.log(`Electives without course codes: ${electivesWithoutCode}`);

    // Check for any remaining invalid codes
    const remainingInvalid = await electivesCollection.countDocuments({
      $or: [
        { code: null },
        { code: 'null' },
        { code: 'undefined' },
        { code: '' }
      ]
    });

    if (remainingInvalid > 0) {
      console.log(`\n⚠️ Warning: ${remainingInvalid} electives still have invalid course codes`);
    } else {
      console.log('\n✅ No invalid course codes remaining!');
    }

    // Show current indexes
    const finalIndexes = await electivesCollection.indexes();
    console.log('\n📋 Final indexes:');
    finalIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key), 
        index.unique ? '(unique)' : '', 
        index.sparse ? '(sparse)' : '');
    });

    console.log('\n✅ Course code fix completed successfully!');
    console.log('\n📝 Summary:');
    console.log('  - Invalid course codes have been removed');
    console.log('  - Sparse unique index has been created');
    console.log('  - Multiple electives can now exist without course codes');
    console.log('  - Course codes that ARE set must still be unique');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run the fix
fixNullCourseCodes();
