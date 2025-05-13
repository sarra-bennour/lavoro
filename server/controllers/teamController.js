
const Team = require('../models/team');
const Project = require('../models/Project');
const User = require('../models/user');
const TeamHistory = require('../models/teamHistory');
const TeamArchive = require('../models/teamArchive');
const TeamMemberArchive = require('../models/teamMemberArchive');
const ExcelJS = require('exceljs');
const Role = require('../models/role');
const TeamMember = require('../models/teamMember');


exports.createTeam = async (req, res) => {
  try {
    // 1. Basic Validation
    if (!req.body.name || !req.body.project_id) {
      return res.status(400).json({ message: 'Team name and project ID are required' });
    }

    const managerId = req.session.user._id;
    if (!managerId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // 2. Prepare members list (always include manager)
    const members = [...new Set([
      ...(req.body.members || []),
      managerId.toString() // Ensure string ID
    ])];

    // 3. Get required roles
    const [developerRole, teamManagerRole] = await Promise.all([
      Role.findOne({ RoleName: 'Developer' }),
      Role.findOne({ RoleName: 'Team Manager' })
    ]);

    if (!developerRole || !teamManagerRole) {
      return res.status(500).json({
        message: 'System roles not configured',
        solution: 'Please ensure Developer and Team Manager roles exist in database'
      });
    }

    // 4. Create Team (without members array)
    const team = new Team({
      name: req.body.name,
      manager_id: managerId,
      project_id: req.body.project_id,
      capacity: req.body.capacity || 0,
      description: req.body.description || '',
      tags: req.body.tags || [],
      color: req.body.color || '#3755e6'
    });

    const savedTeam = await team.save();

    // 5. Create TeamMember entries
    const teamMemberDocs = members.map(memberId => ({
      team_id: savedTeam._id,
      user_id: memberId,
      role: memberId === managerId.toString() ? teamManagerRole._id : developerRole._id,
      joined_at: new Date()
    }));

    await TeamMember.insertMany(teamMemberDocs);

    // 6. Return response with populated members
    const populatedMembers = await TeamMember.find({ team_id: savedTeam._id })
      .populate('user_id', 'firstName lastName email')
      .populate('role', 'RoleName');

    res.status(201).json({
      success: true,
      data: {
        ...savedTeam.toObject(),
        members: populatedMembers.map(member => ({
          user_id: member.user_id,
          role: member.role.RoleName,
          joined_at: member.joined_at
        }))
      },
      message: 'Team created successfully'
    });

  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        message: 'Team name already exists for this project'
      });
    }

    console.error('Team creation error:', error);
    res.status(500).json({
      message: 'Failed to create team',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


exports.getAllTeams = async (req, res) => {
  try {
    // Get all teams with populated references
    const teams = await Team.find()
      .populate('manager_id', 'firstName lastName email') // Populate manager details
      .populate('project_id', 'name description') // Populate project details
      .sort({ created_at: -1 }); // Sort by newest first

    // Get team members from TeamMember collection for each team
    const teamsWithMembers = await Promise.all(teams.map(async (team) => {
      const teamObj = team.toObject();

      // Find all team members for this team
      const teamMembers = await TeamMember.find({ team_id: team._id })
        .populate('user_id', 'firstName lastName email image')
        .populate('role', 'RoleName');

      // Add members to the team object
      teamObj.members = teamMembers.map(member => ({
        _id: member.user_id._id,
        firstName: member.user_id.firstName,
        lastName: member.user_id.lastName,
        email: member.user_id.email,
        image: member.user_id.image,
        role: member.role.RoleName
      }));

      return teamObj;
    }));

    res.status(200).json({
      success: true,
      count: teamsWithMembers.length,
      data: teamsWithMembers
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch teams',
      error: error.message
    });
  }
};
exports.getTeamById = async (req, res) => {
  try {
    // Get the team without members
    const team = await Team.findById(req.params.id)
      .populate('manager_id', 'firstName lastName email image phone_number')
      .populate('project_id', 'name description');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Get team members from TeamMember collection
    const teamMembers = await TeamMember.find({ team_id: team._id })
      .populate('user_id', 'firstName lastName email image role')
      .populate('role', 'RoleName');

    // Convert to plain object to add members
    const teamObj = team.toObject();

    // Add members to the team object
    teamObj.members = teamMembers.map(member => ({
      _id: member.user_id._id,
      firstName: member.user_id.firstName,
      lastName: member.user_id.lastName,
      email: member.user_id.email,
      image: member.user_id.image,
      role: member.role.RoleName
    }));

    res.status(200).json({
      success: true,
      data: teamObj
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team',
      error: error.message
    });
  }
};
exports.updateTeam = async (req, res) => {
  try {
      const { id } = req.params;
      const updates = req.body;
      const userId = req.session?.user?._id || req.user?._id;

      // Validate required fields
      if (!updates?.name?.trim()) {
          return res.status(400).json({
              success: false,
              message: 'Team name is required and cannot be empty'
          });
      }

      // Get existing team
      const existingTeam = await Team.findById(id);

      // Get current team members from TeamMember collection
      const currentTeamMembers = await TeamMember.find({ team_id: id })
          .populate('user_id', '_id');
      if (!existingTeam) {
          return res.status(404).json({
              success: false,
              message: 'Team not found'
          });
      }

      // Remove restricted fields
      const restrictedFields = ['project_id', 'manager_id', '_id'];
      restrictedFields.forEach(field => {
          if (updates[field]) delete updates[field];
      });

      // Process members if provided
      if (updates.members) {
          // Validate members array
          if (!Array.isArray(updates.members)) {
              return res.status(400).json({
                  success: false,
                  message: 'Members must be provided as an array'
              });
          }

          // Convert all IDs to strings and remove duplicates
          const newMemberIds = [...new Set(updates.members.map(m => m.toString()))];
          const currentMemberIds = currentTeamMembers.map(m => m.user_id._id.toString());

          // Ensure manager is always included
          const managerId = existingTeam.manager_id.toString();
          if (!newMemberIds.includes(managerId)) {
              newMemberIds.push(managerId);
          }

          // Find differences
          const addedMemberIds = newMemberIds.filter(id => !currentMemberIds.includes(id));
          const removedMemberIds = currentMemberIds.filter(id => !newMemberIds.includes(id));

          // Process additions
          if (addedMemberIds.length > 0) {
              const developerRole = await Role.findOne({ RoleName: 'Developer' });
              if (!developerRole) {
                  return res.status(400).json({
                      success: false,
                      message: 'Developer role not found in system'
                  });
              }

              // Validate members exist
              const existingUsers = await User.countDocuments({
                  _id: { $in: addedMemberIds }
              });

              if (existingUsers !== addedMemberIds.length) {
                  return res.status(400).json({
                      success: false,
                      message: 'One or more member IDs are invalid'
                  });
              }

              // Create TeamMember entries
              const memberDocs = addedMemberIds.map(memberId => ({
                  team_id: id,
                  user_id: memberId,
                  role: developerRole._id,
                  joined_at: new Date()
              }));

              await TeamMember.insertMany(memberDocs);

              // Log history for each addition
              await Promise.all(addedMemberIds.map(memberId =>
                  TeamHistory.create({
                      team_id: id,
                      changed_by: userId,
                      change_type: 'Member Added',
                      new_value: memberId,
                      additional_info: {
                          action: 'Added to team',
                          by_user: userId
                      },
                      changed_at: new Date()
                  })
              ));
          }

          // Process removals
          if (removedMemberIds.length > 0) {
              // Don't allow removing manager
              if (removedMemberIds.includes(managerId)) {
                  return res.status(400).json({
                      success: false,
                      message: 'Cannot remove team manager from members'
                  });
              }

              await TeamMember.deleteMany({
                  team_id: id,
                  user_id: { $in: removedMemberIds }
              });

              // Log history for each removal
              await Promise.all(removedMemberIds.map(memberId =>
                  TeamHistory.create({
                      team_id: id,
                      changed_by: userId,
                      change_type: 'Member Removed',
                      old_value: memberId,
                      additional_info: {
                          action: 'Removed from team',
                          by_user: userId
                      },
                      changed_at: new Date()
                  })
              ));
          }

          // Remove members from updates since we handle them separately
          delete updates.members;
      }

      // Add update timestamp
      updates.updated_at = new Date();

      // Update the team document
      const updatedTeam = await Team.findByIdAndUpdate(
          id,
          { $set: updates },
          {
              new: true,
              runValidators: true
          }
      )
      .populate('manager_id', 'firstName lastName email')
      .populate('project_id', 'name description');

      if (!updatedTeam) {
          return res.status(404).json({
              success: false,
              message: 'Team not found after update'
          });
      }

      // Get updated team members
      const updatedTeamMembers = await TeamMember.find({ team_id: id })
          .populate('user_id', 'firstName lastName email image')
          .populate('role', 'RoleName');

      // Convert to plain object to add members
      const updatedTeamObj = updatedTeam.toObject();

      // Add members to the team object
      updatedTeamObj.members = updatedTeamMembers.map(member => ({
          _id: member.user_id._id,
          firstName: member.user_id.firstName,
          lastName: member.user_id.lastName,
          email: member.user_id.email,
          image: member.user_id.image,
          role: member.role.RoleName
      }));

      // Log general team update
      await TeamHistory.create({
          team_id: id,
          changed_by: userId,
          change_type: 'Team Updated',
          old_value: {
              name: existingTeam.name,
              description: existingTeam.description,
              tags: existingTeam.tags,
              color: existingTeam.color,
              capacity: existingTeam.capacity
          },
          new_value: {
              name: updates.name,
              description: updates.description,
              tags: updates.tags,
              color: updates.color,
              capacity: updates.capacity
          },
          changed_at: new Date()

      });

      res.status(200).json({
          success: true,
          data: updatedTeamObj,
          message: 'Team updated successfully'
      });

  } catch (error) {
      console.error('Team update error:', error);

      if (error.name === 'ValidationError') {
          const messages = Object.values(error.errors).map(val => val.message);
          return res.status(400).json({
              success: false,
              message: 'Validation error',
              errors: messages
          });
      }

      if (error.code === 11000) {
          return res.status(400).json({
              success: false,
              message: 'Team with this name already exists'
          });
      }

      res.status(500).json({
          success: false,
          message: 'Server error while updating team',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};
exports.deleteTeam = async (req, res) => {
  try {
    const teamId = req.params.id;

    // Check if team exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Get user from session (same as createTeam)
    const userId = req.session.user._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Find user in database
    const user = await User.findById(userId).populate('role');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Authorization check - same logic as createTeam
    const isAdmin = user.role?.RoleName === 'Admin';
    const isTeamManager = user.role?.RoleName === 'Team Manager';
    const isTeamOwner = userId.toString() === team.manager_id.toString();

    if (!isAdmin && !isTeamManager && !isTeamOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this team'
      });
    }

    // Delete the team
    await Team.findByIdAndDelete(teamId);

    // Remove team reference from project
    if (team.project_id) {
      await Project.findByIdAndUpdate(
        team.project_id,
        { $pull: { teams: teamId } }
      );
    }

    res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete team',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
exports.searchTeams = async (req, res) => {
  try {
    const { status, project, tags, sort, page = 1, limit = 8 } = req.query;

    // Build the query
    const query = {};

    // Status filter
    if (status) {
      const statusArray = status.split(',');
      query.status = { $in: statusArray };
    }

    // Project filter
    if (project) {
      const projectArray = project.split(',');
      query.project_id = { $in: projectArray };
    }

    // Tags filter - using $all to match teams that have ALL selected tags
    if (tags) {
      const tagsArray = tags.split(',');
      query.tags = { $all: tagsArray };
    }

    // Sort options
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'name-asc') sortOption = { name: 1 };
    else if (sort === 'name-desc') sortOption = { name: -1 };

    // Pagination
    const skip = (page - 1) * limit;

    // Get teams with populated fields
    const teams = await Team.find(query)
      .populate('manager_id', 'firstName lastName email image')
      .populate('project_id', 'name description')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    // Get team members for each team
    const teamsWithMembers = await Promise.all(teams.map(async (team) => {
      const teamObj = team.toObject();

      // Find all team members for this team
      const teamMembers = await TeamMember.find({ team_id: team._id })
        .populate('user_id', 'firstName lastName email image role status')
        .populate('role', 'RoleName');

      // Add members to the team object
      teamObj.members = teamMembers.map(member => ({
        _id: member.user_id._id,
        firstName: member.user_id.firstName,
        lastName: member.user_id.lastName,
        email: member.user_id.email,
        image: member.user_id.image,
        role: member.role.RoleName,
        status: member.user_id.status
      }));

      return teamObj;
    }));

    // Count total teams for pagination
    const total = await Team.countDocuments(query);

    res.status(200).json({
      success: true,
      data: teamsWithMembers,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Team search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search teams',
      error: error.message
    });
  }
};

exports.getTeamStats = async (req, res) => {
  try {
    const totalTeams = await Team.countDocuments();

    const teamsByProject = await Team.aggregate([
      { $group: { _id: "$project_id", count: { $sum: 1 } } },
      {
        $lookup: {
          from: "projects",
          localField: "_id",
          foreignField: "_id",
          as: "project"
        }
      },
      { $unwind: "$project" },
      {
        $project: {
          projectName: "$project.name",
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalTeams,
        teamsByProject
      }
    });

  } catch (error) {
    console.error('Error fetching team stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch team statistics'
    });
  }
};

exports.getProjectCountPerTeamManager = async (req, res) => {
  try {
    const result = await Project.aggregate([
      {
        $group: {
          _id: "$ProjectManager_id",
          projectCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          projectCount: 1
        }
      }
    ]);

    res.status(200).json({ projectCount: result[0]?.projectCount || 0 });

  } catch (err) {
    console.error("Error while counting projects per Team Manager:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getMembersWithPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const roleName = req.query.role;
    const teamId = req.query.team_id;
    const skip = (page - 1) * limit;

    // Build the query
    const query = {};

    // Filter by role if provided
    if (roleName) {
      const roleDoc = await Role.findOne({ RoleName: roleName });
      if (!roleDoc) {
        return res.status(400).json({
          success: false,
          message: `Role '${roleName}' not found`
        });
      }
      query.role = roleDoc._id;
    }

    // Filter by team if provided
    if (teamId) {
      // Verify team exists
      const teamExists = await Team.findById(teamId);
      if (!teamExists) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }
      query.team_id = teamId;
    }

    // Get total count for pagination
    const total = await TeamMember.countDocuments(query);

    // Get team members with pagination
    const members = await TeamMember.find(query)
      .populate('user_id', 'firstName lastName email image')
      .populate('role', 'RoleName')
      .populate('team_id', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ joined_at: -1 });

    // Format the response with null checks
    const formattedMembers = members.map(member => {
      // Check if populated fields exist
      const user = member.user_id ? {
        _id: member.user_id._id,
        firstName: member.user_id.firstName,
        lastName: member.user_id.lastName,
        email: member.user_id.email,
        image: member.user_id.image
      } : null;

      const role = member.role ? member.role.RoleName : null;

      const team = member.team_id ? {
        _id: member.team_id._id,
        name: member.team_id.name
      } : null;

      return {
        _id: member._id,
        user,
        role,
        team,
        joined_at: member.joined_at,
        status: member.status || 'active' // Adding default status if not present
      };
    });

    // Filter out any members that are missing required data if needed
    const validMembers = formattedMembers.filter(member => 
      member.user && member.role && member.team
    );

    res.status(200).json({
      success: true,
      data: validMembers,
      total,
      page,
      pages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching team members:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error while fetching team members',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
// Route pour compter les développeurs
exports.countDeveloper = async (req, res) => {
  const count = await Member.countDocuments({ 'role.RoleName': 'Developer' });
  res.json({ count });
};

// Route pour récupérer les développeurs avec pagination
exports.getDeveloper = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const developers = await Member.find({ 'role.RoleName': 'Developer' })
    .skip((page - 1) * limit)
    .limit(limit);
  const count = await Member.countDocuments({ 'role.RoleName': 'Developer' });
  res.json({
    data: developers,
    total: count,
    pages: Math.ceil(count / limit)
  });
};

  exports.searchTeams = async (req, res) => {
    try {
      const { status, project, tags, sort, page = 1, limit = 8 } = req.query;

      // Build the query
      const query = {};

      // Status filter
      if (status) {
        const statusArray = status.split(',');
        query.status = { $in: statusArray };
      }

      // Project filter
      if (project) {
        const projectArray = project.split(',');
        query.project_id = { $in: projectArray };
      }

      // Tags filter - using $all to match teams that have ALL selected tags
      if (tags) {
        const tagsArray = tags.split(',');
        query.tags = { $all: tagsArray };
      }

      // Sort options
      let sortOption = { createdAt: -1 }; // Default: newest first
      if (sort === 'oldest') sortOption = { createdAt: 1 };
      else if (sort === 'name-asc') sortOption = { name: 1 };
      else if (sort === 'name-desc') sortOption = { name: -1 };

      // Pagination
      const skip = (page - 1) * limit;

      // Get teams with populated fields
      const teams = await Team.find(query)
        .populate('manager_id', 'firstName lastName email image')
        .populate('project_id', 'name description')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit));

      // Get team members for each team
      const teamsWithMembers = await Promise.all(teams.map(async (team) => {
        const teamObj = team.toObject();

        // Find all team members for this team
        const teamMembers = await TeamMember.find({ team_id: team._id })
          .populate('user_id', 'firstName lastName email image role status')
          .populate('role', 'RoleName');

        // Add members to the team object
        teamObj.members = teamMembers.map(member => ({
          _id: member.user_id._id,
          firstName: member.user_id.firstName,
          lastName: member.user_id.lastName,
          email: member.user_id.email,
          image: member.user_id.image,
          role: member.role.RoleName,
          status: member.user_id.status
        }));

        return teamObj;
      }));

      // Count total teams for pagination
      const total = await Team.countDocuments(query);

      res.status(200).json({
        success: true,
        data: teamsWithMembers,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error('Team search error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to search teams',
        error: error.message
      });
    }
  };

  exports.archiveTeam = async (req, res) => {
    const { id } = req.params;

    try {
      // Try to get user ID from various possible sources
      const userId = req.session?.user?._id || req.user?._id || req.body?.changed_by;

      // Log the authentication attempt
      console.log('Authentication check:', {
        sessionUser: req.session?.user?._id,
        reqUser: req.user?._id,
        bodyChangedBy: req.body?.changed_by,
        headers: req.headers?.authorization ? 'Authorization header present' : 'No auth header'
      });

      // Use a default user ID if none is found (for development/testing)
      const effectiveUserId = userId || '000000000000000000000000';
      console.log('Archiving team with ID:', id, 'by user:', effectiveUserId);

      // 1. Find the team with its project
      const team = await Team.findById(id).populate('project_id', 'status');

      if (!team) {
        return res.status(404).json({
          success: false,
          message: 'Team not found'
        });
      }

      // 2. Check if project is in progress
      if (team.project_id?.status === 'In Progress') {
        return res.status(400).json({
          success: false,
          message: 'Cannot archive team with project in progress'
        });
      }

      // 3. Delete existing archive if any
      await TeamArchive.deleteOne({ _id: id });

      // 4. Create new archive (without members field)
      const teamObj = team.toObject();
      delete teamObj.members; // Remove members field if it exists

      const archive = new TeamArchive({
        ...teamObj,
        originalStatus: team.status,
        originalColor: team.color, // Store the original color
        status: 'Archived',
        color: '#4b4b4b'
      });

      // Save the archive
      const savedArchive = await archive.save();
      console.log('Team archived successfully:', savedArchive._id);

      // Create history record
      try {
        await TeamHistory.create({
          team_id: team._id,
          change_type: 'Team Archived',
          old_value: 'Active',
          new_value: 'Archived',
          changed_at: new Date(),
          changed_by: effectiveUserId
        });
        console.log('Team history record created');
      } catch (historyError) {
        console.error('Error creating team history:', historyError);
        // Continue with the process even if history creation fails
      }

      // 5. Delete original team
      const deleteResult = await Team.findByIdAndDelete(id);
      console.log('Original team deleted:', !!deleteResult);

      // 6. Archive team members instead of deleting them
      // First, get all team members
      const teamMembers = await TeamMember.find({ team_id: id })
        .populate('user_id', 'firstName lastName email image')
        .populate('role');

      console.log(`Found ${teamMembers.length} team members to archive`);

      // Archive each team member
      if (teamMembers.length > 0) {
        const archivePromises = teamMembers.map(async (member) => {
          const memberData = member.toObject();
          delete memberData._id; // Remove the original ID

          // Create archive record
          const archivedMember = new TeamMemberArchive({
            ...memberData,
            team_id: id, // Keep the same team ID
            archived_at: new Date()
          });

          return archivedMember.save();
        });

        // Wait for all archives to complete
        await Promise.all(archivePromises);
        console.log(`Archived ${teamMembers.length} team members`);
      }

      // Now delete the original team members
      const teamMemberDeleteResult = await TeamMember.deleteMany({ team_id: id });
      console.log('Original team members deleted:', teamMemberDeleteResult.deletedCount);

      // Verify the team was deleted
      const teamStillExists = await Team.findById(id);
      if (teamStillExists) {
        console.error('Team still exists after deletion attempt');
        return res.status(500).json({
          success: false,
          message: 'Failed to delete team from active list'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Team archived successfully'
      });
    } catch (error) {
      console.error('Archive error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };
  exports.getAllArchivedTeams = async (_, res) => {
    try {
      const archivedTeams = await TeamArchive.find({})
        .populate('manager_id', 'firstName lastName email image')
        .populate('project_id', 'name description')
        .sort({ updated_at: -1 }); // Sort by most recently archived

      // Get all archived team members
      const allArchivedMembers = await TeamMemberArchive.find()
        .populate('user_id', 'firstName lastName email image role')
        .populate('role', 'RoleName');

      console.log(`Found ${allArchivedMembers.length} total archived team members`);

      // Group members by team ID
      const membersByTeam = {};
      allArchivedMembers.forEach(member => {
        const teamId = member.team_id.toString();
        if (!membersByTeam[teamId]) {
          membersByTeam[teamId] = [];
        }
        membersByTeam[teamId].push({
          _id: member.user_id._id,
          firstName: member.user_id.firstName,
          lastName: member.user_id.lastName,
          email: member.user_id.email,
          image: member.user_id.image,
          role: member.role.RoleName
        });
      });

      // Add members to each team
      const archivedTeamsWithMembers = archivedTeams.map(team => {
        const teamObj = team.toObject();
        const teamId = team._id.toString();
        teamObj.members = membersByTeam[teamId] || [];
        return teamObj;
      });

      // Return in the same format as regular teams list
      res.status(200).json({
        success: true,
        count: archivedTeamsWithMembers.length,
        data: archivedTeamsWithMembers
      });
    } catch (error) {
      console.error('Error fetching archived teams:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch archived teams',
        error: error.message
      });
    }
  };

  exports.unarchiveTeam = async (req, res) => {
    const { id } = req.params;

    try {
      // Try to get user ID from various possible sources
      const userId = req.session?.user?._id || req.user?._id || req.body?.changed_by;

      // Log the authentication attempt
      console.log('Authentication check for unarchive:', {
        sessionUser: req.session?.user?._id,
        reqUser: req.user?._id,
        bodyChangedBy: req.body?.changed_by,
        headers: req.headers?.authorization ? 'Authorization header present' : 'No auth header'
      });

      // Use a default user ID if none is found (for development/testing)
      const effectiveUserId = userId || '000000000000000000000000';
      console.log('Unarchiving team with ID:', id, 'by user:', effectiveUserId);

      // Verify the team exists in archive first
      const archivedTeam = await TeamArchive.findById(id).lean();
      if (!archivedTeam) {
        return res.status(404).json({
          success: false,
          message: 'Archived team not found'
        });
      }

      // Log before operations for debugging
      console.log('Unarchiving team:', archivedTeam._id);
      console.log('Team exists in archive:', !!archivedTeam);
      console.log('Original color:', archivedTeam.originalColor);
      console.log('Current color:', archivedTeam.color);

      // Create the active team first (without members field)
      const archivedTeamObj = { ...archivedTeam };
      delete archivedTeamObj.members; // Remove members field if it exists
      delete archivedTeamObj._id; // Remove _id to avoid duplicate key error

      const team = new Team({
        ...archivedTeamObj,
        _id: id, // Keep the same ID
        status: archivedTeam.originalStatus || 'Active',
        color: archivedTeam.originalColor || archivedTeamObj.color, // Restore original color if available
        updated_at: new Date()
      });

      await team.save();

      // Verify the team was created
      const createdTeam = await Team.findById(id);
      if (!createdTeam) {
        throw new Error('Failed to create active team');
      }

      console.log('Team unarchived with color:', createdTeam.color);

      // Restore team members from archive
      const archivedMembers = await TeamMemberArchive.find({ team_id: id });
      console.log(`Found ${archivedMembers.length} archived team members to restore`);

      if (archivedMembers.length > 0) {
        // Create new team members from archived members
        const restorePromises = archivedMembers.map(async (archivedMember) => {
          const memberData = archivedMember.toObject();
          delete memberData._id; // Remove the archive ID
          delete memberData.archived_at; // Remove archive date

          // Create new team member
          const newMember = new TeamMember({
            ...memberData,
            team_id: id // Keep the same team ID
          });

          return newMember.save();
        });

        // Wait for all restores to complete
        await Promise.all(restorePromises);
        console.log(`Restored ${archivedMembers.length} team members`);

        // Delete archived members
        await TeamMemberArchive.deleteMany({ team_id: id });
        console.log('Deleted archived team members');
      }

      // Delete from archive - with explicit error handling
      const deleteResult = await TeamArchive.deleteOne({ _id: id });
      console.log('Delete result:', deleteResult);

      if (deleteResult.deletedCount === 0) {
        throw new Error('Failed to delete from archive - no document was deleted');
      }

      // Verify deletion
      const stillArchived = await TeamArchive.findById(id);
      if (stillArchived) {
        throw new Error('Team still exists in archive after deletion attempt');
      }

      // Log success
      console.log('Team successfully unarchived and removed from archive');

      // Track history
      try {
        await TeamHistory.create({
          team_id: team._id,
          change_type: 'Team Unarchived',
          old_value: 'Archived',
          new_value: 'Active',
          changed_at: new Date(),
          changed_by: effectiveUserId
        });
        console.log('Team history record created for unarchive');
      } catch (historyError) {
        console.error('Error creating team history for unarchive:', historyError);
        // Continue with the process even if history creation fails
      }

      res.status(200).json({
        success: true,
        message: 'Team unarchived successfully',
        team: createdTeam,
        archiveDeleted: deleteResult.deletedCount > 0
      });

    } catch (error) {
      console.error('Unarchive error:', error);
      res.status(500).json({
        success: false,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };
  exports.deleteArchivedTeam = async (req, res) => {
    const { id } = req.params;

    try {
      // Delete the archived team
      const deletedTeam = await TeamArchive.findByIdAndDelete(id);
      if (!deletedTeam) {
        return res.status(404).json({
          success: false,
          message: 'Archived team not found'
        });
      }

      // Also delete the archived team members
      const deletedMembers = await TeamMemberArchive.deleteMany({ team_id: id });
      console.log(`Deleted ${deletedMembers.deletedCount} archived team members`);

      res.status(200).json({
        success: true,
        message: 'Archived team deleted successfully',
        deletedTeam,
        deletedMembersCount: deletedMembers.deletedCount
      });
    } catch (error) {
      console.error('Error deleting archived team:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  };

  exports.getArchivedTeamById = async (req, res) => {
    const { id } = req.params;
    console.log('Fetching archived team with ID:', id);

    try {
      const archivedTeam = await TeamArchive.findById(id)
        .populate('manager_id', 'firstName lastName email image')
        .populate('project_id', 'name description');

      console.log('Found archived team:', archivedTeam);

      if (!archivedTeam) {
        return res.status(404).json({
          success: false,
          message: 'Archived team not found'
        });
      }

      // Convert to plain object to add members
      const archivedTeamObj = archivedTeam.toObject();

      // Get archived team members
      const archivedMembers = await TeamMemberArchive.find({ team_id: id })
        .populate('user_id', 'firstName lastName email image role')
        .populate('role', 'RoleName');

      console.log(`Found ${archivedMembers.length} archived team members`);

      // Format members to match the expected format
      archivedTeamObj.members = archivedMembers.map(member => ({
        _id: member.user_id._id,
        firstName: member.user_id.firstName,
        lastName: member.user_id.lastName,
        email: member.user_id.email,
        image: member.user_id.image,
        role: member.role.RoleName
      }));

      // Return in the same format as regular team details
      res.status(200).json({
        success: true,
        data: archivedTeamObj
      });
    } catch (error) {
      console.error('Error fetching archived team:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
};

  exports.exportArchivedTeams = async (_, res) => {
    try {
      console.log("Fetching archived teams...");
      const archives = await TeamArchive.find()
        .populate('manager_id', 'firstName lastName')
        .populate('project_id', 'name');

      if (!archives.length) {
        return res.status(404).json({ message: 'No archived teams found.' });
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Archived Teams');

      worksheet.columns = [
        { header: 'Team Name', key: 'name', width: 30 },
        { header: 'Manager', key: 'manager', width: 25 },
        { header: 'Project', key: 'project', width: 25 },
        { header: 'Members Count', key: 'membersCount', width: 15 },
        { header: 'Original Status', key: 'originalStatus', width: 20 },
        { header: 'Archived Date', key: 'updated_at', width: 20 }
      ];

      // Get member counts for each team
      const memberCounts = {};
      const archivedMembers = await TeamMemberArchive.find();

      archivedMembers.forEach(member => {
        const teamId = member.team_id.toString();
        memberCounts[teamId] = (memberCounts[teamId] || 0) + 1;
      });

      archives.forEach((archive) => {
        const teamId = archive._id.toString();
        worksheet.addRow({
          name: archive.name,
          manager: archive.manager_id ? `${archive.manager_id.firstName} ${archive.manager_id.lastName}` : 'N/A',
          project: archive.project_id?.name || 'N/A',
          membersCount: memberCounts[teamId] || 0,
          originalStatus: archive.originalStatus || 'Active',
          updated_at: archive.updated_at ? new Date(archive.updated_at).toLocaleDateString() : 'N/A',
        });
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=archived-teams.xlsx'
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('Excel export error:', err);
      res.status(500).json({ message: 'Failed to export Excel file.', error: err.message });
    }
  };



exports.getTeamHistory = async (req, res) => {
  try {
      const { teamId } = req.params;

      const history = await TeamHistory.find({ team_id: teamId })
          .populate({
              path: 'changed_by',
              select: 'firstName lastName image',
              model: 'user'
          })
          .sort({ changed_at: -1 });

      res.status(200).json({
          success: true,
          data: history
      });
  } catch (error) {
      console.error('Error fetching team history:', error);
      res.status(500).json({
          success: false,
          message: 'Failed to fetch team history',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
  }
};

