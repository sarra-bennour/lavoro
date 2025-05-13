// utils/roleCheck.js
const User = require('../models/user');
const Role = require('../models/role');

exports.isManager = async (userId) => {
  try {
    const user = await User.findById(userId).populate('role');
    if (!user || !user.role) return false;
    
    // Check if user has manager role (Team Manager or Project Manager)
    const managerRoles = await Role.find({
      RoleName: { $in: ['Team Manager', 'Project Manager'] }
    });
    
    return managerRoles.some(role => role._id.equals(user.role._id));
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
};