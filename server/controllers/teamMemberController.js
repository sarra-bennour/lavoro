
const TeamMember = require('../models/teamMember');
const User = require('../models/user');
const Skills = require('../models/skills');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const Team = require('../models/team');
const Project = require('../models/Project');
const Role = require('../models/role');

// Récupérer l'utilisateur avec le meilleur score de performance
exports.getBestPerformer = async (req, res) => {
  try {
    // Trouver l'utilisateur avec le meilleur score de performance
    const bestPerformer = await User.findOne({
      performancePoints: { $gt: 0 } // Seulement les utilisateurs avec des scores positifs
    })
    .sort({ performancePoints: -1 }) // Trier par score de performance (décroissant)
    .limit(1); // Limiter à un seul résultat

    if (!bestPerformer) {
      return res.status(404).json({
        success: false,
        message: 'Aucun utilisateur avec un score de performance trouvé'
      });
    }

    // Récupérer les équipes dont l'utilisateur est membre
    const teamMemberships = await TeamMember.find({ user_id: bestPerformer._id })
      .populate('team_id', 'name')
      .populate('tasks');

    // Calculer des statistiques réelles basées sur les tâches
    let tasksCompleted = 0;
    let tasksEarly = 0;
    let tasksOnTime = 0;
    let tasksLate = 0;
    let totalPointsEarned = 0;
    let teamNames = [];

    // Parcourir toutes les appartenances d'équipe pour collecter les tâches
    teamMemberships.forEach(membership => {
      if (membership.team_id && membership.team_id.name) {
        teamNames.push(membership.team_id.name);
      }

      const tasks = membership.tasks || [];

      // Parcourir les tâches pour calculer les statistiques
      tasks.forEach(task => {
        if (task.status === 'completed' || task.status === 'Done') {
          tasksCompleted++;

          // Calculer la différence entre la date d'achèvement et la date limite
          const completionDate = new Date(task.completion_date);
          const deadline = new Date(task.deadline);

          // Calculer la différence en heures
          const diffHours = (deadline - completionDate) / (1000 * 60 * 60);

          if (diffHours < 0) {
            // Tâche en retard
            tasksLate++;
            totalPointsEarned -= 1; // -1 point pour une tâche en retard
          } else if (diffHours >= 2) {
            // Tâche terminée 2 heures ou plus avant la deadline
            tasksEarly++;
            totalPointsEarned += 3; // +3 points
          } else if (diffHours >= 1) {
            // Tâche terminée 1 heure avant la deadline
            tasksEarly++;
            totalPointsEarned += 2; // +2 points
          } else {
            // Tâche terminée dans le délai
            tasksOnTime++;
            totalPointsEarned += 1; // +1 point
          }
        }
      });
    });

    const completionRate = tasksCompleted > 0
      ? ((tasksEarly + tasksOnTime) / tasksCompleted) * 100
      : 0;

    // Formater la réponse
    const performerWithStats = {
      id: bestPerformer._id,
      firstName: bestPerformer.firstName,
      lastName: bestPerformer.lastName,
      image: bestPerformer.image,
      email: bestPerformer.email,
      teamNames: teamNames.join(', '),
      performancePoints: bestPerformer.performancePoints,
      stats: {
        tasksCompleted,
        tasksEarly,
        tasksOnTime,
        tasksLate,
        completionRate,
        totalPointsEarned
      }
    };

    res.status(200).json(performerWithStats);
  } catch (error) {
    console.error('Erreur lors de la récupération du meilleur performeur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Récupérer les meilleurs performeurs (top N)
exports.getTopPerformers = async (req, res) => {
  try {
    // Récupérer le nombre de performeurs à afficher (par défaut 3)
    const limit = parseInt(req.query.limit) || 3;

    // Trouver les utilisateurs avec les meilleurs scores de performance
    const topPerformers = await User.find({
      performancePoints: { $gt: 0 } // Seulement les utilisateurs avec des scores positifs
    })
    .sort({ performancePoints: -1 }) // Trier par score de performance (décroissant)
    .limit(limit); // Limiter au nombre demandé

    if (topPerformers.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun utilisateur avec un score de performance trouvé'
      });
    }

    // Formater la réponse pour chaque performeur avec des statistiques réelles
    const performersWithStats = await Promise.all(topPerformers.map(async (performer) => {
      // Récupérer les équipes dont l'utilisateur est membre
      const teamMemberships = await TeamMember.find({ user_id: performer._id })
        .populate('team_id', 'name')
        .populate('tasks');

      // Calculer des statistiques réelles basées sur les tâches
      let tasksCompleted = 0;
      let tasksEarly = 0;
      let tasksOnTime = 0;
      let tasksLate = 0;
      let totalPointsEarned = 0;
      let teamNames = [];

      // Parcourir toutes les appartenances d'équipe pour collecter les tâches
      teamMemberships.forEach(membership => {
        if (membership.team_id && membership.team_id.name) {
          teamNames.push(membership.team_id.name);
        }

        const tasks = membership.tasks || [];

        // Parcourir les tâches pour calculer les statistiques
        tasks.forEach(task => {
          if (task.status === 'completed' || task.status === 'Done') {
            tasksCompleted++;

            // Calculer la différence entre la date d'achèvement et la date limite
            const completionDate = new Date(task.completion_date);
            const deadline = new Date(task.deadline);

            // Calculer la différence en heures
            const diffHours = (deadline - completionDate) / (1000 * 60 * 60);

            if (diffHours < 0) {
              // Tâche en retard
              tasksLate++;
              totalPointsEarned -= 1; // -1 point pour une tâche en retard
            } else if (diffHours >= 2) {
              // Tâche terminée 2 heures ou plus avant la deadline
              tasksEarly++;
              totalPointsEarned += 3; // +3 points
            } else if (diffHours >= 1) {
              // Tâche terminée 1 heure avant la deadline
              tasksEarly++;
              totalPointsEarned += 2; // +2 points
            } else {
              // Tâche terminée dans le délai
              tasksOnTime++;
              totalPointsEarned += 1; // +1 point
            }
          }
        });
      });

      const completionRate = tasksCompleted > 0
        ? ((tasksEarly + tasksOnTime) / tasksCompleted) * 100
        : 0;

      return {
        id: performer._id,
        firstName: performer.firstName,
        lastName: performer.lastName,
        fullName: `${performer.firstName} ${performer.lastName}`,
        image: performer.image,
        teamNames: teamNames.join(', '),
        points: performer.performancePoints,
        stats: {
          tasksCompleted,
          tasksEarly,
          tasksOnTime,
          tasksLate,
          completionRate,
          totalPointsEarned
        }
      };
    }));

    res.status(200).json(performersWithStats);
  } catch (error) {
    console.error('Erreur lors de la récupération des meilleurs performeurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};


exports.getTeamMemberById = async (req, res) => {
  try {
    const { id } = req.params; // Maintenant on utilise l'ID direct du User

    // Recherche le TeamMember par l'ID du User
    const teamMember = await TeamMember.findOne({ user_id: id })
      .populate('user_id')
      .populate('skills');

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found for this user ID'
      });
    }

    // Construction de la réponse
    const responseData = {
      id: teamMember._id,
      teamId: teamMember.team_id,
      name: teamMember.user_id
        ? `${teamMember.user_id.firstName || ''} ${teamMember.user_id.lastName || ''}`.trim()
        : 'Unknown',
      role: teamMember.role,
      email: teamMember.user_id?.email || '',
      image: teamMember.user_id?.image || '',
      phone: teamMember.user_id?.phone_number || '',
      skills: teamMember.skills?.map(skill => ({
        id: skill._id,
        name: skill.name || 'Unnamed Skill',
        description: skill.description || ''
      })) || [],
      performance_score: teamMember.performance_score,
      completed_tasks_count: teamMember.completed_tasks_count,
      joined_at: teamMember.joined_at
    };

    res.status(200).json({ success: true, data: responseData });

  } catch (error) {
    console.error('Error fetching team member by user ID:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching team member',
      error: error.message
    });
  }
};

