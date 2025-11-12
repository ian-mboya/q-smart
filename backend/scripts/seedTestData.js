const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const testUsers = [
  {
    name: 'School Administrator',
    email: 'admin@school.edu',
    password: 'admin123',
    role: 'admin',
    phone: '+254700000001'
  },
  {
    name: 'Teacher Sarah',
    email: 'sarah@school.edu', 
    password: 'teacher123',
    role: 'teacher',
    phone: '+254700000002'
  },
  {
    name: 'John Parent',
    email: 'john.parent@email.com',
    password: 'parent123', 
    role: 'parent',
    phone: '+254700000003',
    children: [
      {
        name: 'Emily Johnson',
        studentId: 'STU001',
        grade: 'Grade 10'
      }
    ]
  },
  {
    name: 'Mike Student',
    email: 'mike.student@school.edu',
    password: 'student123',
    role: 'student',
    phone: '+254700000004',
    studentId: 'STU002'
  }
];

async function reseedDatabase() {
  try {
    console.log('🔄 Reseeding database...');
    
    // Connect without deprecated options
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear all collections
    const collections = await mongoose.connection.db.collections();
    for (let collection of collections) {
      await collection.deleteMany({});
    }
    console.log('🧹 Cleared all collections');

    // Create users one by one with error handling
    console.log('👥 Creating test users...');
    const createdUsers = [];
    
    for (const userData of testUsers) {
      try {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
        console.log(`   ✅ Created: ${user.email}`);
      } catch (error) {
        console.log(`   ❌ Failed to create ${userData.email}:`, error.message);
      }
    }

    console.log(`\n🎉 Reseeding completed! Created ${createdUsers.length} users`);
    
    // Verify users can be retrieved
    const verifiedUsers = await User.find({});
    console.log(`📊 Verified ${verifiedUsers.length} users in database`);
    
    // Test login for each user
    console.log('\n🔐 Testing logins:');
    for (const user of verifiedUsers) {
      const userWithPassword = await User.findById(user._id).select('+password');
      const isMatch = await userWithPassword.correctPassword(testUsers.find(u => u.email === user.email).password);
      console.log(`   ${user.email}: ${isMatch ? '✅ Login works' : '❌ Login fails'}`);
    }

    console.log('\n📋 Test Credentials:');
    console.log('Admin:    admin@school.edu / admin123');
    console.log('Teacher:  sarah@school.edu / teacher123'); 
    console.log('Parent:   john.parent@email.com / parent123');
    console.log('Student:  mike.student@school.edu / student123');

  } catch (error) {
    console.error('❌ Reseeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
  }
}

// Run if called directly
if (require.main === module) {
  reseedDatabase().then(() => process.exit(0));
}

module.exports = reseedDatabase;