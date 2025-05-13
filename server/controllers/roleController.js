const Role = require('../models/role');


// Create a new role
exports.createRole = async (req, res) => {
  try {
    const role = new Role(req.body);
    await role.save();
    res.status(201).json(role);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.status(200).json(roles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a role by ID
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.status(200).json(role);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a role
exports.updateRole = async (req, res) => {
  try {
    const updatedRole = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRole) return res.status(404).json({ message: 'Role not found' });
    res.status(200).json(updatedRole);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a role
exports.deleteRole = async (req, res) => {
  try {
    const deletedRole = await Role.findByIdAndDelete(req.params.id);
    if (!deletedRole) return res.status(404).json({ message: 'Role not found' });
    res.status(200).json({ message: 'Role deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a role by name
exports.getRoleByName = async (req, res) => {
  try {
    const roleName = req.params.name;
    const role = await Role.findOne({ RoleName: roleName });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: `Role with name "${roleName}" not found`
      });
    }

    res.status(200).json(role);
  } catch (error) {
    console.error('Error fetching role by name:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching role',
      error: error.message
    });
  }
};