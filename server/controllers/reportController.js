const Report = require('../models/Report');
const User = require('../models/user');
const Team = require('../models/team');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const TeamMember = require('../models/teamMember');

const { createNotification } = require('../utils/notification');

// Créer un nouveau rapport
exports.createReport = async (req, res) => {
    try {
        console.log('Tentative de création d\'un rapport...');
        console.log('Données reçues:', req.body);

        const {
            reported_user_id,
            project_id,
            reason,
            details,
            report_date,
            reporter_id // Pour les tests, on accepte l'ID du reporter dans le body
        } = req.body;

        // Pour le développement, désactivons temporairement la vérification d'authentification
        /*
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Vous devez être connecté pour signaler un membre'
            });
        }

        // Récupérer l'ID de l'utilisateur qui fait le rapport
        const reporter_id = req.user.id;
        */

        // Vérifier que le membre d'équipe rapporté existe
        console.log('Recherche du membre d\'équipe avec l\'ID:', reported_user_id);
        const reportedMember = await TeamMember.findById(reported_user_id);
        if (!reportedMember) {
            console.log('Membre d\'équipe non trouvé, vérification si c\'est un utilisateur...');
            // Si ce n'est pas un membre d'équipe, vérifier si c'est un utilisateur
            const reportedUser = await User.findById(reported_user_id);
            if (!reportedUser) {
                return res.status(404).json({
                    success: false,
                    message: 'L\'utilisateur ou le membre d\'équipe signalé n\'existe pas'
                });
            }
            console.log('Utilisateur trouvé:', reportedUser.firstName, reportedUser.lastName);
        } else {
            console.log('Membre d\'équipe trouvé:', reportedMember.firstName, reportedMember.lastName);
        }

        // Trouver l'équipe du membre rapporté
        let team_manager_id;
        try {
            const team = await Team.findOne({ members: reported_user_id });
            if (team) {
                team_manager_id = team.manager_id;
            } else {
                console.log('Aucune équipe trouvée pour l\'utilisateur, utilisation d\'un manager par défaut');
                // Pour les tests, si l'utilisateur n'appartient à aucune équipe, on utilise un manager par défaut
                // Récupérer le premier utilisateur avec le rôle de manager
                const manager = await User.findOne({ role: 'Team Manager' });
                if (manager) {
                    team_manager_id = manager._id;
                } else {
                    // Si aucun manager n'est trouvé, on utilise l'ID du reporter comme manager
                    team_manager_id = reporter_id;
                }
            }
        } catch (error) {
            console.error('Erreur lors de la recherche de l\'équipe:', error);
            // En cas d'erreur, on utilise l'ID du reporter comme manager
            team_manager_id = reporter_id;
        }

        // Créer le rapport
        const newReport = new Report({
            reported_user_id,
            reporter_id,
            team_manager_id,
            project_id,
            reason,
            details,
            report_date: report_date || new Date(),
            status: 'Pending'
        });

        // Sauvegarder le rapport
        await newReport.save();

        // Créer une notification pour le manager de l'équipe
        try {
            // Récupérer le nom du membre ou de l'utilisateur signalé
            let reportedName = 'Membre inconnu';
            if (reportedMember) {
                reportedName = `${reportedMember.firstName} ${reportedMember.lastName}`;
            } else {
                // Essayer de récupérer l'utilisateur à nouveau
                const reportedUser = await User.findById(reported_user_id);
                if (reportedUser) {
                    reportedName = `${reportedUser.firstName} ${reportedUser.lastName}`;
                }
            }

            await createNotification({
                user_id: team_manager_id,
                title: 'Nouveau signalement',
                message: `Un membre de votre équipe a été signalé: ${reportedName}`,
                type: 'warning',
                link: `/reports/${newReport._id}`
            });
        } catch (notifError) {
            console.error('Erreur lors de la création de la notification:', notifError);
            // On continue même si la notification échoue
        }

        // Retourner le rapport créé avec un message détaillé
        res.status(201).json({
            success: true,
            data: newReport,
            message: 'Rapport créé avec succès',
            details: {
                reportId: newReport._id,
                reportDate: newReport.report_date,
                status: newReport.status,
                reason: newReport.reason
            }
        });

    } catch (error) {
        console.error('Erreur lors de la création du rapport:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du rapport',
            error: error.message
        });
    }
};

