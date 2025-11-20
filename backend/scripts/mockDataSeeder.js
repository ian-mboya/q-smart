const mongoose = require('mongoose');
const ServiceType = require('../models/ServiceType');
const Queue = require('../models/Queue');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

const seedMockData = async () => {
  try {
    console.log('🌱 Seeding mock data...');

    // Find or create admin user
    let adminUser = await User.findOne({ email: 'admin@school.edu' });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'School Admin',
        email: 'admin@school.edu',
        password: 'password123',
        role: 'admin',
        phone: '+1234567890'
      });
      console.log('✅ Admin user created');
    }

    // Find or create teacher user
    let teacherUser = await User.findOne({ email: 'teacher@school.edu' });
    if (!teacherUser) {
      teacherUser = await User.create({
        name: 'John Teacher',
        email: 'teacher@school.edu',
        password: 'password123',
        role: 'teacher',
        phone: '+1234567891'
      });
      console.log('✅ Teacher user created');
    }

    // Create service types
    const serviceTypes = [
      {
        name: 'Admissions',
        description: 'Student admissions and enrollment services',
        category: 'academic',
        defaultDuration: 15,
        icon: '🎓',
        createdBy: adminUser._id
      },
      {
        name: 'Counselling',
        description: 'Academic and personal counseling services',
        category: 'support',
        defaultDuration: 30,
        icon: '💬',
        createdBy: adminUser._id
      },
      {
        name: 'Library',
        description: 'Library services and book lending',
        category: 'academic',
        defaultDuration: 10,
        icon: '📚',
        createdBy: adminUser._id
      },
      {
        name: 'Music',
        description: 'Music department and instrument services',
        category: 'extracurricular',
        defaultDuration: 20,
        icon: '🎵',
        createdBy: adminUser._id
      },
      {
        name: 'Sports',
        description: 'Sports equipment and athletic services',
        category: 'extracurricular',
        defaultDuration: 15,
        icon: '⚽',
        createdBy: adminUser._id
      },
      {
        name: 'Fee Payment',
        description: 'Fee payment and financial services',
        category: 'administrative',
        defaultDuration: 8,
        icon: '💰',
        createdBy: adminUser._id
      }
    ];

    await ServiceType.deleteMany({});
    const createdServiceTypes = await ServiceType.insertMany(serviceTypes);
    console.log('✅ Service types created');

    // Create queues
    const queues = [
      {
        name: 'Main Admissions Queue',
        description: 'Primary queue for new student admissions',
        serviceType: createdServiceTypes[0]._id, // Admissions
        location: 'Main Building - Room 101',
        admin: teacherUser._id,
        averageWaitTime: 15,
        settings: {
          meetingDuration: 15,
          maxQueueLength: 30,
          autoCallNext: true
        }
      },
      {
        name: 'Music Practice Room',
        description: 'Queue for music practice room bookings',
        serviceType: createdServiceTypes[3]._id, // Music
        location: 'Arts Building - Room 201',
        admin: teacherUser._id,
        averageWaitTime: 20,
        settings: {
          meetingDuration: 20,
          maxQueueLength: 15,
          autoCallNext: false
        }
      },
      {
        name: 'Library Help Desk',
        description: 'Get assistance with library resources',
        serviceType: createdServiceTypes[2]._id, // Library
        location: 'Library - Ground Floor',
        admin: adminUser._id,
        averageWaitTime: 10,
        settings: {
          meetingDuration: 10,
          maxQueueLength: 25,
          autoCallNext: true
        }
      }
    ];

    await Queue.deleteMany({});
    const createdQueues = await Queue.insertMany(queues);
    console.log('✅ Queues created');

    // Create some sample tickets
    const tickets = [
      {
        ticketNumber: 1,
        queue: createdQueues[0]._id,
        user: adminUser._id,
        status: 'completed',
        position: 1,
        estimatedWaitTime: 15,
        calledAt: new Date(Date.now() - 30 * 60 * 1000),
        completedAt: new Date(Date.now() - 15 * 60 * 1000),
        studentInfo: {
          name: 'Alice Johnson',
          grade: '10A',
          studentId: 'STU001'
        }
      },
      {
        ticketNumber: 2,
        queue: createdQueues[0]._id,
        user: teacherUser._id,
        status: 'called',
        position: 1,
        estimatedWaitTime: 15,
        calledAt: new Date(Date.now() - 5 * 60 * 1000),
        studentInfo: {
          name: 'Bob Smith',
          grade: '11B',
          studentId: 'STU002'
        }
      },
      {
        ticketNumber: 3,
        queue: createdQueues[0]._id,
        user: adminUser._id,
        status: 'waiting',
        position: 2,
        estimatedWaitTime: 30,
        studentInfo: {
          name: 'Carol Davis',
          grade: '9C',
          studentId: 'STU003'
        }
      },
      {
        ticketNumber: 1,
        queue: createdQueues[1]._id,
        user: teacherUser._id,
        status: 'waiting',
        position: 1,
        estimatedWaitTime: 20,
        studentInfo: {
          name: 'David Wilson',
          grade: '12A',
          studentId: 'STU004'
        }
      }
    ];

    await Ticket.deleteMany({});
    await Ticket.insertMany(tickets);
    console.log('✅ Sample tickets created');

    console.log('🎉 Mock data seeding completed!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: admin@school.edu / password123');
    console.log('Teacher: teacher@school.edu / password123');
    
  } catch (error) {
    console.error('❌ Error seeding mock data:', error);
  }
};

module.exports = seedMockData;