const mongoose = require('mongoose');
const request = require('supertest');
const express = require('express');
require('dotenv').config();

console.log('🔍 STAGE 3 VERIFICATION SCRIPT - CORE QUEUE API');
console.log('==================================================\n');

async function verifyStage3() {
  let allTestsPassed = true;
  let server;
  let app;
  let adminToken, teacherToken, parentToken;
  let testQueueId, testTicketId;

  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connection verified');

    // Create test Express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/queues', require('./routes/queues'));
    app.use('/api/tickets', require('./routes/tickets'));

    server = app.listen(0);

    // Step 1: Login as different users
    console.log('1. Authenticating test users...');
    
    // Login as teacher (queue manager)
    let response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sarah@school.edu', password: 'teacher123' });
    
    if (response.status === 200) {
      teacherToken = response.body.data.token;
      console.log('   ✅ Teacher login successful');
    } else {
      console.log('   ❌ Teacher login failed');
      allTestsPassed = false;
    }

    // Login as parent (queue user)
    response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john.parent@email.com', password: 'parent123' });
    
    if (response.status === 200) {
      parentToken = response.body.data.token;
      console.log('   ✅ Parent login successful');
    } else {
      console.log('   ❌ Parent login failed');
      allTestsPassed = false;
    }

    // Step 2: Test Queue CRUD Operations
    console.log('\n2. Testing Queue CRUD operations...');
    
    // Create a queue
    const newQueue = {
      name: 'Verification Test Queue',
      description: 'Queue for stage 3 verification testing',
      serviceType: 'parent-teacher',
      location: 'Room 301',
      averageWaitTime: 12,
      settings: {
        meetingDuration: 15,
        maxQueueLength: 25
      }
    };

    response = await request(app)
      .post('/api/queues')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(newQueue);

    if (response.status === 201) {
      testQueueId = response.body.data.queue._id;
      console.log('   ✅ Queue creation successful');
      console.log('      → Queue ID:', testQueueId);
    } else {
      console.log('   ❌ Queue creation failed:', response.body.message);
      allTestsPassed = false;
    }

    // Get all queues
    response = await request(app)
      .get('/api/queues')
      .set('Authorization', `Bearer ${parentToken}`);

    if (response.status === 200) {
      console.log('   ✅ Get queues successful');
      console.log('      → Found', response.body.results, 'queues');
    } else {
      console.log('   ❌ Get queues failed');
      allTestsPassed = false;
    }

    // Get specific queue
    response = await request(app)
      .get(`/api/queues/${testQueueId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    if (response.status === 200) {
      console.log('   ✅ Get queue by ID successful');
    } else {
      console.log('   ❌ Get queue by ID failed');
      allTestsPassed = false;
    }

    // Step 3: Test Ticket Operations
    console.log('\n3. Testing Ticket operations...');
    
    // Join queue
    response = await request(app)
      .post(`/api/queues/${testQueueId}/join`)
      .set('Authorization', `Bearer ${parentToken}`)
      .send({
        studentInfo: {
          name: 'Emily Johnson',
          grade: 'Grade 10',
          studentId: 'STU001'
        }
      });

    if (response.status === 201) {
      testTicketId = response.body.data.ticket._id;
      console.log('   ✅ Join queue successful');
      console.log('      → Ticket Number:', response.body.data.ticket.ticketNumber);
      console.log('      → Position:', response.body.data.ticket.position);
    } else {
      console.log('   ❌ Join queue failed:', response.body.message);
      allTestsPassed = false;
    }

    // Get user's tickets
    response = await request(app)
      .get('/api/tickets/my-tickets')
      .set('Authorization', `Bearer ${parentToken}`);

    if (response.status === 200 && response.body.results > 0) {
      console.log('   ✅ Get my tickets successful');
    } else {
      console.log('   ❌ Get my tickets failed');
      allTestsPassed = false;
    }

    // Get specific ticket for queue
    response = await request(app)
      .get(`/api/tickets/my-ticket?queue=${testQueueId}`)
      .set('Authorization', `Bearer ${parentToken}`);

    if (response.status === 200) {
      console.log('   ✅ Get my ticket for queue successful');
    } else {
      console.log('   ❌ Get my ticket for queue failed');
      allTestsPassed = false;
    }

    // Step 4: Test Queue Management
    console.log('\n4. Testing queue management operations...');
    
    // Call next ticket
    response = await request(app)
      .post(`/api/queues/${testQueueId}/call-next`)
      .set('Authorization', `Bearer ${teacherToken}`);

    if (response.status === 200) {
      console.log('   ✅ Call next ticket successful');
      console.log('      → Called ticket:', response.body.data.ticket.ticketNumber);
    } else {
      console.log('   ❌ Call next ticket failed:', response.body.message);
      allTestsPassed = false;
    }

    // Update ticket status
    response = await request(app)
      .patch(`/api/tickets/${testTicketId}/status`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ status: 'completed' });

    if (response.status === 200) {
      console.log('   ✅ Update ticket status successful');
    } else {
      console.log('   ❌ Update ticket status failed:', response.body.message);
      allTestsPassed = false;
    }

    // Step 5: Test Analytics
    console.log('\n5. Testing analytics...');
    
    response = await request(app)
      .get(`/api/queues/${testQueueId}/analytics`)
      .set('Authorization', `Bearer ${teacherToken}`);

    if (response.status === 200) {
      console.log('   ✅ Get queue analytics successful');
      const analytics = response.body.data.analytics;
      console.log('      → Total tickets:', analytics.totalTickets);
      console.log('      → Completed today:', analytics.completedToday);
    } else {
      console.log('   ❌ Get queue analytics failed');
      allTestsPassed = false;
    }

    // Step 6: Test Error Cases
    console.log('\n6. Testing error cases and validations...');
    
    // Try to join same queue twice
    response = await request(app)
      .post(`/api/queues/${testQueueId}/join`)
      .set('Authorization', `Bearer ${parentToken}`);

    if (response.status === 400) {
      console.log('   ✅ Cannot join queue twice (validation working)');
    } else {
      console.log('   ❌ Should prevent joining queue twice');
      allTestsPassed = false;
    }

    // Try to create queue without required fields
    response = await request(app)
      .post('/api/queues')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ name: 'Incomplete Queue' });

    if (response.status === 400) {
      console.log('   ✅ Queue validation working (required fields)');
    } else {
      console.log('   ❌ Should validate required queue fields');
      allTestsPassed = false;
    }

  } catch (error) {
    console.log('❌ Stage 3 verification failed:', error.message);
    allTestsPassed = false;
  } finally {
    // Cleanup
    if (server) {
      server.close();
    }

    // Delete test data
    try {
      if (testQueueId) {
        await mongoose.connection.collection('queues').deleteOne({ _id: new mongoose.Types.ObjectId(testQueueId) });
        console.log('   🧹 Cleaned up test queue');
      }
      if (testTicketId) {
        await mongoose.connection.collection('tickets').deleteOne({ _id: new mongoose.Types.ObjectId(testTicketId) });
        console.log('   🧹 Cleaned up test ticket');
      }
    } catch (e) {
      console.log('   ⚠️  Cleanup warning:', e.message);
    }

    await mongoose.connection.close();
  }

  // Final Result
  console.log('\n==================================================');
  if (allTestsPassed) {
    console.log('🎉 STAGE 3 VERIFICATION: ALL TESTS PASSED!');
    console.log('✅ Core Queue API is working correctly');
    console.log('✅ Queue management system is operational');
    console.log('✅ Ready for Stage 4: Parent App MVP');
  } else {
    console.log('❌ STAGE 3 VERIFICATION: SOME TESTS FAILED');
    console.log('⚠️  Please fix the issues above before proceeding');
  }
  console.log('==================================================\n');

  process.exit(allTestsPassed ? 0 : 1);
}

// Run verification
verifyStage3().catch(error => {
  console.error('Verification script error:', error);
  process.exit(1);
});