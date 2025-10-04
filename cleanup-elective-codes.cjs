// Database cleanup script for elective course codes
// Run this script to fix any existing electives with empty/null course codes
// Usage: node cleanup-elective-codes.cjs

const mongoose = require('mongoose');

// MongoDB connection string - update this with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elective-selection';

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const electiveSchema = new mongoose.Schema({}, { strict: false });
const Elective = mongoose.model('Elective', electiveSchema);

async function cleanupElectiveCodes() {
  try {
    console.log('🔍 Searching for electives with empty/null course codes...');
    
    // Find all electives with problematic code values
    const problematicElectives = await Elective.find({
      $or: [
        { code: "" },          // Empty string
        { code: "null" },      // String "null"
        { code: "undefined" }, // String "undefined"
        { code: null }         // Actual null
      ]
    });

    console.log(`📊 Found ${problematicElectives.length} elective(s) with problematic course codes`);

    if (problematicElectives.length === 0) {
      console.log('✅ No cleanup needed! All course codes are properly formatted.');
      return;
    }

    // Display the electives that will be updated
    console.log('\n📋 Electives to be updated:');
    problematicElectives.forEach((elective, index) => {
      console.log(`  ${index + 1}. ${elective.name} (ID: ${elective._id})`);
      console.log(`     Current code: "${elective.code}" (${typeof elective.code})`);
    });

    console.log('\n🔧 Updating electives...');

    // Update all problematic electives by unsetting the code field
    const result = await Elective.updateMany(
      {
        $or: [
          { code: "" },
          { code: "null" },
          { code: "undefined" },
          { code: null }
        ]
      },
      { 
        $unset: { code: "" } // This removes the field entirely (sets to undefined)
      }
    );

    console.log(`✅ Successfully updated ${result.modifiedCount} elective(s)`);
    console.log(`   - Matched: ${result.matchedCount}`);
    console.log(`   - Modified: ${result.modifiedCount}`);

    // Verify the update
    console.log('\n🔍 Verifying update...');
    const remainingProblematic = await Elective.countDocuments({
      $or: [
        { code: "" },
        { code: "null" },
        { code: "undefined" },
        { code: null }
      ]
    });

    if (remainingProblematic === 0) {
      console.log('✅ Verification successful! All problematic codes have been cleaned up.');
    } else {
      console.log(`⚠️  Warning: ${remainingProblematic} elective(s) still have problematic codes.`);
    }

    // Show summary of all electives
    console.log('\n📊 Current database status:');
    const totalElectives = await Elective.countDocuments();
    const electivesWithCode = await Elective.countDocuments({ code: { $exists: true, $ne: null } });
    const electivesWithoutCode = totalElectives - electivesWithCode;

    console.log(`   Total electives: ${totalElectives}`);
    console.log(`   With course code: ${electivesWithCode}`);
    console.log(`   Without course code: ${electivesWithoutCode}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('\n👋 MongoDB connection closed');
  }
}

// Run the cleanup
cleanupElectiveCodes()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Cleanup failed:', err);
    process.exit(1);
  });