exports.getTeamMembersByTeamId = async (req, res) => {
  try {
    const { teamId } = req.params;

    //   Récupère les membres de l'équipe avec les infos utilisateur et compétences
    const members = await TeamMember.find({ team_id: teamId })
      .populate('user_id', 'firstName lastName image')
      .populate('skills', 'name');

      if (!members) {
        return res.status(404).json({ success: false, message: 'Team members not found' });
      }

    // Formate la réponse
    const result = members.map(member => ({
      id: member._id,
      name: member.user_id ? `${member.user_id.firstName} ${member.user_id.lastName}` : 'Membre inconnu',
      image: member.user_id?.image || '',
      role: member.role,
      skills: member.skills?.map(s => s.name) || [],
      performance: member.performance_score,
      tasksCompleted: member.completed_tasks_count
    }));

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des membres'
    });
  }
};


exports.addTeamMember = async (req, res) => {
  try {
      const { team_id, user_id, skills } = req.body;

      // Validation des données requises
      if (!team_id || !user_id || !skills || !Array.isArray(skills)) {
          return res.status(400).json({
              success: false,
              message: 'team_id, user_id et skills (tableau) sont requis'
          });
      }

      // Vérification si le membre existe déjà dans l'équipe
      const existingMember = await TeamMember.findOne({
          team_id: team_id,
          user_id: user_id
      });

      if (existingMember) {
          return res.status(409).json({
              success: false,
              message: 'Cet utilisateur est déjà membre de cette équipe'
          });
      }

      // Récupération des informations de l'utilisateur, équipe et projet
      const [user, team, project] = await Promise.all([
          User.findById(user_id),
          Team.findById(team_id),
          Project.findOne({ manager_id: team_id }) // Supposons que vous avez un modèle Project
      ]);

      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'Utilisateur non trouvé'
          });
      }

      // Création du nouveau membre d'équipe sans spécifier le rôle
      const newTeamMember = new TeamMember({
          team_id: team_id,
          user_id: user_id,
          skills: skills,
          performance_score: 0,
          completed_tasks_count: 0
      });

      // Sauvegarde dans la base de données
      const savedMember = await newTeamMember.save();

      // Configuration du transporteur email
      const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
          }
      });

      // URL de connexion (à adapter selon votre frontend)
      const loginUrl = `localhost:4200/signin`;

      // Options de l'email avec template amélioré
      const mailOptions = {
          from: `"Gestion d'Équipe" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: `Invitation à l'équipe ${team?.name || ''}`,
          html: `
          <div style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #fff; max-width: 600px; margin: auto; border-radius: 10px; overflow: hidden;">
            <div style="background-color: #1a1a1a; padding: 20px; text-align: center;">
              <h1 style="color: #ff33cc; text-shadow: 0 0 10px #ff33cc;">🚀 Bienvenue dans l'équipe !</h1>
            </div>

            <div style="padding: 20px;">
              <p>Bonjour <strong>${user.name || 'Cher collaborateur'}</strong>,</p>
              <p>Vous avez été ajouté à :</p>
              <ul style="list-style-type: none; padding: 0;">
                <li><strong>👥 Équipe :</strong> ${team?.name || 'Nouvelle équipe'}</li>
                <li><strong>📁 Projet :</strong> ${project?.name || 'Nouveau projet'}</li>
                <li><strong>🎯 Rôle :</strong> Developer</li>
                <li><strong>🧠 Compétences :</strong> ${skills.join(', ')}</li>
              </ul>

              <p style="margin-top: 30px;">Cliquez ci-dessous pour accéder à votre espace :</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/ProjectDash"
                  style="background: linear-gradient(90deg, #ff33cc, #cc00ff);
                          color: white; padding: 15px 30px;
                          border-radius: 30px; font-weight: bold;
                          text-decoration: none; font-size: 16px;
                          box-shadow: 0 0 15px #ff33cc, 0 0 30px #cc00ff;">
                  🎉 Accéder à mon espace
                </a>
              </div>

              <p>Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :</p>
              <p style="color: #ff33cc; word-break: break-all;">http://localhost:4200/dashboard</p>
            </div>

            <div style="background-color: #1a1a1a; padding: 15px; text-align: center; font-size: 12px; color: #aaa;">
              <p>© ${new Date().getFullYear()} Votre Société. Tous droits réservés.</p>
            </div>
          </div>
          `
      };

      // Affichage des détails avant envoi
      console.log('====================================');
      console.log('Envoi d\'email à:', user.email);
      console.log('Sujet:', mailOptions.subject);
      console.log('URL de connexion:', loginUrl);
      console.log('====================================');

      // Envoi de l'email
      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.error('Échec de l\'envoi:', error);
          } else {
              console.log('Email envoyé avec succès. ID:', info.messageId);
          }
      });

      res.status(201).json({
          success: true,
          message: 'Membre ajouté avec succès',
          data: savedMember,
          emailSentTo: user.email
      });

  } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({
          success: false,
          message: 'Erreur serveur',
          error: error.message
      });
  }
};








