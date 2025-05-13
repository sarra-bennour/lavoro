const taskPrioritizationService = require('../services/taskPrioritizationService');
const Task = require('../models/Task');
const mongoose = require('mongoose');

// Obtenir les tâches priorisées pour l'utilisateur connecté
exports.getPrioritizedTasks = async (req, res) => {
    try {
        // Utiliser l'ID de l'utilisateur connecté
        const userId = req.user._id;
        
        // Obtenir les tâches priorisées
        const prioritizedTasks = await taskPrioritizationService.getPrioritizedTasksForUser(userId);
        
        res.status(200).json({
            success: true,
            count: prioritizedTasks.length,
            data: prioritizedTasks
        });
    } catch (error) {
        console.error('Error in getPrioritizedTasks:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des tâches priorisées',
            error: error.message
        });
    }
};

// Obtenir les tâches priorisées pour un projet spécifique
exports.getPrioritizedTasksForProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        
        // Vérifier si l'ID du projet est valide
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de projet invalide'
            });
        }
        
        // Obtenir les tâches priorisées pour le projet
        const prioritizedTasks = await taskPrioritizationService.getPrioritizedTasksForProject(projectId);
        
        res.status(200).json({
            success: true,
            count: prioritizedTasks.length,
            data: prioritizedTasks
        });
    } catch (error) {
        console.error('Error in getPrioritizedTasksForProject:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des tâches priorisées pour le projet',
            error: error.message
        });
    }
};

// Prioriser une liste de tâches fournie
exports.prioritizeTasks = async (req, res) => {
    try {
        const { tasks } = req.body;
        
        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Une liste de tâches valide est requise'
            });
        }
        
        // Prioriser les tâches
        const prioritizedTasks = await taskPrioritizationService.predictTaskPriorities(tasks);
        
        res.status(200).json({
            success: true,
            count: prioritizedTasks.length,
            data: prioritizedTasks
        });
    } catch (error) {
        console.error('Error in prioritizeTasks:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la priorisation des tâches',
            error: error.message
        });
    }
};
