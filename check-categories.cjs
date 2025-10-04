const mongoose = require('mongoose');

const uri = 'mongodb+srv://sahilsukhdeve12:9KZvfSCe81vTQgJM@cluster0.hqrkb.mongodb.net/elective-selection?retryWrites=true&w=majority';

async function checkCategories() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB\n');

    const electiveSchema = new mongoose.Schema({}, { strict: false });
    const Elective = mongoose.model('Elective', electiveSchema, 'electives');

    console.log('📊 Checking categories in electives collection...\n');
    
    const electives = await Elective.find({}, { category: 1, name: 1 });
    
    console.log(`Found ${electives.length} electives\n`);
    
    const categoriesSet = new Set();
    electives.forEach(elective => {
      if (Array.isArray(elective.category)) {
        elective.category.forEach(cat => categoriesSet.add(cat));
      } else if (elective.category) {
        categoriesSet.add(elective.category);
      }
    });
    
    const uniqueCategories = Array.from(categoriesSet);
    
    console.log('✅ UNIQUE CATEGORIES FOUND:');
    console.log('==========================');
    uniqueCategories.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat}`);
    });
    console.log(`\nTotal: ${uniqueCategories.length} categories\n`);
    
    // Check which are valid for feedback templates
    const VALID_FEEDBACK_CATEGORIES = ['Departmental', 'Open', 'Humanities'];
    console.log('📋 VALID FOR FEEDBACK TEMPLATES:');
    console.log('=================================');
    const validOnes = uniqueCategories.filter(cat => VALID_FEEDBACK_CATEGORIES.includes(cat));
    validOnes.forEach((cat, index) => {
      console.log(`${index + 1}. ${cat} ✅`);
    });
    
    console.log('\n❌ NOT VALID FOR FEEDBACK TEMPLATES:');
    console.log('====================================');
    const invalidOnes = uniqueCategories.filter(cat => !VALID_FEEDBACK_CATEGORIES.includes(cat));
    if (invalidOnes.length === 0) {
      console.log('None - all categories are valid! ✅');
    } else {
      invalidOnes.forEach((cat, index) => {
        console.log(`${index + 1}. ${cat}`);
      });
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('==================');
    if (invalidOnes.length > 0) {
      console.log('To show all categories in feedback templates, add these to:');
      console.log('1. simple-server.cjs (line ~219) - targetCategory enum');
      console.log('2. src/pages/admin/AdminFeedback.tsx (line ~20) - VALID_CATEGORIES');
      console.log('\nAdd these values:', invalidOnes.join(', '));
    } else {
      console.log('All your categories are already valid for feedback templates! 🎉');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkCategories();
