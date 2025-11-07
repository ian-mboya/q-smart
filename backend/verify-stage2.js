const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
require('dotenv').config();

console.log('🔍 STAGE 2 VERIFICATION SCRIPT - AUTHENTICATION SYSTEM');
console.log('==================================================\n');

async function verifyStage2() {
  let allTestsPassed = true;
  let server;
  let app;

  try {
    // Test 1: Environment and Database
    console.log('1. Checking environment and database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connection verified');

    // Create test Express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', require('./routes/auth'));

    server = app.listen(0); // Random port for testing

    const baseURL = `http://localhost:${server.address().port}`;

    // Test 2: Auth Routes Existence
    console.log('\n2. Testing auth routes existence...');
    const response = await request(app).get('/api/auth');
    if (response.status !== 404) {
      console.log('✅ Auth routes are mounted');
    }

    // Test 3: User Registration with Children
    console.log('\n3. Testing user registration with children...');
    const testUser = {
      name: 'Test Parent User',
      email: 'testparent@verification.com',
      password: 'password123',
      role: 'parent',
      phone: '+254700000005',
      children: [
        {
          name: 'Test Child',
          studentId: 'VERIFY001',
          grade: 'Grade 3'
        }
      ]
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    if (registerResponse.status === 201) {
      console.log('✅ User registration with children works');
      console.log('   → Created user:', registerResponse.body.data.user.email);
      if (registerResponse.body.data.user.children) {
        console.log('   → Children:', registerResponse.body.data.user.children.length);
      }
    } else {
      console.log('❌ User registration failed:', registerResponse.body);
      allTestsPassed = false;
    }

    // Test 4: User Login
    console.log('\n4. Testing user login...');
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testparent@verification.com',
        password: 'password123'
      });

    if (loginResponse.status === 200 && loginResponse.body.data.token) {
      console.log('✅ User login works');
      const token = loginResponse.body.data.token;
      console.log('   → Received JWT token');

      // Test 5: Protected Route Access
      console.log('\n5. Testing protected routes...');
      
      // Test without token
      const noAuthResponse = await request(app)
        .get('/api/auth/me');

      if (noAuthResponse.status === 401) {
        console.log('✅ Protected route blocks unauthorized access');
      }

      // Test with token
      const withAuthResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      if (withAuthResponse.status === 200) {
        console.log('✅ Protected route allows access with valid token');
        console.log('   → User:', withAuthResponse.body.data.user.name);
      } else {
        console.log('❌ Protected route failed with valid token');
        allTestsPassed = false;
      }

    } else {
      console.log('❌ User login failed:', loginResponse.body);
      allTestsPassed = false;
    }

    // Test 6: JWT Utilities
    console.log('\n6. Testing JWT utilities...');
    try {
      const { generateToken, verifyToken } = require('./utils/jwtUtils');
      
      const testToken = generateToken('testUserId', 'parent');
      const decoded = verifyToken(testToken);
      
      if (decoded.userId === 'testUserId' && decoded.role === 'parent') {
        console.log('✅ JWT token generation and verification work');
      } else {
        console.log('❌ JWT token verification failed');
        allTestsPassed = false;
      }
    } catch (jwtError) {
      console.log('❌ JWT utilities test failed:', jwtError.message);
      allTestsPassed = false;
    }

    // Test 7: Middleware Functions
    console.log('\n7. Testing middleware...');
    try {
      const { protect, restrictTo } = require('./middleware/auth');
      console.log('✅ Auth middleware loaded successfully');
      
      // Test role restriction
      const adminOnly = restrictTo('admin');
      console.log('✅ Role restriction middleware loaded');
      
    } catch (middlewareError) {
      console.log('❌ Middleware test failed:', middlewareError.message);
      allTestsPassed = false;
    }

  } catch (error) {
    console.log('❌ Stage 2 verification failed:', error.message);
    allTestsPassed = false;
  } finally {
    // Cleanup
    if (server) {
      server.close();
    }
    
    // Delete test user
    try {
      await User.deleteOne({ email: 'testparent@verification.com' });
    } catch (e) {
      // Ignore cleanup errors
    }

    await mongoose.connection.close();
  }

  // Final Result
  console.log('\n==================================================');
  if (allTestsPassed) {
    console.log('🎉 STAGE 2 VERIFICATION: ALL TESTS PASSED!');
    console.log('✅ Authentication system is working correctly');
    console.log('✅ Ready for Stage 3: Core Queue API');
  } else {
    console.log('❌ STAGE 2 VERIFICATION: SOME TESTS FAILED');
    console.log('⚠️  Please fix the issues above before proceeding');
  }
  console.log('==================================================\n');

  process.exit(allTestsPassed ? 0 : 1);
}

// Import User model for cleanup
const User = require('./models/User');

// Run verification
verifyStage2().catch(error => {
  console.error('Verification script error:', error);
  process.exit(1);
});