// In your backend controller
exports.getAllMemberTask = async (req, res) => {
  try {
    const members = await TeamMember.find({})
      .populate('user_id', 'firstName lastName image')
      .lean();

    // Filter out any invalid members
    const validMembers = members.filter(member => member?._id);

    res.status(200).json({
      success: true,
      data: validMembers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching team members'
    });
  }
};



exports.getAllMembers = async (req, res) => {
  try {
    const members = await TeamMember.find()
      .populate('user_id', 'firstName lastName image')
      .populate('skills', 'name');

    if (!members) {
      return res.status(404).json({ success: false, message: 'No team members found' });
    }

    const result = members.map(member => ({
      id: member._id,
      user_id: member.user_id?._id, // Include the user_id._id
      name: member.user_id ? `${member.user_id.firstName} ${member.user_id.lastName}` : 'Unknown',
      image: member.user_id?.image || '',
      role: member.role,
      skills: member.skills?.map(s => s.name) || [],
      performance: member.performance_score,
      tasksCompleted: member.completed_tasks_count
    }));

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error fetching team members'
    });
  }
};


// Fonction utilitaire pour mettre à jour le score de performance
const updateMemberScore = async (teamMemberId, pointsToAdd) => {
  try {
    console.log(`Mise à jour directe du score pour le membre ${teamMemberId}, points à ajouter: ${pointsToAdd}`);

    // Récupérer le membre actuel pour obtenir son score
    const member = await TeamMember.findById(teamMemberId);
    if (!member) {
      console.error(`Membre d'équipe non trouvé: ${teamMemberId}`);
      return null;
    }

    // Calculer le nouveau score
    const currentScore = member.performance_score || 0;
    const newScore = Math.max(0, currentScore + pointsToAdd);

    console.log(`Score actuel: ${currentScore}, Nouveau score: ${newScore}`);

    // Mettre à jour directement dans la base de données
    const result = await TeamMember.updateOne(
      { _id: teamMemberId },
      { $set: { performance_score: newScore } }
    );

    console.log(`Résultat de la mise à jour:`, result);

    if (result.modifiedCount === 1) {
      console.log(`Score mis à jour avec succès pour ${teamMemberId}`);
      return newScore;
    } else {
      console.error(`Échec de la mise à jour du score pour ${teamMemberId}`);
      return null;
    }
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du score:`, error);
    return null;
  }
};

// Fonction pour mettre à jour directement le score de performance d'un membre d'équipe
exports.updatePerformanceScore = async (req, res) => {
  try {
    const { teamMemberId } = req.params;
    const { points } = req.body;

    if (!teamMemberId || points === undefined) {
      return res.status(400).json({
        success: false,
        message: 'teamMemberId et points sont requis'
      });
    }

    // Utiliser la fonction utilitaire pour mettre à jour le score
    const newScore = await updateMemberScore(teamMemberId, parseInt(points));

    if (newScore === null) {
      return res.status(500).json({
        success: false,
        message: 'Échec de la mise à jour du score de performance'
      });
    }

    // Récupérer le membre mis à jour pour la réponse
    const updatedMember = await TeamMember.findById(teamMemberId);

    console.log('Membre récupéré après mise à jour:', updatedMember);
    console.log('Score vérifié après mise à jour:', updatedMember.performance_score);

    res.status(200).json({
      success: true,
      message: 'Score de performance mis à jour avec succès',
      data: {
        teamMemberId: updatedMember._id,
        oldScore: currentScore,
        newScore: updatedMember.performance_score,
        pointsAdded: parseInt(points)
      }
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du score de performance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.getAll = async (req, res) => {
  try {
      // Récupérer tous les membres d'équipe avec les informations utilisateur associées
      const members = await TeamMember.find()
          .populate({
              path: 'user_id',
              select: 'name email image firstName lastName', // Sélectionnez les champs que vous voulez de l'utilisateur
              model: User
          })
          .populate('skills');

      // Formater la réponse pour inclure l'image et autres détails
      const formattedMembers = members.map(member => ({
          _id: member._id,
          team_id: member.team_id,
          user: {
              _id: member.user_id._id,
              firstName: member.user_id.firstName,
              lastName: member.user_id.lastName,
              image: member.user_id.image // URL de l'image du membre
          },
          role: member.role,
          skills: member.skills,
          performance_score: member.performance_score,
          completed_tasks_count: member.completed_tasks_count
      }));

      res.status(200).json({
          success: true,
          data: formattedMembers
      });
  } catch (error) {
      console.error("Erreur lors de la récupération des membres:", error);
      res.status(500).json({
          success: false,
          message: "Erreur serveur lors de la récupération des membres"
      });
  }
};

// Mettre à jour les scores de performance des membres d'équipe
exports.updatePerformanceScores = async (req, res) => {
  try {
    // Récupérer tous les membres d'équipe avec leurs tâches
    const members = await TeamMember.find()
      .populate('tasks');

    if (!members || members.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun membre d\'équipe trouvé'
      });
    }

    // Tableau pour stocker les résultats des mises à jour
    const updateResults = [];

    // Traiter chaque membre d'équipe
    for (const member of members) {
      // Calculer des statistiques réelles basées sur les tâches
      const tasks = member.tasks || [];
      let tasksCompleted = 0;
      let tasksEarly = 0;
      let tasksOnTime = 0;
      let tasksLate = 0;
      let totalPointsEarned = 0;

      // Parcourir les tâches pour calculer les statistiques
      tasks.forEach(task => {
        if (task.status === 'completed') {
          tasksCompleted++;

          // Calculer la différence entre la date d'achèvement et la date limite
          const completionDate = new Date(task.completion_date);
          const deadline = new Date(task.deadline);

          // Calculer la différence en heures
          const diffHours = (deadline - completionDate) / (1000 * 60 * 60);

          if (diffHours < 0) {
            // Tâche en retard
            tasksLate++;
            totalPointsEarned -= 1; // -1 point pour une tâche en retard
          } else if (diffHours >= 2) {
            // Tâche terminée 2 heures ou plus avant la deadline
            tasksEarly++;
            totalPointsEarned += 3; // +3 points
          } else if (diffHours >= 1) {
            // Tâche terminée 1 heure avant la deadline
            tasksEarly++;
            totalPointsEarned += 2; // +2 points
          } else {
            // Tâche terminée dans le délai
            tasksOnTime++;
            totalPointsEarned += 1; // +1 point
          }
        }
      });

      // Mettre à jour le membre d'équipe avec les nouvelles statistiques
      member.total_tasks_completed = tasksCompleted;
      member.missed_deadlines = tasksLate;
      member.performance_score = Math.max(0, totalPointsEarned); // Assurer que le score n'est pas négatif

      // Calculer d'autres métriques de performance
      if (tasksCompleted > 0) {
        member.completion_rate = ((tasksEarly + tasksOnTime) / tasksCompleted) * 100;
        member.task_efficiency = (tasksEarly / tasksCompleted) * 100;
        member.deadline_adherence = ((tasksCompleted - tasksLate) / tasksCompleted) * 100;
      }

      // Sauvegarder les modifications
      await member.save();

      // Ajouter le résultat à notre tableau
      updateResults.push({
        memberId: member._id,
        name: member.user_id ? `${member.user_id.firstName} ${member.user_id.lastName}` : 'Inconnu',
        newPerformanceScore: member.performance_score,
        tasksCompleted,
        tasksEarly,
        tasksOnTime,
        tasksLate
      });
    }

    res.status(200).json({
      success: true,
      message: `Scores de performance mis à jour pour ${updateResults.length} membres d'équipe`,
      data: updateResults
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des scores de performance:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};


// exports.getTeamMemberById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const teamMember = await TeamMember.findById(id)
//       .populate('user_id')
//       .populate('skills');

//     if (!teamMember) {
//       return res.status(404).json({ success: false, message: 'Team member not found' });
//     }

//     // Construction de la réponse
//     const responseData = {
//       id: teamMember._id,
//       teamId: teamMember.team_id,
//       name: teamMember.user_id
//         ? `${teamMember.user_id.firstName || ''} ${teamMember.user_id.lastName || ''}`.trim()
//         : 'Unknown',
//       role: teamMember.role,
//       email: teamMember.user_id?.email || '',
//       image: teamMember.user_id?.image || '',
//       phone: teamMember.user_id?.phone_number || '',
//       skills: teamMember.skills?.map(skill => ({
//         id: skill._id,
//         name: skill.name || 'Unnamed Skill',
//         description: skill.description || ''
//       })) || [],
//       performance_score: teamMember.performance_score,
//       completed_tasks_count: teamMember.completed_tasks_count,
//       joined_at: teamMember.joined_at
//     };

//     res.status(200).json({ success: true, data: responseData });

//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// };

