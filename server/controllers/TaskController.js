
const mongoose = require('mongoose');
const Task = require('../models/Task');

const TaskHistory = require('../models/TaskHistory');
const User = require('../models/user');
const Role = require('../models/role');
const Project = require('../models/Project');
const TeamMember = require('../models/teamMember');
const Team = require('../models/team');
const jwt = require('jsonwebtoken');
const { generateAITasks } = require('../utils/tasksCreation');
const { Octokit } = require('octokit');
const ObjectId = mongoose.Types.ObjectId;


// ID du rôle Developer (à utiliser directement)
const DEVELOPER_ROLE_ID = '67b1daed09554728c8601e13';

// Fonction utilitaire pour mettre à jour directement le score de performance d'un utilisateur
const updateUserPerformanceScore = async (userId, pointsToAdd) => {
  try {
    console.log(`Mise à jour directe du score pour l'utilisateur ${userId}, points à ajouter: ${pointsToAdd}`);

    // Récupérer l'utilisateur actuel pour obtenir son score
    const user = await User.findById(userId);
    if (!user) {
      console.error(`Utilisateur non trouvé: ${userId}`);
      return false;
    }

    // Calculer le nouveau score
    const currentScore = user.performancePoints || 0;
    const newScore = Math.max(0, currentScore + pointsToAdd);

    console.log(`Score actuel: ${currentScore}, Nouveau score: ${newScore}`);

    // Mettre à jour directement dans la base de données
    const result = await User.updateOne(
      { _id: userId },
      { $set: { performancePoints: newScore } }
    );

    console.log(`Résultat de la mise à jour:`, result);

    if (result.modifiedCount === 1) {
      console.log(`Score mis à jour avec succès pour l'utilisateur ${userId}`);
      return true;
    } else {
      console.error(`Échec de la mise à jour du score pour l'utilisateur ${userId}`);
      return false;
    }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du score:`, error);
    return false;
  }
};





exports.exportToGitHub = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findById(taskId)
  .populate({
    path: 'assigned_to',
    populate: {
      path: 'user_id',
      model: 'user',
      select: 'firstName lastName'
    }
  })
  .populate('project_id')
  .lean(); // Optional: lean() if you want plain JS object


    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Extract assignee names
    const assigneeNames = task.assigned_to.map(member => {
      if (member.user_id) {
        return `- ${member.user_id.firstName} ${member.user_id.lastName || ''}`;
      }
      return '- Unknown';
    }).join('\n');

    const issueBody = `
### Project: ${task.project_id?.name || 'No project associated'}

**Task:** ${task.title}

**Description:**
${task.description || '_No description provided._'}

**Priority:** ${task.priority}
**Status:** ${task.status}
**Deadline:** ${task.deadline ? new Date(task.deadline).toDateString() : 'N/A'}
**Assigned Developers:**
${assigneeNames || '- Unassigned'}

Created from internal task ID: \`${task._id}\`
`;

    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

    const response = await octokit.rest.issues.create({
      owner: process.env.GITHUB_REPO_OWNER,
      repo: process.env.GITHUB_REPO_NAME,
      title: `[${task.project_id?.name || 'No Project'}] ${task.title}`,
      body: issueBody,
      labels: task.tags || [] // Include tags as labels
    });

    res.json({
      message: 'Issue created successfully',
      issueUrl: response.data.html_url,
      issueNumber: response.data.number
    });

  } catch (error) {
    console.error('GitHub export error:', error);
    res.status(500).json({
      message: 'Error exporting task to GitHub',
      error: error.message
    });
  }
};




exports.getTasksByUser = async (req, res) => {
  try {
    console.log("Request user object:", req.user);
    console.log("Authenticated user ID:", req.user._id);

    // Trouver d'abord tous les teamMembers où cet utilisateur est le user_id
    const teamMembers = await TeamMember.find({ user_id: req.user._id });

    // Extraire les IDs des teamMembers
    const teamMemberIds = teamMembers.map(member => member._id);

    const query = { assigned_to: { $in: teamMemberIds } };
    console.log("Query:", query);

    // Récupérer les tâches sans populate pour éviter l'erreur
    const tasks = await Task.find(query).lean();

    console.log("Found tasks:", tasks);

    if (!tasks.length) {
      console.log("No tasks found for user:", req.user._id);
      return res.status(200).json([]);
    }

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

exports.seedTasks = async () => {
    try {
        await Task.deleteMany(); // Supprime toutes les tâches existantes pour éviter les doublons

        const tasks = [
            {
                _id: new mongoose.Types.ObjectId(),
                title: 'Créer une API REST',
                description: 'Développer une API REST pour gérer les utilisateurs.',
                project_id: new mongoose.Types.ObjectId(),
                assigned_to: userId, // Assignation au user Sarra Sahli
                status: 'Not Started',
                priority: 'High',
                deadline: new Date('2024-03-15'),
                start_date: new Date(),
                estimated_duration: 10, // en heures
                tags: ['API', 'Backend']
            },
            {
                _id: new mongoose.Types.ObjectId(),
                title: 'Développer une interface utilisateur',
                description: 'Créer une interface utilisateur en Angular.',
                project_id: new mongoose.Types.ObjectId(),
                assigned_to: userId, // Assignation au user Sarra Sahli
                status: 'In Progress',
                priority: 'Medium',
                deadline: new Date('2024-04-01'),
                start_date: new Date(),
                estimated_duration: 20, // en heures
                tags: ['Frontend', 'UI/UX']
            }
        ];

        await Task.insertMany(tasks);
        console.log('Tâches insérées avec succès et assignées à Sarra Sahli !');
        mongoose.connection.close();
    } catch (error) {
        console.error('Erreur lors de l’insertion des tâches :', error);
    }
};

exports.seedTaskHistory = async () => {
    try {
        await TaskHistory.deleteMany(); // Supprime l'historique existant

        const tasks = await Task.find(); // Récupère les tâches insérées précédemment

        if (tasks.length === 0) {
            console.log('Aucune tâche trouvée. Exécute d’abord le script pour insérer les tâches.');
            return mongoose.connection.close();
        }

        const historyLogs = [
            {
                task_id: tasks[0]._id,
                changed_by: new mongoose.Types.ObjectId(),
                change_type: 'Status Update',
                old_value: 'Not Started',
                new_value: 'In Progress'
            },
            {
                task_id: tasks[0]._id,
                changed_by: new mongoose.Types.ObjectId(),
                change_type: 'Priority Change',
                old_value: 'High',
                new_value: 'Medium'
            },
            {
                task_id: tasks[1]._id,
                changed_by: new mongoose.Types.ObjectId(),
                change_type: 'Status Update',
                old_value: 'In Progress',
                new_value: 'Done'
            }
        ];

        await TaskHistory.insertMany(historyLogs);
        console.log('Historique inséré avec succès !');
        mongoose.connection.close();
    } catch (error) {
        console.error('Erreur lors de l’insertion de l’historique :', error);
    }
};


// Fonction pour récupérer les tâches assignées à un utilisateur spécifique
exports.getTasksByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Vérifier si l'ID utilisateur est valide
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid userId format' });
        }

        // Rechercher les tâches assignées à l'utilisateur
        const tasks = await Task.find({ assignedTo: userId });

        res.status(200).json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};

