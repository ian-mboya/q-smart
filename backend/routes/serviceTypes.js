const express = require('express');
const ServiceType = require('../models/ServiceType');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// @desc    Get all service types
// @route   GET /api/service-types
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    } else {
      filter.isActive = true;
    }

    const serviceTypes = await ServiceType.find(filter)
      .populate('createdBy', 'name email')
      .sort({ name: 1 });

    res.json({
      status: 'success',
      results: serviceTypes.length,
      data: {
        serviceTypes
      }
    });
  } catch (error) {
    console.error('Get service types error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch service types'
    });
  }
});

// @desc    Get single service type
// @route   GET /api/service-types/:id
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const serviceType = await ServiceType.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!serviceType) {
      return res.status(404).json({
        status: 'error',
        message: 'Service type not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        serviceType
      }
    });
  } catch (error) {
    console.error('Get service type error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch service type'
    });
  }
});

// @desc    Create new service type
// @route   POST /api/service-types
// @access  Private (Admin only)
router.post('/', restrictTo('admin'), async (req, res) => {
  try {
    const { name, description, category, defaultDuration, icon } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Service type name is required'
      });
    }

    // Check if service type with same name already exists
    const existingServiceType = await ServiceType.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });

    if (existingServiceType) {
      return res.status(400).json({
        status: 'error',
        message: 'Service type with this name already exists'
      });
    }

    const serviceType = new ServiceType({
      name,
      description,
      category: category || 'other',
      defaultDuration: defaultDuration || 10,
      icon: icon || '📋',
      createdBy: req.user.id
    });

    await serviceType.save();
    await serviceType.populate('createdBy', 'name email');

    res.status(201).json({
      status: 'success',
      message: 'Service type created successfully',
      data: {
        serviceType
      }
    });
  } catch (error) {
    console.error('Create service type error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to create service type'
    });
  }
});

// @desc    Update service type
// @route   PUT /api/service-types/:id
// @access  Private (Admin only)
router.put('/:id', restrictTo('admin'), async (req, res) => {
  try {
    const { name, description, category, defaultDuration, icon, isActive } = req.body;

    const serviceType = await ServiceType.findById(req.params.id);

    if (!serviceType) {
      return res.status(404).json({
        status: 'error',
        message: 'Service type not found'
      });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== serviceType.name) {
      const existingServiceType = await ServiceType.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: serviceType._id }
      });

      if (existingServiceType) {
        return res.status(400).json({
          status: 'error',
          message: 'Service type with this name already exists'
        });
      }
    }

    // Update fields
    if (name) serviceType.name = name;
    if (description !== undefined) serviceType.description = description;
    if (category) serviceType.category = category;
    if (defaultDuration) serviceType.defaultDuration = defaultDuration;
    if (icon) serviceType.icon = icon;
    if (isActive !== undefined) serviceType.isActive = isActive;

    await serviceType.save();
    await serviceType.populate('createdBy', 'name email');

    res.json({
      status: 'success',
      message: 'Service type updated successfully',
      data: {
        serviceType
      }
    });
  } catch (error) {
    console.error('Update service type error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors
      });
    }
    res.status(500).json({
      status: 'error',
      message: 'Failed to update service type'
    });
  }
});

// @desc    Delete service type
// @route   DELETE /api/service-types/:id
// @access  Private (Admin only)
router.delete('/:id', restrictTo('admin'), async (req, res) => {
  try {
    const serviceType = await ServiceType.findById(req.params.id);

    if (!serviceType) {
      return res.status(404).json({
        status: 'error',
        message: 'Service type not found'
      });
    }

    // Check if service type is being used by any active queues
    const Queue = require('../models/Queue');
    const activeQueues = await Queue.findOne({
      serviceType: serviceType._id,
      isActive: true
    });

    if (activeQueues) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete service type that is being used by active queues'
      });
    }

    await ServiceType.findByIdAndDelete(req.params.id);

    res.json({
      status: 'success',
      message: 'Service type deleted successfully'
    });
  } catch (error) {
    console.error('Delete service type error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete service type'
    });
  }
});

module.exports = router;