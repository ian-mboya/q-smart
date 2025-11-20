const mongoose = require('mongoose');
const ServiceType = require('../models/ServiceType');
const User = require('../models/User'); // Assuming you have a User model

const seedServiceTypes = async (adminUserId) => {
  const serviceTypes = [
    {
      name: 'Admissions',
      description: 'Student admissions and enrollment services',
      category: 'academic',
      defaultDuration: 15,
      icon: '🎓',
      createdBy: adminUserId
    },
    {
      name: 'Counselling',
      description: 'Academic and personal counseling services',
      category: 'support',
      defaultDuration: 30,
      icon: '💬',
      createdBy: adminUserId
    },
    {
      name: 'Library',
      description: 'Library services and book lending',
      category: 'academic',
      defaultDuration: 10,
      icon: '📚',
      createdBy: adminUserId
    },
    {
      name: 'Fee Payment',
      description: 'Fee payment and financial services',
      category: 'administrative',
      defaultDuration: 8,
      icon: '💰',
      createdBy: adminUserId
    },
    {
      name: 'Parent Teacher',
      description: 'Parent-teacher meetings and discussions',
      category: 'academic',
      defaultDuration: 15,
      icon: '👨‍👩‍👧‍👦',
      createdBy: adminUserId
    },
    {
      name: 'Administration',
      description: 'General administrative services',
      category: 'administrative',
      defaultDuration: 10,
      icon: '🏛️',
      createdBy: adminUserId
    },
    {
      name: 'Music',
      description: 'Music department and instrument services',
      category: 'extracurricular',
      defaultDuration: 20,
      icon: '🎵',
      createdBy: adminUserId
    },
    {
      name: 'Sports',
      description: 'Sports equipment and athletic services',
      category: 'extracurricular',
      defaultDuration: 15,
      icon: '⚽',
      createdBy: adminUserId
    }
  ];

  try {
    await ServiceType.deleteMany({});
    await ServiceType.insertMany(serviceTypes);
    console.log('Service types seeded successfully');
  } catch (error) {
    console.error('Error seeding service types:', error);
  }
};

module.exports = seedServiceTypes;