exports.updateTaskStatus = async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Le nouveau statut est requis" });
    }

    try {
      // 1. Récupérer la tâche actuelle avant modification
      const oldTask = await Task.findById(taskId);
      if (!oldTask) {
        return res.status(404).json({ message: "Tâche non trouvée" });
      }

      // 2. Vérifier que le statut est valide
      const validStatuses = ['Not Started', 'In Progress', 'Done'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Statut invalide" });
      }

      // 3. Mettre à jour la tâche
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { status },
        { new: true, runValidators: true }
      );

      // 5. Système de points pour les employés (uniquement quand une tâche est marquée comme terminée)
      let pointsMessage = "";
      let completionType = "not_applicable";
      let hoursDifference = 0;
      let pointsEarned = 0;

      if (status === 'Done' && oldTask.assigned_to) {
        try {
          // Récupérer l'utilisateur assigné à la tâche
          const user = await User.findById(oldTask.assigned_to);

          if (user) {
            // Vérifier si la tâche a été terminée dans les délais
            const now = new Date();
            const deadline = oldTask.deadline;

            if (deadline && now <= deadline) {
              // Tâche terminée dans le délai
              pointsEarned += 1;

              // Vérifier si la tâche a été terminée avant la durée estimée
              if (oldTask.start_date && oldTask.estimated_duration) {
                const startDate = new Date(oldTask.start_date);
                const estimatedEndTime = new Date(startDate.getTime() + (oldTask.estimated_duration * 60 * 60 * 1000)); // Conversion en millisecondes

                // Calculer combien d'heures avant la durée estimée
                hoursDifference = Math.floor((estimatedEndTime - now) / (1000 * 60 * 60));

                if (hoursDifference > 0) {
                  // +1 point supplémentaire par heure d'avance (max +3 points)
                  const additionalPoints = Math.min(hoursDifference, 3);
                  pointsEarned += additionalPoints;
                  completionType = "early";
                } else {
                  completionType = "on_time";
                }
              } else {
                completionType = "on_time";
              }
            } else if (deadline && now > deadline) {
              // Tâche non terminée à temps
              pointsEarned = -1;
              completionType = "late";
              // Calculer le retard en heures (valeur négative)
              hoursDifference = -Math.floor((now - deadline) / (1000 * 60 * 60));
            }

            // Mettre à jour les points de l'utilisateur
            user.performancePoints = (user.performancePoints || 0) + pointsEarned;
            await user.save();

            pointsMessage = `Points attribués: ${pointsEarned}. Total des points: ${user.performancePoints}`;
          }
        } catch (pointsError) {
          console.error("Erreur lors de l'attribution des points:", pointsError);
          // Ne pas bloquer la mise à jour du statut si l'attribution des points échoue
        }
      }

      // 4. Enregistrer dans l'historique avec les informations de performance
      const historyEntry = new TaskHistory({
        task_id: taskId,
        changed_by: req.user._id,
        change_type: 'Status Update',
        old_value: oldTask.status,
        new_value: status,
        completion_type: completionType,
        hours_difference: hoursDifference,
        points_earned: pointsEarned
      });

      await historyEntry.save();

      res.status(200).json({
        message: "Statut mis à jour avec succès",
        task: updatedTask,
        history: historyEntry,
        pointsInfo: pointsMessage || undefined
      });

    } catch (error) {
      res.status(500).json({
        message: "Erreur serveur",
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  };

// Fonction de test pour le système de points
exports.testPointsSystem = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "ID utilisateur invalide" });
    }

    // Récupérer l'utilisateur
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Créer une tâche de test
    const now = new Date();
    const deadline = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Deadline dans 24h

    const testTask = new Task({
      title: 'Tâche de test pour le système de points',
      description: 'Cette tâche est créée pour tester le système de points.',
      project_id: new mongoose.Types.ObjectId(), // ID de projet fictif
      assigned_to: userId,
      status: 'In Progress',
      priority: 'Medium',
      deadline: deadline,
      start_date: now,
      estimated_duration: 2, // 2 heures
      tags: ['Test']
    });

    await testTask.save();

    // Récupérer les points actuels de l'utilisateur
    const initialPoints = user.performancePoints || 0;

    // Simuler la complétion de la tâche
    const completionTime = new Date(now.getTime() + (1 * 60 * 60 * 1000)); // Complété 1h après le début

    // Mettre à jour le statut de la tâche à "Done"
    testTask.status = 'Done';
    await testTask.save();

    // Calculer les points qui devraient être attribués
    let expectedPoints = 0;

    // Tâche terminée dans les délais (+1 point)
    if (completionTime <= deadline) {
      expectedPoints += 1;

      // Vérifier si la tâche a été terminée avant la durée estimée
      const estimatedEndTime = new Date(now.getTime() + (testTask.estimated_duration * 60 * 60 * 1000));
      const hoursDifference = Math.floor((estimatedEndTime - completionTime) / (1000 * 60 * 60));

      if (hoursDifference > 0) {
        // +1 point supplémentaire par heure d'avance (max +3 points)
        const additionalPoints = Math.min(hoursDifference, 3);
        expectedPoints += additionalPoints;
      }
    } else {
      // Tâche non terminée à temps (-1 point)
      expectedPoints = -1;
    }

    // Mettre à jour manuellement les points de l'utilisateur pour le test
    user.performancePoints = initialPoints + expectedPoints;
    await user.save();

    // Créer une entrée dans l'historique
    const historyEntry = new TaskHistory({
      task_id: testTask._id,
      changed_by: userId,
      change_type: 'Status Update',
      old_value: 'In Progress',
      new_value: 'Done'
    });

    await historyEntry.save();

    res.status(200).json({
      message: "Test du système de points effectué avec succès",
      task: testTask,
      user: {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        initialPoints: initialPoints,
        pointsEarned: expectedPoints,
        totalPoints: user.performancePoints
      },
      pointsCalculation: {
        taskCompletedOnTime: completionTime <= deadline,
        estimatedDuration: testTask.estimated_duration,
        actualDuration: 1, // 1 heure dans notre simulation
        hoursAhead: testTask.estimated_duration - 1
      }
    });

  } catch (error) {
    console.error("Erreur lors du test du système de points:", error);
    res.status(500).json({
      message: "Erreur serveur lors du test",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


exports.addTask = async (req, res) => {
  try {

    const {
      title,
      description,
      project_id,
      assigned_to,
      status,
      priority,
      deadline,
      start_date,
      estimated_duration,
      tags
    } = req.body;

    // Get the current user ID from the request (assuming you have authentication middleware)
    const created_by = req.user._id;


    // Validate that project exists
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Validate that team member exists if assigned
    if (assigned_to) {
      const teamMember = await TeamMember.findById(assigned_to);
      if (!teamMember) {
        return res.status(404).json({
          success: false,
          message: 'Team member not found'
        });
      }
    }

    const newTask = new Task({
      title,
      description,
      project_id,
      assigned_to,
      created_by, // Add the creator ID
      status,
      priority,
      deadline,
      start_date,
      estimated_duration,
      tags
    });

    const savedTask = await newTask.save();

    // Update project's tasks array
    await Project.findByIdAndUpdate(
      project_id,
      {
        $push: { tasks: savedTask._id },
        $inc: { total_tasks_count: 1 }
      },
      { new: true }
    );

    // If assigned to a team member, add task to their tasks array
    if (assigned_to) {
      await TeamMember.findByIdAndUpdate(
        assigned_to,
        {
          $push: { tasks: savedTask._id }
        },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: savedTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


exports.getAllTasks = async (req, res) => {
  try {
    // Extract query parameters
    const {
      status,
      priority,
      project_id,
      assigned_to,
      page,
      limit
    } = req.query;

    // Get the current user ID from the request
    const created_by = req.user._id;

    // Build filter object
    const filter = { created_by }; // Only show tasks created by this user

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (project_id) filter.project_id = project_id;
    if (assigned_to) filter.assigned_to = assigned_to;

    // Create query
    let query = Task.find(filter)
      .populate('project_id', 'name status')
      .populate({
        path: 'assigned_to',
        select: 'role',
        populate: {
          path: 'user_id',
          select: 'firstName lastName image'
        }
      })
      .populate('created_by', 'firstName lastName') // Populate creator info
      .sort({ deadline: 1 });

    // Apply pagination only if both page and limit are provided
    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      query = query.skip(skip).limit(parseInt(limit));
    }

    // Get tasks with population
    const tasks = await query;

    // Get total count for pagination info
    const totalTasks = await Task.countDocuments(filter);

    // Prepare response
    const response = {
      success: true,
      data: tasks,
    };

    // Add pagination info only if pagination was applied
    if (page && limit) {
      response.pagination = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTasks / parseInt(limit)),
        totalTasks,
        tasksPerPage: parseInt(limit)
      };
    } else {
      response.totalTasks = totalTasks;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


// In your TaskController.js

exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    // 1. Find the task first to check status
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // 2. Check if task can be deleted (only "Not Started" status)
    if (task.status !== 'Not Started') {
      return res.status(400).json({
        success: false,
        message: 'Only tasks with "Not Started" status can be deleted'
      });
    }

    // 3. Remove task from project's tasks array
    await Project.findByIdAndUpdate(
      task.project_id,
      { $pull: { tasks: taskId }, $inc: { total_tasks_count: -1 } }
    );

    // 4. Remove task from assigned team member's tasks array (if assigned)
    if (task.assigned_to) {
      await TeamMember.updateMany(
        { _id: { $in: task.assigned_to } },
        { $pull: { tasks: taskId } }
      );
    }

    // 5. Delete the task
    await Task.findByIdAndDelete(taskId);

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



exports.assignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { memberIds } = req.body;

    // Validate input
    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({
        success: false,
        message: 'memberIds must be an array'
      });
    }

    // Filter out invalid IDs
    const validMemberIds = memberIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    if (validMemberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid team member IDs provided'
      });
    }

    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify all team members exist
    const existingMembers = await TeamMember.find({
      _id: { $in: validMemberIds }
    }).populate('user_id', 'firstName lastName');

    if (existingMembers.length !== validMemberIds.length) {
      const foundIds = existingMembers.map(m => m._id.toString());
      const missingIds = validMemberIds.filter(id => !foundIds.includes(id.toString()));
      return res.status(404).json({
        success: false,
        message: `Team members not found: ${missingIds.join(', ')}`
      });
    }

    // Update the task with new assignments
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $addToSet: { assigned_to: { $each: validMemberIds } } }, // Use $addToSet to avoid duplicates
      { new: true }
    ).populate({
      path: 'assigned_to',
      select: 'role user_id',
      populate: {
        path: 'user_id',
        select: 'firstName lastName image'
      }
    });

    // Add task to team members' task arrays
    await TeamMember.updateMany(
      { _id: { $in: validMemberIds } },
      { $addToSet: { tasks: taskId } }
    );

    res.status(200).json({
      success: true,
      message: 'Task assigned successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


exports.unassignTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { memberIds } = req.body;

    // Validate input
    if (!memberIds || !Array.isArray(memberIds)) {
      return res.status(400).json({
        success: false,
        message: 'memberIds must be an array'
      });
    }

    // Filter out invalid IDs
    const validMemberIds = memberIds.filter(id => mongoose.Types.ObjectId.isValid(id));

    if (validMemberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid team member IDs provided'
      });
    }

    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update the task by removing the members
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $pull: { assigned_to: { $in: validMemberIds } } },
      { new: true }
    ).populate({
      path: 'assigned_to',
      select: 'role user_id',
      populate: {
        path: 'user_id',
        select: 'firstName lastName image'
      }
    });

    // Remove task from team members' task arrays
    await TeamMember.updateMany(
      { _id: { $in: validMemberIds } },
      { $pull: { tasks: taskId } }
    );

    res.status(200).json({
      success: true,
      message: 'Members unassigned successfully',
      data: updatedTask
    });

  } catch (error) {
    console.error('Error unassigning task:', error);
    res.status(500).json({
      success: false,
      message: 'Error unassigning task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};



exports.getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(taskId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task ID format'
      });
    }

    const task = await Task.findById(taskId)
      .populate({
        path: 'assigned_to',
        select: 'role user_id',
        populate: {
          path: 'user_id',
          select: 'firstName lastName email image'
        }
      })
      .populate({
        path: 'project_id',
        select: 'name description ProjectManager_id budget client start_date end_date priority status risk_level tasks manager_id',
        populate: [
          {
            path: 'ProjectManager_id',
            select: 'firstName lastName email image'
          },
          {
            path: 'manager_id',
            select: 'firstName lastName email image'
          }
        ]
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




exports.getMyTasks = async (req, res) => {
  try {
    // Get the authenticated user's ID from the request
    const userId = req.user._id;

    // First find all team members where this user is the user_id
    const teamMembers = await TeamMember.find({ user_id: userId });

    // Extract the team member IDs
    const teamMemberIds = teamMembers.map(member => member._id);

    // Find tasks assigned to any of these team member IDs
    const tasks = await Task.find({
      assigned_to: { $in: teamMemberIds }
    })
    .populate('project_id', 'name status')
    .populate({
      path: 'assigned_to',
      select: 'role user_id',
      populate: {
        path: 'user_id',
        select: 'firstName lastName image'
      }
    })
    .sort({ deadline: 1 });

    // Calculate counts for different statuses
    const today = new Date().toISOString().split('T')[0];
    const counts = {
      all: tasks.length,
      done: tasks.filter(t => t.status === 'Done').length,
      today: tasks.filter(t =>
        t.deadline && new Date(t.deadline).toISOString().split('T')[0] === today
      ).length,
      starred: tasks.filter(t => t.priority === 'High').length
    };

    res.status(200).json({
      success: true,
      data: tasks,
      counts // Include the counts in the response
    });
  } catch (error) {
    console.error('Error fetching user tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




// Helper function to calculate task score
const calculateTaskScore = (task, oldTask) => {
  let score = oldTask?.score || 0;

  // Check if status changed to "In Progress"
  if (task.status === 'In Progress' && (!oldTask || oldTask.status !== 'In Progress')) {
    if (task.start_date) {
      const startDate = new Date(task.start_date);
      const actualStartDate = new Date();
      const timeDiff = actualStartDate - startDate;
      const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      if (daysDiff < 0) {
        score += 2; // Started early
      } else if (daysDiff === 0) {
        score += 1; // Started on time
      } else {
        score -= 1; // Started late
      }
    } else {
      score += 1; // No start date specified
    }
  }

  // Check if status changed to "Done"
  if (task.status === 'Done' && task.deadline &&
      (!oldTask || oldTask.status !== 'Done')) {
    const deadlineDate = new Date(task.deadline);
    const completionDate = new Date();
    const timeDiff = completionDate - deadlineDate;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (daysDiff < -1) {
      score += 2;
    } else if (daysDiff === 0) {
      score += 1;
    } else if (daysDiff > 0) {
      score -= 1;
    } else if (daysDiff === -1) {
      score += 1.5;
    }

    // Priority bonus
    switch(task.priority) {
      case 'High': score += 3; break;
      case 'Medium': score += 2; break;
      case 'Low': score += 1; break;
      default: break;
    }
  }

  return score;
};

// Update your startTask controller
exports.startTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const oldTask = await Task.findById(taskId);
    if (!oldTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (oldTask.status !== 'Not Started') {
      return res.status(400).json({ message: 'Task must be in "Not Started" status' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        status: 'In Progress',
        start_date: new Date() // Set actual start date
      },
      { new: true }
    );

    // Calculate and update score
    updatedTask.score = calculateTaskScore(updatedTask, oldTask);
    await updatedTask.save();

    res.status(200).json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error starting task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update your completeTask controller
exports.completeTask = async (req, res) => {
  const { taskId } = req.params;

  try {
    const oldTask = await Task.findById(taskId)
      .populate('assigned_to');

    if (!oldTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (oldTask.status !== 'In Progress') {
      return res.status(400).json({ message: 'Task must be in "In Progress" status' });
    }

    // Mettre à jour la tâche avec le statut "Done" et la date d'achèvement
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        status: 'Done',
        completion_date: new Date() // Ajouter la date d'achèvement
      },
      { new: true }
    );

    // Calculate and update score
    updatedTask.score = calculateTaskScore(updatedTask, oldTask);
    await updatedTask.save();

    // Mettre à jour le score de performance du membre d'équipe
    if (oldTask.assigned_to && oldTask.assigned_to.length > 0) {
      // Pour chaque membre d'équipe assigné à la tâche
      for (const teamMemberId of oldTask.assigned_to) {
        // Récupérer le membre d'équipe
        let teamMember = await TeamMember.findById(teamMemberId);

        // Si le membre d'équipe n'existe pas, on le crée avec l'ID du rôle Developer
        if (!teamMember) {
          console.log('Membre d\'équipe non trouvé, création d\'un nouveau membre...');

          // Récupérer les informations de la tâche pour obtenir le projet et l'utilisateur
          const task = await Task.findById(taskId).populate('project_id');
          if (!task || !task.project_id) {
            console.error('Impossible de créer un membre d\'équipe: tâche ou projet non trouvé');
            continue; // Passer au membre suivant
          }

          // Récupérer l'équipe associée au projet
          const team = await Team.findOne({ project_id: task.project_id._id });
          if (!team) {
            console.error('Impossible de créer un membre d\'équipe: équipe non trouvée pour le projet');
            continue; // Passer au membre suivant
          }

          // Créer un nouveau membre d'équipe sans spécifier le rôle
          teamMember = new TeamMember({
            team_id: team._id,
            user_id: teamMemberId, // Utiliser l'ID du membre comme ID utilisateur
            skills: [],
            performance_score: 0,
            total_tasks_completed: 0
          });

          try {
            await teamMember.save();
            console.log('Nouveau membre d\'équipe créé avec succès');
          } catch (memberError) {
            console.error('Erreur lors de la création du membre d\'équipe:', memberError);
            continue; // Passer au membre suivant
          }
        }

        // Si le membre d'équipe existe maintenant
        if (teamMember) {
          // Récupérer l'utilisateur associé au membre d'équipe
          const user = await User.findById(teamMember.user_id);
          if (!user) {
            console.error(`Utilisateur non trouvé pour le membre d'équipe ${teamMember._id}`);
            continue; // Passer au membre suivant
          }

          console.log('Utilisateur trouvé:', user._id);
          console.log('Score de performance actuel:', user.performancePoints || 0);

          // Calculer les points en fonction des critères
          let pointsEarned = 0;
          const completionDate = new Date(); // Date d'achèvement = maintenant
          const deadline = oldTask.deadline;

          // Définir diffHours en dehors du bloc conditionnel
          let diffHours = null;

          if (deadline) {
            // Calculer la différence entre la date d'achèvement et la date limite
            diffHours = (deadline - completionDate) / (1000 * 60 * 60);
            console.log('Différence en heures:', diffHours);

            if (diffHours < 0) {
              // Tâche en retard
              pointsEarned = -1;
              console.log('Tâche en retard, points gagnés:', pointsEarned);
            } else if (diffHours >= 2) {
              // Tâche terminée 2 heures ou plus avant la deadline
              pointsEarned = 3;
              console.log('Tâche terminée 2h+ avant deadline, points gagnés:', pointsEarned);
            } else if (diffHours >= 1) {
              // Tâche terminée 1 heure avant la deadline
              pointsEarned = 2;
              console.log('Tâche terminée 1h avant deadline, points gagnés:', pointsEarned);
            } else {
              // Tâche terminée dans le délai
              pointsEarned = 1;
              console.log('Tâche terminée dans le délai, points gagnés:', pointsEarned);
            }
          } else {
            console.log('Pas de deadline définie, points par défaut: 1');
            pointsEarned = 1; // Si pas de deadline, on donne 1 point par défaut
          }

          // Mettre à jour les statistiques du membre d'équipe
          const oldTotalTasks = teamMember.total_tasks_completed || 0;
          teamMember.total_tasks_completed = oldTotalTasks + 1;

          // Mettre à jour le taux de complétion du membre d'équipe
          if (teamMember.total_tasks_completed > 0) {
            // Récupérer la valeur de diffHours calculée précédemment ou définir une valeur par défaut
            // Si diffHours n'est pas défini (par exemple si pas de deadline), on suppose que la tâche est à l'heure
            const taskIsLate = deadline && diffHours < 0;

            const missedDeadlines = teamMember.missed_deadlines || 0;
            const newMissedDeadlines = taskIsLate ? missedDeadlines + 1 : missedDeadlines;
            teamMember.missed_deadlines = newMissedDeadlines;

            const tasksOnTime = teamMember.total_tasks_completed - newMissedDeadlines;
            teamMember.completion_rate = (tasksOnTime / teamMember.total_tasks_completed) * 100;
            console.log('- Taux de complétion: ' + teamMember.completion_rate.toFixed(2) + '%');
          }

          // Mettre à jour les statistiques du membre d'équipe dans la base de données
          try {
            const statsUpdateResult = await TeamMember.updateOne(
              { _id: teamMember._id },
              {
                $set: {
                  total_tasks_completed: teamMember.total_tasks_completed,
                  missed_deadlines: teamMember.missed_deadlines,
                  completion_rate: teamMember.completion_rate
                }
              }
            );

            console.log('Résultat de la mise à jour des statistiques du membre:', statsUpdateResult);

            // Mettre à jour le score de performance de l'utilisateur
            const success = await updateUserPerformanceScore(user._id, pointsEarned);

            if (success) {
              console.log(`Score de performance mis à jour avec succès pour l'utilisateur ${user._id}`);
            } else {
              console.error(`Échec de la mise à jour du score pour l'utilisateur ${user._id}`);
            }
          } catch (updateError) {
            console.error('Erreur lors de la mise à jour:', updateError);
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: updatedTask,
      message: 'Task completed successfully and performance scores updated'
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing task',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.generateTasksForProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;

    // Get the current user ID from the request
    const created_by = req.user._id;

    // Validate project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await generateAndFormatTasks(name, description, projectId, created_by);
    res.status(201).json(tasks);
  } catch (error) {
    handleTaskError(res, error);
  }
};

exports.generateTasksWithProject = async (req, res) => {
  try {
    const { projectId, name, description } = req.body;

    // Get the current user ID from the request
    const created_by = req.user._id;

    // Validate project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const tasks = await generateAndFormatTasks(name, description, projectId, created_by);
    res.status(201).json(tasks);
  } catch (error) {
    handleTaskError(res, error);
  }
};

// Shared helper functions
async function generateAndFormatTasks(name, description, projectId, created_by) {
  const aiResponse = await generateAITasks(name, description);
  const rawTasks = cleanAIResponse(aiResponse);

  const tasks = rawTasks.map(task => ({
    ...task,
    project_id: projectId,
    deadline: new Date(task.deadline),
    start_date: new Date(task.start_date),
    status: task.status || 'Not Started',
    assigned_to: [],
    created_by,
    requiredSkills: task.requiredSkills || [] // Ensure this exists
  }));

  return await Task.insertMany(tasks);
}

async function generateTasksWithoutSaving(name, description, projectId) {
  const aiResponse = await generateAITasks(projectId, name, description);
  const rawTasks = cleanAIResponse(aiResponse);

  return rawTasks.map(task => ({
    ...task,
    project_id: projectId,
    deadline: new Date(task.deadline),
    start_date: new Date(task.start_date),
    status: task.status || 'Not Started',
    assigned_to: [],
    requiredSkills: task.requiredSkills || [] // Ensure this exists
  }));
}


function cleanAIResponse(response) {
  const cleaned = response
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/, '')
    .trim();
  return JSON.parse(cleaned);
}

function handleTaskError(res, error) {
  console.error('Task generation error:', error);
  res.status(500).json({
    error: 'Failed to generate tasks',
    details: error.message
  });
}

// New controller function to generate tasks without saving them
exports.generateTasksOnly = async (req, res) => {
  try {
    const { projectId } = req.params.projectId ? { projectId: req.params.projectId } : req.body;
    const { name, description, start_date, end_date } = req.body;

    // Get the current user ID from the request (assuming you have authentication middleware)
    const created_by = req.user._id;

    // Validate project exists if projectId is provided
    if (projectId) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }
    }

    // Generate tasks without saving
    const tasks = await generateTasksWithoutSaving(name, description, projectId);

    // Add created_by to each task
    tasks.forEach(task => {
      task.created_by = created_by;
    });

    res.status(200).json({
      success: true,
      message: 'Tasks generated successfully (not saved)',
      data: tasks
    });
  } catch (error) {
    console.error('Error generating tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// New controller function to save previously generated tasks
exports.saveTasks = async (req, res) => {
  try {
    const { projectId, tasks } = req.body;

    // Get the current user ID from the request (assuming you have authentication middleware)
    const created_by = req.user._id;

    // Validate project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Validate tasks array
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tasks must be a non-empty array'
      });
    }

    // Format tasks for database
    const tasksToSave = tasks.map(task => ({
      title: task.title,
      description: task.description,
      project_id: projectId,
      status: task.status || 'Not Started',
      priority: task.priority || 'Medium',
      deadline: new Date(task.deadline),
      start_date: new Date(task.start_date),
      estimated_duration: task.estimated_duration || 1,
      tags: task.tags || [],
      assigned_to: task.assigned_to || [],
      requiredSkills: task.requiredSkills || [], // Include required skills
      created_by // Add the creator ID
    }));

    // Save tasks to database
    const savedTasks = await Task.insertMany(tasksToSave);

    // Update project with new tasks
    for (const task of savedTasks) {
      await Project.findByIdAndUpdate(
        projectId,
        {
          $push: { tasks: task._id },
          $inc: { total_tasks_count: 1 }
        }
      );
    }

    res.status(201).json({
      success: true,
      message: `${savedTasks.length} tasks saved successfully`,
      data: savedTasks
    });
  } catch (error) {
    console.error('Error saving tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


exports.getKanbanTasks = async (req, res) => {
  try {
      console.log('Getting kanban tasks for project:', req.params.projectId);

      // Find tasks for this project with populated data
      const tasks = await Task.find({ project_id: req.params.projectId })
          .populate('project_id', 'name description')
          .populate({
              path: 'assigned_to',
              select: 'role user_id',
              populate: {
                  path: 'user_id',
                  select: 'firstName lastName image'
              }
          })
          .sort({ order: 1 })
          .lean();

      console.log(`Found ${tasks.length} tasks for project ${req.params.projectId}`);

      // Group tasks by status
      const groupedTasks = {
          'Not Started': tasks.filter(t => t.status === 'Not Started')
                             .sort((a, b) => (a.order || 0) - (b.order || 0)),
          'In Progress': tasks.filter(t => t.status === 'In Progress')
                             .sort((a, b) => (a.order || 0) - (b.order || 0)),
          'In Review': tasks.filter(t => t.status === 'In Review')
                           .sort((a, b) => (a.order || 0) - (b.order || 0)),
          'Done': tasks.filter(t => t.status === 'Done')
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
      };

      res.json(groupedTasks);
  } catch (error) {
      console.error('Error fetching kanban tasks:', error);
      res.status(500).json({
          success: false,
          message: 'Error fetching kanban tasks',
          error: error.message
      });
  }
};

// Update task status and order
exports.updateTaskStatus = async (req, res) => {
  try {
      const { taskId } = req.params;
      const { status, order } = req.body;

      // Récupérer la tâche avant la mise à jour
      const oldTask = await Task.findById(taskId)
        .populate('assigned_to');

      if (!oldTask) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Préparer les données de mise à jour
      const updateData = { status, order };

      // Si le statut passe à "Done", ajouter la date d'achèvement
      if (status === 'Done' && oldTask.status !== 'Done') {
        updateData.completion_date = new Date();
      }

      // Mettre à jour la tâche
      const updatedTask = await Task.findByIdAndUpdate(
          taskId,
          updateData,
          { new: true }
      );

      // Si le statut passe à "Done", mettre à jour le score de performance des membres d'équipe
      if (status === 'Done' && oldTask.status !== 'Done' && oldTask.assigned_to && oldTask.assigned_to.length > 0) {
        console.log('Mise à jour du score de performance pour les membres d\'équipe:', oldTask.assigned_to);

        // Pour chaque membre d'équipe assigné à la tâche
        for (const teamMemberId of oldTask.assigned_to) {
          console.log('Traitement du membre d\'équipe:', teamMemberId);

          // Récupérer le membre d'équipe
          let teamMember = await TeamMember.findById(teamMemberId);
          console.log('Membre d\'équipe trouvé:', teamMember ? 'Oui' : 'Non');

          // Si le membre d'équipe n'existe pas, on le crée avec l'ID du rôle Developer
          if (!teamMember) {
            console.log('Membre d\'équipe non trouvé, création d\'un nouveau membre...');

            // Récupérer les informations de la tâche pour obtenir le projet et l'utilisateur
            const task = await Task.findById(taskId).populate('project_id');
            if (!task || !task.project_id) {
              console.error('Impossible de créer un membre d\'équipe: tâche ou projet non trouvé');
              continue; // Passer au membre suivant
            }

            // Récupérer l'équipe associée au projet
            const team = await Team.findOne({ project_id: task.project_id._id });
            if (!team) {
              console.error('Impossible de créer un membre d\'équipe: équipe non trouvée pour le projet');
              continue; // Passer au membre suivant
            }

            // Créer un nouveau membre d'équipe sans spécifier le rôle
            teamMember = new TeamMember({
              team_id: team._id,
              user_id: teamMemberId, // Utiliser l'ID du membre comme ID utilisateur
              skills: [],
              performance_score: 0,
              total_tasks_completed: 0
            });

            try {
              await teamMember.save();
              console.log('Nouveau membre d\'équipe créé avec succès');
            } catch (memberError) {
              console.error('Erreur lors de la création du membre d\'équipe:', memberError);
              continue; // Passer au membre suivant
            }
          }

          // Si le membre d'équipe existe maintenant
          if (teamMember) {
            // Récupérer l'utilisateur associé au membre d'équipe
            const user = await User.findById(teamMember.user_id);
            if (!user) {
              console.error(`Utilisateur non trouvé pour le membre d'équipe ${teamMember._id}`);
              continue; // Passer au membre suivant
            }

            console.log('Utilisateur trouvé:', user._id);
            console.log('Score de performance actuel:', user.performancePoints || 0);

            // Calculer les points en fonction des critères
            let pointsEarned = 0;
            const completionDate = new Date(); // Date d'achèvement = maintenant
            const deadline = oldTask.deadline;

            // Définir diffHours en dehors du bloc conditionnel
            let diffHours = null;

            if (deadline) {
              // Calculer la différence entre la date d'achèvement et la date limite
              diffHours = (deadline - completionDate) / (1000 * 60 * 60);
              console.log('Différence en heures:', diffHours);

              if (diffHours < 0) {
                // Tâche en retard
                pointsEarned = -1;
                console.log('Tâche en retard, points gagnés:', pointsEarned);
              } else if (diffHours >= 2) {
                // Tâche terminée 2 heures ou plus avant la deadline
                pointsEarned = 3;
                console.log('Tâche terminée 2h+ avant deadline, points gagnés:', pointsEarned);
              } else if (diffHours >= 1) {
                // Tâche terminée 1 heure avant la deadline
                pointsEarned = 2;
                console.log('Tâche terminée 1h avant deadline, points gagnés:', pointsEarned);
              } else {
                // Tâche terminée dans le délai
                pointsEarned = 1;
                console.log('Tâche terminée dans le délai, points gagnés:', pointsEarned);
              }
            } else {
              console.log('Pas de deadline définie, points par défaut: 1');
              pointsEarned = 1; // Si pas de deadline, on donne 1 point par défaut
            }

            // Mettre à jour les statistiques du membre d'équipe
            const oldTotalTasks = teamMember.total_tasks_completed || 0;
            teamMember.total_tasks_completed = oldTotalTasks + 1;

            // Mettre à jour le taux de complétion du membre d'équipe
            if (teamMember.total_tasks_completed > 0) {
              // Récupérer la valeur de diffHours calculée précédemment ou définir une valeur par défaut
              // Si diffHours n'est pas défini (par exemple si pas de deadline), on suppose que la tâche est à l'heure
              const taskIsLate = deadline && diffHours < 0;

              const missedDeadlines = teamMember.missed_deadlines || 0;
              const newMissedDeadlines = taskIsLate ? missedDeadlines + 1 : missedDeadlines;
              teamMember.missed_deadlines = newMissedDeadlines;

              const tasksOnTime = teamMember.total_tasks_completed - newMissedDeadlines;
              teamMember.completion_rate = (tasksOnTime / teamMember.total_tasks_completed) * 100;
              console.log('- Taux de complétion: ' + teamMember.completion_rate.toFixed(2) + '%');
            }

            // Mettre à jour les statistiques du membre d'équipe dans la base de données
            try {
              const statsUpdateResult = await TeamMember.updateOne(
                { _id: teamMember._id },
                {
                  $set: {
                    total_tasks_completed: teamMember.total_tasks_completed,
                    missed_deadlines: teamMember.missed_deadlines,
                    completion_rate: teamMember.completion_rate
                  }
                }
              );

              console.log('Résultat de la mise à jour des statistiques du membre:', statsUpdateResult);

              // Mettre à jour le score de performance de l'utilisateur
              const success = await updateUserPerformanceScore(user._id, pointsEarned);

              if (success) {
                console.log(`Score de performance mis à jour avec succès pour l'utilisateur ${user._id}`);
              } else {
                console.error(`Échec de la mise à jour du score pour l'utilisateur ${user._id}`);
              }
            } catch (updateError) {
              console.error('Erreur lors de la mise à jour:', updateError);
            }
          }
        }
      }

      res.json({
        success: true,
        data: updatedTask,
        message: status === 'Done' && oldTask.status !== 'Done' ?
          'Task marked as completed and performance scores updated' :
          'Task status updated successfully'
      });
  } catch (error) {
      console.error('Error updating task status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating task status',
        error: error.message
      });
  }
};

// Batch update task orders
exports.updateTaskOrders = async (req, res) => {
  try {
      const { updates } = req.body;

      const bulkOps = updates.map(update => ({
          updateOne: {
              filter: { _id: update.taskId },
              update: { $set: { order: update.order } }
          }
      }));

      await Task.bulkWrite(bulkOps);

      res.json({ success: true });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
};


exports.getDeveloperDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const teamMembers = await TeamMember.find({ user_id: userId });
    const teamMemberIds = teamMembers.map(member => member._id);

    const tasks = await Task.find({
      assigned_to: { $in: teamMemberIds }
    })
    .populate('project_id', 'name description')
    .populate({
      path: 'assigned_to',
      select: 'role user_id',
      populate: {
        path: 'user_id',
        select: 'firstName lastName image'
      }
    })
    .sort({ deadline: 1 })
    .lean();

    if (!tasks) {
      return res.status(404).json({
        success: false,
        message: 'No tasks found for this user'
      });
    }

    // Calculate task statistics
    const taskStats = {
      total: tasks.length || 0,
      notStarted: tasks.filter(t => t.status === 'Not Started').length || 0,
      inProgress: tasks.filter(t => t.status === 'In Progress').length || 0,
      inReview: tasks.filter(t => t.status === 'In Review').length || 0,
      completed: tasks.filter(t => t.status === 'Done').length || 0,
    };

    const timelineTasks = tasks
      .filter(task => task.deadline)
      .map(task => ({
        ...task,
        deadline: task.deadline.toISOString(),
        start_date: task.start_date?.toISOString() || task.created_at.toISOString()
      }));

    // Extract skills from tags
    const allSkills = {};
    tasks.forEach(task => {
      if (task.tags && Array.isArray(task.tags)) {
        task.tags.forEach(tag => {
          allSkills[tag] = (allSkills[tag] || 0) + 1;
        });
      }
    });

    // Approaching deadlines
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const approachingDeadlines = tasks.filter(task => {
      if (!task.deadline) return false;
      return task.deadline <= threeDaysFromNow && task.deadline >= now;
    });

    // Recently completed
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentlyCompleted = tasks.filter(task => {
      return task.status === 'Done' && task.updated_at >= sevenDaysAgo;
    }).slice(0, 5);

    // Get team memberships for this user
    const userTeamMemberships = await TeamMember.find({ user_id: userId }).distinct('team_id');

    // Get teams the user is part of
    const userTeams = await mongoose.model('team').find({
      $or: [
        { _id: { $in: userTeamMemberships } },
        { manager_id: userId }
      ]
    }).distinct('project_id');

    // Get projects the user is involved in
    const projects = await Project.aggregate([
      {
        $match: {
          $or: [
            { _id: { $in: userTeams.map(id => new mongoose.Types.ObjectId(id)) } },
            { manager_id: new mongoose.Types.ObjectId(userId) },
            { ProjectManager_id: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $lookup: {
          from: "tasks",
          localField: "_id",
          foreignField: "project_id",
          as: "tasks"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "ProjectManager_id",
          foreignField: "_id",
          as: "projectManager"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "manager_id",
          foreignField: "_id",
          as: "manager"
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          image: 1,
          repository: 1,
          teamMembers: 1,
          projectManager: { $arrayElemAt: ["$projectManager", 0] },
          manager: { $arrayElemAt: ["$manager", 0] },
          taskCount: { $size: "$tasks" },
          completedTasks: {
            $size: {
              $filter: {
                input: "$tasks",
                as: "task",
                cond: { $eq: ["$$task.status", "Done"] }
              }
            }
          }
        }
      },
      { $limit: 4 }
    ]);

    // Productivity metrics
    const completedThisWeek = recentlyCompleted.length || 0;
    const totalTasks = taskStats.total || 1;
    const productivityScore = Math.round((completedThisWeek / totalTasks) * 100);

    res.json({
      success: true,
      data: {
        taskStats,
        projects,
        approachingDeadlines,
        timelineTasks,
        recentlyCompleted,
        skills: Object.keys(allSkills).map(skill => ({
          name: skill,
          count: allSkills[skill]
        })),
        productivity: {
          score: productivityScore,
          completedThisWeek,
          overdueTasks: tasks.filter(t =>
            t.deadline && t.deadline < now && t.status !== 'Done'
          ).length || 0
        }
      }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while loading dashboard data',
      error: error.message
    });
  }
};

// controllers/taskController.js
exports.getDeveloperKanbanTasks = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware

    // 1. Find team members for this user
    const teamMembers = await TeamMember.find({ user_id: userId });
    const teamMemberIds = teamMembers.map(member => member._id);

    // 2. Find tasks assigned to these team members
    const tasks = await Task.find({ assigned_to: { $in: teamMemberIds } })
      .populate('project_id', 'name')
      .populate({
        path: 'assigned_to',
        select: 'role user_id',
        populate: {
          path: 'user_id',
          select: 'firstName lastName image'
        }
      })
      .sort({ order: 1 });

    // 3. Group by status
    const groupedTasks = {
      'Not Started': tasks.filter(t => t.status === 'Not Started'),
      'In Progress': tasks.filter(t => t.status === 'In Progress'),
      'In Review': tasks.filter(t => t.status === 'In Review'),
      'Done': tasks.filter(t => t.status === 'Done')
    };
    console.log('Grouped tasks:', groupedTasks);

    res.json({ success: true, data: groupedTasks });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching developer tasks',
      error: error.message
    });
  }
};

exports.getTaskByIdMember = async (req, res) => {
  try {
      const taskId = req.params.id;

      // Vérifier si l'ID est valide
      if (!mongoose.Types.ObjectId.isValid(taskId)) {
          return res.status(400).json({
              success: false,
              message: "ID de tâche invalide"
          });
      }

      // Récupérer la tâche avec les informations du projet associé
      const task = await Task.findById(taskId);

      if (!task) {
          return res.status(404).json({
              success: false,
              message: "Tâche non trouvée"
          });
      }

      // Formater la réponse
      const response = {
          _id: task._id,
          taskTitle: task.title,
          description: task.description,
          created_by: task.created_by,
          assigned_to: task.assigned_to ,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline,
          start_date: task.start_date,
          estimated_duration: task.estimated_duration,
          tags: task.tags,
          requiredSkills: task.requiredSkills,
      };

      console.log("Task response skills:", response.requiredSkills);

      res.status(200).json({
          success: true,
          data: response
      });
  } catch (error) {
      console.error("Erreur lors de la récupération de la tâche:", error);
      res.status(500).json({
          success: false,
          message: "Erreur serveur lors de la récupération de la tâche"
      });
  }
};

exports.getTasksList = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Récupérer l'utilisateur avec son rôle peuplé
    const user = await User.findById(userId).populate('role');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Récupérer les rôles une seule fois
    const [teamManager, developer] = await Promise.all([
      Role.findOne({ RoleName: 'Team Manager' }),
      Role.findOne({ RoleName: 'Developer' })
    ]);

    console.log("User role:", user.role._id);
    console.log("Team Manager ID:", teamManager._id);
    console.log("Developer ID:", developer._id);

    let tasks;
    console.log("User ID:", userId);

    if (user.role.equals(teamManager._id)) {
      tasks = await Task.find({ created_by: userId });
    } else if (user.role.equals(developer._id)) {
      tasks = await Task.find({ assigned_to: userId });
      console.log("Tasks for developer:", tasks);
    } else {
      // Rôle non reconnu
      return res.status(403).json({
        success: false,
        message: 'Unauthorized role',
        details: {
          userRole: user.role._id,
          allowedRoles: [teamManager._id, developer._id]
        }
      });
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error("Error in getTasksList:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


exports.updateTaskCalendarDates = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { start, end ,userId} = req.body;
    const user = await User.findById(userId);
    const team_manager = await Role.findOne({ RoleName: 'Team Manager' });
    const developer = await Role.findOne({ RoleName: 'Developer' });


    console.log("User ID from params:", userId); // Debug
    console.log("start:", start);
    console.log("end:", end);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const task = await Task.findById(taskId);
    console.log("Task :", task);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Vérifier les permissions
    if (user.role.equals(developer._id) && task.assigned_to.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    if (user.role.equals(team_manager._id) && task.created_by.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    let updateData = {};

    if (user.role.equals(team_manager._id)) {
      // Mise à jour des dates principales pour les managers
      if (start !== undefined) updateData.start_date = start;
      if (end !== undefined) updateData.deadline = end;
    } else if (user.role.equals(developer._id)) {
      // Mise à jour des dates du calendrier pour les développeurs
      if (start === null && end === null) {
        // Supprimer les dates du calendrier
        updateData = { $unset: { calendar_dates: 1 } };
      } else {
        // Mettre à jour les dates du calendrier
        updateData = { $set: {} };
        if (start !== undefined) updateData.$set['calendar_dates.start'] = start;
        if (end !== undefined) updateData.$set['calendar_dates.end'] = end;
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    console.error("Error updating calendar dates:", error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
};
exports.confirmAssignment = async (req, res) => {
  try {
    const { taskId, teamMemberId } = req.body;

    // Validate inputs
    if (!taskId || !teamMemberId) {
      return res.status(400).json({
        success: false,
        message: "Both taskId and teamMemberId are required"
      });
    }

    // 1. Update the task to add the team member
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { $addToSet: { assigned_to: teamMemberId } }, // Using $addToSet to avoid duplicates
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        message: "Task not found"
      });
    }

    // 2. Update the team member to add the task
    await TeamMember.findByIdAndUpdate(
      teamMemberId,
      { $addToSet: { tasks: taskId } },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Assignment confirmed successfully",
      data: updatedTask
    });

  } catch (error) {
    console.error("Error confirming assignment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};
exports.getTasksByUser = async (req, res) => {
  try {
    console.log("Request user object:", req.user);
    console.log("Authenticated user ID:", req.user._id);

    // Trouver d'abord tous les teamMembers où cet utilisateur est le user_id
    const teamMembers = await TeamMember.find({ user_id: req.user._id });

    // Extraire les IDs des teamMembers
    const teamMemberIds = teamMembers.map(member => member._id);

    const query = { assigned_to: { $in: teamMemberIds } };
    console.log("Query:", query);

    // Récupérer les tâches sans populate pour éviter l'erreur
    const tasks = await Task.find(query).lean();

    console.log("Found tasks:", tasks);

    if (!tasks.length) {
      console.log("No tasks found for user:", req.user._id);
      return res.status(200).json([]);
    }

    res.status(200).json(tasks);
  } catch (error) {
    console.error("Controller error:", error);
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

exports.getTasksByTeamMember = async (req, res) => {
    try {
        const teamMemberId = req.params.teamMemberId;
        
        const tasks = await Task.find({
            assigned_to: teamMemberId
        });

        const counts = {
            all: tasks.length
        };

        res.status(200).json({
            success: true,
            counts
        });
    } catch (error) {
        console.error('Error fetching team member tasks:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tasks',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
