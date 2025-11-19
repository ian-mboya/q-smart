#!/usr/bin/env node
/**
 * Quick test script to verify parent-child relationship flow
 */
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function test() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/q-smart');
    console.log('✅ Connected to MongoDB');

    // Find a parent user
    const parent = await User.findOne({ role: 'parent' });
    
    if (!parent) {
      console.log('❌ No parent found in database');
      process.exit(1);
    }

    console.log('\n📋 Parent Info:');
    console.log('  Name:', parent.name);
    console.log('  Email:', parent.email);
    console.log('  ID:', parent._id);
    console.log('  Children array exists?', !!parent.children);
    console.log('  Children count:', parent.children?.length || 0);
    
    if (parent.children && parent.children.length > 0) {
      console.log('\n👶 Children Details:');
      parent.children.forEach((child, i) => {
        console.log(`  Child ${i + 1}:`);
        console.log('    Name:', child.name);
        console.log('    StudentID:', child.studentId);
        console.log('    Grade:', child.grade);
      });

      // Try to find the student users
      console.log('\n🔍 Looking up student users...');
      const childIds = parent.children.map(c => 
        new mongoose.Types.ObjectId(c.studentId || c._id)
      );
      
      const students = await User.find(
        { _id: { $in: childIds } },
        'name email grade createdAt'
      );
      
      console.log('  Found', students.length, 'student(s)');
      students.forEach((student, i) => {
        console.log(`  Student ${i + 1}:`);
        console.log('    Name:', student.name);
        console.log('    Email:', student.email);
        console.log('    Grade:', student.grade);
        console.log('    ID:', student._id);
      });
    } else {
      console.log('⚠️  Parent has no children');
    }

    await mongoose.connection.close();
    console.log('\n✅ Test complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

test();
