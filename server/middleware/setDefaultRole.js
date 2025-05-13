const Role = require('../models/role');  // Adjust the path to the Role model if needed

const setDefaultRole = async (req, res, next) => {
  try {
    // If no role is provided, assign the default Developer role
    if (!req.body.role) {
      const defaultRole = await Role.findOne({ RoleName: 'Developer' });
      if (!defaultRole) {
        return res.status(400).json({ message: 'Default role not found' });
      }

      req.body.role = defaultRole._id; // Assign the ObjectId of the Developer role
    }

    console.log('Assigned role:', req.body.role);  // Check if role is set
    next();
  } catch (error) {
    console.error('Error setting default role:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = setDefaultRole;