// Récupérer tous les rapports
exports.getAllReports = async (req, res) => {
    try {
        // Pour le développement, désactivons temporairement la vérification d'authentification
        // pour faciliter les tests
        /*
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Vous devez être connecté pour voir les rapports'
            });
        }
        */

        console.log('Tentative de récupération des rapports...');

        // Vérifier si la collection existe
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log('Collections disponibles:', collectionNames);

        // Vérifier si des rapports existent
        const count = await Report.countDocuments();
        console.log(`La collection 'reports' contient ${count} documents`);

        // Si aucun rapport n'existe, retourner un tableau vide
        if (count === 0) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });
        }

        // Récupérer tous les rapports sans populate d'abord
        const reportsWithoutPopulate = await Report.find().sort({ created_at: -1 });
        console.log(`Rapports trouvés (sans populate): ${reportsWithoutPopulate.length}`);

        // Ensuite, essayer avec populate
        try {
            const reports = await Report.find()
                .populate({
                    path: 'reported_user_id',
                    select: 'firstName lastName email image',
                    model: 'teammembers'
                })
                .populate({
                    path: 'reporter_id',
                    select: 'firstName lastName email',
                    model: 'user'
                })
                .populate({
                    path: 'team_manager_id',
                    select: 'firstName lastName email',
                    model: 'user'
                })
                .populate({
                    path: 'project_id',
                    select: 'name description',
                    model: 'Project'
                })
                .sort({ created_at: -1 });

            console.log(`Rapports trouvés (avec populate): ${reports.length}`);

            return res.status(200).json({
                success: true,
                count: reports.length,
                data: reports
            });
        } catch (populateError) {
            console.error('Erreur lors du populate:', populateError);

            // En cas d'erreur avec populate, retourner les rapports sans populate
            return res.status(200).json({
                success: true,
                count: reportsWithoutPopulate.length,
                data: reportsWithoutPopulate,
                warning: 'Les références n\'ont pas pu être résolues'
            });
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des rapports:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des rapports',
            error: error.message
        });
    }
};

// Récupérer un rapport par son ID
exports.getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier que l'utilisateur est authentifié
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Vous devez être connecté pour voir ce rapport'
            });
        }

        // Récupérer le rapport avec les références
        const report = await Report.findById(id)
            .populate({
                path: 'reported_user_id',
                select: 'firstName lastName email image',
                model: 'teammembers'
            })
            .populate('reporter_id', 'firstName lastName email')
            .populate('team_manager_id', 'firstName lastName email')
            .populate('project_id', 'name description');

        if (!report) {
            return res.status(404).json({
                success: false,
                message: 'Rapport non trouvé'
            });
        }

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du rapport:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du rapport',
            error: error.message
        });
    }
};

// Mettre à jour le statut d'un rapport
exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Vérifier que l'utilisateur est authentifié
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Vous devez être connecté pour mettre à jour ce rapport'
            });
        }

        // Vérifier que le statut est valide
        const validStatuses = ['Pending', 'Under Review', 'Resolved', 'Dismissed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide'
            });
        }

        // Mettre à jour le rapport
        const updatedReport = await Report.findByIdAndUpdate(
            id,
            {
                status,
                updated_at: Date.now()
            },
            { new: true }
        )
        .populate({
            path: 'reported_user_id',
            select: 'firstName lastName email image',
            model: 'teammembers'
        })
        .populate('reporter_id', 'firstName lastName email')
        .populate('team_manager_id', 'firstName lastName email')
        .populate('project_id', 'name description');

        if (!updatedReport) {
            return res.status(404).json({
                success: false,
                message: 'Rapport non trouvé'
            });
        }

        // Créer une notification pour l'utilisateur qui a fait le rapport
        await createNotification({
            user_id: updatedReport.reporter_id._id,
            title: 'Mise à jour de votre signalement',
            message: `Le statut de votre signalement a été mis à jour: ${status}`,
            type: 'info',
            link: `/reports/${updatedReport._id}`
        });

        res.status(200).json({
            success: true,
            data: updatedReport,
            message: 'Statut du rapport mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut du rapport:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour du statut du rapport',
            error: error.message
        });
    }
};

// Récupérer les projets pour le formulaire de rapport
exports.getProjectsForReport = async (req, res) => {
    try {
        // Vérifier que l'utilisateur est authentifié
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                success: false,
                message: 'Vous devez être connecté pour voir les projets'
            });
        }

        console.log('Récupération des projets pour le formulaire de rapport...');

        // Récupérer tous les projets (actifs et archivés)
        const projects = await Project.find({})
        .select('_id name description status')
        .sort({ name: 1 });

        console.log(`Nombre de projets trouvés: ${projects.length}`);

        if (projects.length === 0) {
            // Si aucun projet n'est trouvé, vérifier si la collection existe et contient des données
            const collections = await mongoose.connection.db.listCollections().toArray();
            const collectionNames = collections.map(c => c.name);
            console.log('Collections disponibles:', collectionNames);

            if (collectionNames.includes('projects')) {
                const count = await Project.countDocuments();
                console.log(`La collection 'projects' contient ${count} documents`);
            }
        }

        res.status(200).json({
            success: true,
            count: projects.length,
            data: projects
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des projets:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des projets',
            error: error.message
        });
    }
};

/**
 * Supprimer un rapport par son ID
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 */
exports.deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('Tentative de suppression du rapport avec ID:', id);
        console.log('Paramètres de la requête:', req.params);

        // Vérifier que l'ID est valide
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.log('ID de rapport invalide:', id);
            return res.status(400).json({
                success: false,
                message: 'ID de rapport invalide'
            });
        }

        // Vérifier que le rapport existe
        console.log('Recherche du rapport dans la base de données...');
        const report = await Report.findById(id);

        if (!report) {
            console.log('Rapport non trouvé avec ID:', id);
            return res.status(404).json({
                success: false,
                message: 'Rapport non trouvé'
            });
        }

        console.log('Rapport trouvé:', report);

        // Supprimer le rapport
        console.log('Suppression du rapport...');
        await Report.findByIdAndDelete(id);
        console.log('Rapport supprimé avec succès');

        // Retourner une réponse de succès
        res.status(200).json({
            success: true,
            message: 'Rapport supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du rapport:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du rapport',
            error: error.message
        });
    }
};
