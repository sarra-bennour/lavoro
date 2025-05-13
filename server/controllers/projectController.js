const Project = require('../models/Project');
const mongoose = require('mongoose');
const ProjectHistory = require('../models/ProjectHistory'); // Chemin vers votre modèle ProjectHistory
const Archive = require('../models/Archive'); // Chemin vers votre modèle Archive
const Role = require('../models/role');
const User = require('../models/user');
const ExcelJS = require('exceljs');
const jwt = require('jsonwebtoken');

const nodemailer = require('nodemailer');
const sendEmail = require('../utils/email');
const transporter = require('../utils/emailConfig'); 
const { createNotification } = require('../utils/notification');
const { predictProjectFields } = require('../utils/predict'); 


const {storeEmail} = require('../controllers/emailController');

const sendProjectAssignmentEmail = async (email, projectDetails, senderUserId, receiverUserId) => {
  try {
    const mailData = {
      from: `LAVORO <${process.env.EMAIL_USER || 'no-reply@example.com'}>`,
      to: email,
      subject: `🚀 New Project Assigned: ${projectDetails.name} 🗂️`,
      text: `Hello 👋,\n\nA new project has been assigned to you! 🎉\n\nHere are the project details:\n- 📌 Title: ${projectDetails.name}\n- 📝 Description: ${projectDetails.description}\n- 💰 Budget: ${projectDetails.budget}\n- 🏢 Client: ${projectDetails.client}\n- 📅 Start Date: ${new Date(projectDetails.start_date).toLocaleDateString()}\n- 🗓️ End Date: ${new Date(projectDetails.end_date).toLocaleDateString()}\n- ⚠️ Risk Level: ${projectDetails.risk_level}\n\nPlease take a moment to review the details. ✔️\n\nBest regards,\nThe Project Management Team 💼`,
      projectId: projectDetails._id,
      direction: 'sent',
      senderUserId: senderUserId,
      receiverUserId: receiverUserId
    };

    // Store sender's copy
    const sentEmail = await storeEmail(mailData);

    // Store receiver's copy (with direction 'received')
    const receivedEmailData = {
      ...mailData,
      direction: 'received'
    };
    await storeEmail(receivedEmailData);

    return sentEmail;
  } catch (error) {
    console.error('Error sending project assignment email:', error);
    throw error;
  }
};



exports.createProject = async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    const loggedInUser = await User.findById(decoded._id).populate('role');
    
    if (!loggedInUser) {
      return res.status(401).json({ message: 'User not found' });
    }

    const projectData = {
      name: req.body.name,
      description: req.body.description,
      budget: req.body.budget || 0,
      manager_id: req.body.manager_id,
      ProjectManager_id: loggedInUser._id,
      team_id: req.body.team_id,
      client: req.body.client,
      start_date: req.body.start_date ? new Date(req.body.start_date) : null,
      end_date: req.body.end_date ? new Date(req.body.end_date) : null,
      status: req.body.status || 'Not Started',
      risk_level: req.body.risk_level || 'Medium',
      tags: req.body.tags
    };

    const newProject = new Project(projectData);
    await newProject.save();

    // Create project history entry
    const historyEntry = new ProjectHistory({
      project_id: newProject._id,
      change_type: 'Project Created',
      old_value: 'N/A',
      new_value: `Project "${newProject.name}" created by Project Manager ${loggedInUser.firstName} ${loggedInUser.lastName}.`,
    });
    await historyEntry.save();

    // Get manager and send email notification
    const manager = await User.findById(req.body.manager_id);
    if (!manager) {
      return res.status(404).json({ message: 'Manager not found' });
    }

    // Send email with both sender and receiver IDs
    await sendProjectAssignmentEmail(
      manager.email, 
      newProject, 
      loggedInUser._id,  // senderUserId
      manager._id        // receiverUserId
    );

    return res.status(201).json({
      message: 'Project created successfully',
      project: newProject,
      history: historyEntry
    });

  } catch (error) {
    console.error("Error creating project:", error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation Error",
        errors: error.errors
      });
    }

    return res.status(500).json({
      message: "Error creating project",
      error: error.message
    });
  }
};





// Updated getAllProjects function
exports.getAllProjects = async (req, res) => {
  try {
    // Get token from headers
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Verify token and get user
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).populate('role');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Build query based on role
    let query = {};
    if (user.role?.RoleName === 'Team Manager') {
      query = { manager_id: user._id }; // Team Managers see projects where they are manager_id
    } else if (user.role?.RoleName === 'Project Manager') {
      query = { ProjectManager_id: user._id }; // Project Managers see projects where they are ProjectManager_id
    }

    const projects = await Project.find(query)
      .sort({ created_at: -1 })
      .populate('manager_id', 'firstName lastName email')
      .populate('ProjectManager_id', 'firstName lastName email');

    res.status(200).json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ 
      message: "Error fetching projects",
      error: error.message 
    });
  }
};




// Récupérer un projet par son nom (exact match)
exports.getProjectByName = async (req, res) => {
  try {
      const { search } = req.query;
      
      if (!search || search.trim() === '') {
          return res.status(400).json({
              success: false,
              message: 'Search term is required'
          });
      }

      // Utilisation de la recherche full-text de MongoDB
      const projects = await Project.find(
          { $text: { $search: search } },
          { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(50);

      res.status(200).json({
          success: true,
          count: projects.length,
          data: projects
      });

  } catch (error) {
      console.error('Error searching projects:', error);
      res.status(500).json({
          success: false,
          message: 'Server error while searching projects',
          error: error.message
      });
  }
};

// Supprimer un projet
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findByIdAndDelete(req.params.id);
        if (!project) {
            return res.status(404).json({ message: "Projet non trouvé" });
        }
        res.status(200).json({ message: "Projet supprimé avec succès" });
    } catch (error) {
        res.status(500).json({ 
            message: "Erreur lors de la suppression du projet",
            error: error.message 
        });
    }
};


  exports.getProjectById = async (req, res) => {
    const { id } = req.params;
  
    try {
      // Populate both manager_id and ProjectManager_id in a single query
      const project = await Project.findById(id)
        .populate('manager_id', 'firstName lastName email image')
        .populate('tasks', 'title') 
        .populate('ProjectManager_id', 'firstName lastName email image');

  
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
  
      res.status(200).json(project);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  
  
    exports.archiveProject = async (req, res) => {
      const { id } = req.params; // Get the project ID from the URL
    
      console.log(`Archiving project with ID: ${id}`); // Log the project ID
    
      try {
        // Find the project by ID
        const project = await Project.findById(id);
        if (!project) {
          console.log('Project not found'); // Log if project is not found
          return res.status(404).json({ message: 'Project not found' });
        }
    
        console.log('Project found:', project); // Log the project details
    
        // Capture the original status before updating
        const originalStatus = project.status;
    
        // Update the project's status to "Archived"
        project.status = 'Archived';
        await project.save();
    
        // Track the status change in ProjectHistory
        const history = new ProjectHistory({
          project_id: project._id, // Use project._id (ObjectId)
          change_type: 'Status Update',
          old_value: originalStatus, // Use the original status
          new_value: 'Archived', // New status
          changed_at: new Date(),
        });
        await history.save();
    
        console.log('Status change tracked in ProjectHistory:', history); // Log the history entry
    
        // Create a new archive entry with the original status
        const archive = new Archive({
          ...project.toObject(), // Copy all project fields
          originalStatus, // Store the original status
        });
        await archive.save();
    
        console.log('Project archived successfully:', archive); // Log the archived project
    
        // Delete the project from the projects collection
        await Project.findByIdAndDelete(id);
    
        console.log('Project deleted from projects collection'); // Log deletion
    
        res.status(200).json({ message: 'Project archived successfully', archive });
      } catch (error) {
        console.error('Error archiving project:', error); // Log any errors
        res.status(500).json({ message: error.message });
      }
    };
  
  
  exports.getAllArchivedProjects = async (req, res) => {
    try {
      const archivedProjects = await Archive.find({});
      if (!archivedProjects || archivedProjects.length === 0) {
        return res.status(404).json({ message: 'No archived projects found' });
      }
      res.status(200).json(archivedProjects);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  
  exports.unarchiveProject = async (req, res) => {
    const { id } = req.params; // Project ID
  
    try {
      // Find the archived project
      const archivedProject = await Archive.findById(id);
      if (!archivedProject) {
        return res.status(404).json({ message: 'Archived project not found' });
      }
  
      // Create a new project in the Project collection
      const project = new Project(archivedProject.toObject());
      project.status = 'Completed'; // Update the status to "Completed"
      project.updated_at = new Date(); // Update the updated_at field
      await project.save();
  
      // Track the unarchive action in ProjectHistory
      const history = new ProjectHistory({
        project_id: project._id,
        change_type: 'Status Update',
        old_value: 'Archived', // The old value is "Archived"
        new_value: 'Unarchived', // Set the new value to "Unarchived"
        changed_at: new Date(),
      });
      await history.save();
  
      // Delete the project from the Archive collection
      await Archive.findByIdAndDelete(id);
  
      res.status(200).json({ message: 'Project unarchived successfully', project });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  
  exports.deleteArchivedProject = async (req, res) => {
    const { id } = req.params; // Project ID
  
    try {
      // Find and delete the archived project
      const deletedProject = await Archive.findByIdAndDelete(id);
      if (!deletedProject) {
        return res.status(404).json({ message: 'Archived project not found' });
      }
  
      res.status(200).json({ message: 'Archived project deleted successfully', deletedProject });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  
  
  exports.getArchivedProjectById = async (req, res) => {
    const { id } = req.params; // Get the archive ID from the URL
  
    try {
      const archivedProject = await Archive.findById(id)
      .populate('manager_id', 'firstName lastName email image')
      .populate('tasks', 'title') 
      .populate('ProjectManager_id', 'firstName lastName email image');
      // Fetch the archived project by ID
      if (!archivedProject) {
        return res.status(404).json({ message: 'Archived project not found' });
      }
  
      res.status(200).json(archivedProject); // Return the archived project details
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  exports.exportArchivedProjects = async (req, res) => {
    try {
      console.log("🔍 Fetching archived projects...");
      const archives = await Archive.find();
      
      if (!archives.length) {
        return res.status(404).json({ message: 'No archived projects found.' });
      }
  
      console.log("✅ Archived projects found:", archives.length);
  
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Archived Projects');
  
      worksheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Original Status', key: 'originalStatus', width: 20 },
        { header: 'Budget (TND)', key: 'budget', width: 15 },
        { header: 'Last Updated', key: 'updated_at', width: 20 }
      ];
  
      archives.forEach((archive) => {
        console.log("📌 Adding row:", archive.name);
        worksheet.addRow({
          name: archive.name,
          originalStatus: archive.originalStatus,
          budget: archive.budget,
          updated_at: archive.updated_at ? new Date(archive.updated_at).toLocaleDateString() : 'N/A',
        });
      });
  
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=archived-projects.xlsx'
      );
  
      console.log("📤 Sending Excel file...");
      await workbook.xlsx.write(res);
      res.end();
    } catch (err) {
      console.error('❌ Excel export error:', err);
      res.status(500).json({ message: 'Failed to export Excel file.', error: err.message });
    }
  };


    exports.getProjectHistory = async (req, res) => {
      const { id } = req.params; // Project ID
    
      try {
        // Find all history entries for the project
        const history = await ProjectHistory.find({ project_id: id });
        if (!history || history.length === 0) {
          return res.status(404).json({ message: 'No history found for this project' });
        }
    
        res.status(200).json(history);
      } catch (error) {
        res.status(500).json({ message: error.message });
      }
    };
  

// Fonction qui vérifie si un utilisateur est un Team Manager
exports.checkTeamManager = async (id) => {
  try {
      const user = await User.findById(id);
      if (!user) {
          throw new Error('Utilisateur non trouvé');
      }

      const role = await Role.findById(user.role);
      if (!role) {
          throw new Error('Rôle non trouvé');
      }

      if (role.RoleName !== 'Team Manager') {
          throw new Error('L\'utilisateur n\'est pas un Team Manager');
      }

      return user;
  } catch (error) {
      throw error;
  }
};


exports.checkTeamManagerProjects = async (req, res) => {
  try {
    const user = await this.checkTeamManager(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    console.log("User found:", req.params.id);

    const projects = await Project.find({ manager_id: req.params.id });

    const workloadScore = projects.reduce((score, project) => {
      let projectScore = 0;

      // Pondération par statut
      if (project.status === 'In Progress') projectScore += 2;
      else if (project.status === 'Not Started') projectScore += 1;
      else if (project.status === 'Completed') projectScore += 0.5;

      // Pondération par niveau de risque (urgence)
      if (project.risk_level === 'High') projectScore += 2;
      else if (project.risk_level === 'Medium') projectScore += 1;

      // Pondération par retard (si end_date est dépassé)
      if (project.end_date && new Date(project.end_date) < new Date()) {
        projectScore += 3; // Pénalité pour retard
      }

      return score + projectScore;
    }, 0);

    // 3. Définir des seuils de charge
    const MAX_WORKLOAD = 10; // Seuil arbitraire (à ajuster)
    const availableCapacity = MAX_WORKLOAD - workloadScore;

    // 4. Retourner une réponse détaillée
    if (availableCapacity <= 0) {
      return res.status(400).json({ 
        message: 'Maximum workload reached',
        workloadScore,
        maxWorkload: MAX_WORKLOAD,
        suggestion: 'Réaffectez certains projets ou ajustez les délais.'
      });
    } else {
      return res.status(200).json({message: 'Capacity available for a new project'});
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


exports.updateProjects = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    console.log("Current project:", project);
    console.log("Received updates:", updates);

    const changes = [];
    
    // Special handling for manager_id - this is the key fix
    if (updates.hasOwnProperty('manager_id')) {
      const oldManagerId = project.manager_id;
      const newManagerId = updates.manager_id;
      
      // Check if manager actually changed
      if ((!oldManagerId && newManagerId) || 
          (oldManagerId && !newManagerId) || 
          (oldManagerId && newManagerId && !oldManagerId.equals(newManagerId))) {
        
        const oldManager = oldManagerId ? await User.findById(oldManagerId) : null;
        const newManager = newManagerId ? await User.findById(newManagerId) : null;
        
        changes.push({
          field: 'manager_id',
          oldValue: oldManager ? `${oldManager.firstName} ${oldManager.lastName}` : 'None',
          newValue: newManager ? `${newManager.firstName} ${newManager.lastName}` : 'None',
          changeType: 'Manager Changed' // Explicitly set the correct change type
        });
      }
    }

    // Rest of your existing code for other fields...
    for (const field in updates) {
      if (field === 'manager_id') continue;
      
      const oldValue = project[field];
      const newValue = updates[field];
      
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue;

      if (field.includes('_date')) {
        const oldDate = oldValue ? new Date(oldValue) : null;
        const newDate = newValue ? new Date(newValue) : null;
        
        if ((oldDate && newDate && oldDate.getTime() !== newDate.getTime()) || 
            (!oldDate && newDate) || 
            (oldDate && !newDate)) {
          changes.push({
            field,
            oldValue: oldDate ? oldDate.toISOString() : 'None',
            newValue: newDate ? newDate.toISOString() : 'None',
            changeType: getChangeType(field)
          });
        }
      } else {
        changes.push({
          field,
          oldValue: stringifyForHistory(oldValue),
          newValue: stringifyForHistory(newValue),
          changeType: getChangeType(field)
        });
      }
    }

    console.log("Detected changes:", changes);

    // Save history entries
    for (const change of changes) {
      const history = new ProjectHistory({
        project_id: project._id,
        change_type: change.changeType, // This will now be 'Manager Changed' when appropriate
        old_value: change.oldValue,
        new_value: change.newValue,
        changed_at: new Date()
      });
      await history.save();
      console.log("Saved history entry:", history);
    }

    // Apply updates
    Object.assign(project, updates);
    project.updated_at = new Date();
    await project.save();

    res.status(200).json({ message: 'Project updated successfully', project, changes });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ 
      message: "Server error during update",
      error: error.message,
      stack: error.stack
    });
  }
};

// Helper to properly stringify values for history
function stringifyForHistory(value) {
  if (value === null || value === undefined) return 'None';
  if (value instanceof Date) return value.toISOString();
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Improved change type detection
function getChangeType(field) {
  const fieldMap = {
    name: 'Project Name Updated',
    description: 'Description Update',
    budget: 'Budget Update',
    client: 'Client Updated',
    start_date: 'Start Date Change',
    end_date: 'Deadline Change',
    status: 'Status Update',
    risk_level: 'Risk Level Updated',
    manager_id: 'Manager Changed',
    team_id: 'Team Changed',
    tags: 'Tags Updated'
  };

  return fieldMap[field] || 'Other Update';
}









// Function to get all projects
exports.getAllProjectss = async (req, res) => {
try {
  const projects = await Project.find({});
  res.status(200).json(projects);
} catch (error) {
  res.status(500).json({ message: error.message });
}
};




exports.getProjectsWithProgress = async (req, res) => {
  try {
      console.log('Fetching projects with progress...');
      
      // Récupérer tous les projets
      const allProjects = await Project.find({});
      console.log('Total projects in database:', allProjects.length);

      // Récupérer tous les historiques de projets
      const allHistories = await ProjectHistory.find({}).sort({ changed_at: -1 });
      console.log('Total histories:', allHistories.length);
      console.log('Sample history:', JSON.stringify(allHistories[0], null, 2));

      // Créer un map des derniers historiques par projet
      const latestHistories = new Map();
      allHistories.forEach(history => {
          try {
              if (history && history.project_id) {
                  const projectId = history.project_id.toString();
                  if (!latestHistories.has(projectId)) {
                      latestHistories.set(projectId, history);
                  }
              } else {
                  console.log('Skipping history entry:', history);
              }
          } catch (err) {
              console.error('Error processing history entry:', err);
              console.log('Problematic history entry:', history);
          }
      });

      console.log('Latest histories map size:', latestHistories.size);

      // Combiner les projets avec leur historique
      const projectsWithProgress = allProjects.map(project => {
          try {
              const projectId = project._id.toString();
              const history = latestHistories.get(projectId);

              return {
                  _id: project._id,
                  name: project.name,
                  description: project.description,
                  status: project.status,
                  progress: history ? history.progress : 0,
                  updated_at: history ? history.changed_at : project.updated_at
              };
          } catch (err) {
              console.error('Error processing project:', err);
              console.log('Problematic project:', project);
              return null;
          }
      }).filter(project => project !== null);

      console.log('Projects with progress:', projectsWithProgress.length);
      res.status(200).json(projectsWithProgress);
  } catch (error) {
      console.error('Error fetching projects with progress:', error);
      res.status(500).json({ message: 'Failed to fetch projects with progress' });
  }
};





// Fonction pour compter les projets
exports.getArchiveCount = async (req, res) => {
  try {
      const count = await Archive.countDocuments(); 
      res.status(200).json({ count });
  } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error });
  }
};



// Fonction pour compter les projets (incluant les archives)
exports.getProjectCount = async (req, res) => {
  try {
      const projectCount = await Project.countDocuments();
      const archiveCount = await Archive.countDocuments();
      const totalCount = projectCount + archiveCount;
      
      res.status(200).json({ 
        count: totalCount,
        projectCount,
        archiveCount 
      });
  } catch (error) {
      res.status(500).json({ message: 'Erreur serveur', error });
  }
};





exports.getProjectsByStatus = async () => {
  try {
    // Get active projects by status
    const activeProjectsByStatus = await Project.aggregate([
      {
        $group: {
          _id: "$status", // Group by status
          count: { $sum: 1 } // Count projects in each group
        }
      }
    ]);

    // Get archived projects count
    const archiveCount = await Archive.countDocuments();

    // Format active projects results
    const formattedResults = activeProjectsByStatus.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    // Add archived count to the results
    formattedResults['Archived'] = archiveCount;

    return formattedResults;
  } catch (err) {
    console.error('Error fetching projects by status:', err);
    throw err;
  }
};





exports.generateAISuggestions = async (req, res) => {
  const { name, description, client, manager_id } = req.body;
  try {
    // Get AI prediction (as raw text)
    const predictionText = await predictProjectFields(name, description);
    
    if (!predictionText) {
      return res.status(400).json({ error: "Failed to generate project predictions" });
    }

    const cleaned = predictionText
      .replace(/^```json\s*/i, '') 
      .replace(/^```\s*/i, '')      
      .replace(/```$/, '')          
      .trim();

    let prediction;
    try {
      prediction = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return res.status(400).json({ error: "Invalid AI response format" });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(startDate.getMonth() + (prediction.duration || 0));

    // Handle risks - convert to array if it's a string
    let risks = [];
    if (prediction.Risks) {
      risks = typeof prediction.Risks === 'string' 
        ? prediction.Risks.split('\n').filter(r => r.trim()) 
        : prediction.Risks;
    }

    // Return suggestions without saving to database
    res.status(200).json({
      budget: prediction.budget || 0,
      start_date: startDate,
      end_date: endDate,
      estimated_duration: prediction.duration || 0,
      priority: prediction.priority || 'Medium',
      risk_level: prediction.risk_level || 'Medium',
      team_member_count: prediction.team_member_count || 0,
      total_tasks_count: prediction.task_count || 0,
      tags: prediction.Tags || '',
      ai_description: prediction["Ai-description"] || description,
      risks: risks
    });

  } catch (error) {
    console.error("Error in generateAISuggestions:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error.message
    });
  }
};

exports.createProjectWithAI = async (req, res) => {


  const token = req.headers.authorization;
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Verify token and get user
  const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
  const loggedInUser = await User.findById(decoded._id).populate('role');
  
  if (!loggedInUser) {
    return res.status(401).json({ message: 'User not found' });
  }


  const {
    name,
    description,
    client,
    manager_id,
    ProjectManager_id,
    budget,
    start_date,
    end_date,
    estimated_duration,
    priority,
    risk_level,
    team_member_count,
    total_tasks_count,
    tags,
    status,
    ai_description
  } = req.body;

  try {
    const predictionText = await predictProjectFields(name, description);
    const cleaned = predictionText
      .replace(/^```json\s*/i, '') 
      .replace(/^```\s*/i, '')      
      .replace(/```$/, '')          
      .trim();

    let prediction = {};
    try {
      prediction = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return res.status(400).json({ error: "Invalid AI response format" });
    }

    const aiDescription = prediction["Ai-description"] || description;
    const aiRisks = prediction["Risks"] || "";
    const aiRisksString = Array.isArray(aiRisks)
      ? aiRisks.join(', ')
      : aiRisks;

    const newProject = new Project({
      project_id: new mongoose.Types.ObjectId().toString(), 
      name,
      description: aiDescription, // 🧠 store AI description as main
      budget: Number(budget),
      manager_id,
      ProjectManager_id: loggedInUser._id, // Set the TeamManager_id to the logged-in user's ID
      client,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      total_tasks_count: Number(total_tasks_count),
      estimated_duration: Number(estimated_duration),
      team_member_count: Number(team_member_count),
      priority,
      risk_level,
      tags,
      status: status || 'Not Started',
      ai_predicted_completion: new Date(end_date),
      ai_predicted_description: aiDescription,
      risks: aiRisksString
    });

    await newProject.save();

        // Create project history entry (same as in createProject)
    const historyEntry = new ProjectHistory({
      project_id: newProject._id,
      change_type: 'Project Created',
      old_value: 'N/A',
      new_value: `Project "${newProject.name}" created with AI assistance.`, // Slightly different message
    });


    await historyEntry.save();


    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error in createProjectWithAI:", error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error.message
    });
  } 
};




exports.startProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findById(id).populate('manager_id');
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if project can be started
    if (project.status !== 'Not Started') {
      return res.status(400).json({ 
        message: 'Project can only be started if its status is "Not Started"' 
      });
    }

    const oldStatus = project.status;
    project.status = 'In Progress';
    project.start_date = new Date();
    project.updated_at = new Date();
    
    await project.save();

    // Create history entry
    const history = new ProjectHistory({
      project_id: project._id,
      change_type: 'Status Update',
      old_value: oldStatus,
      new_value: 'In Progress',
      changed_at: new Date(),
    });
    await history.save();

    // Send notification to manager if one is assigned
    if (project.manager_id) {
      try {
        const notificationText = `Project "${project.name}" has been started and is now In Progress`;
        
        // Call the createNotification function correctly
        await createNotification(
          project.manager_id._id,  // The manager's user ID
          notificationText,
          'project_status_change'  // Notification type
        );
        
        console.log('Notification created successfully');
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError);
      }
    }

    res.status(200).json(project);

  } catch (error) {
    console.error('Error starting project:', error);
    res.status(500).json({ 
      message: 'Error starting project',
      error: error.message 
    });
  }
};


exports.getManagedProjects = async (req, res) => {
  try {
    // Verify session exists
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // Verify user exists in database
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get projects where user is manager
    const projects = await Project.find({ manager_id: req.session.user._id })
      .select('_id name description status')
      .lean();

    res.json({
      success: true,
      data: projects
    });

  } catch (error) {
    console.error('Error in getManagedProjects:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};