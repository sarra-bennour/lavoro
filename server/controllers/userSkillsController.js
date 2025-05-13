const User = require('../models/user');
const Skills = require('../models/skills');
const UserSkills = require('../models/UserSkills');



// Dans votre contrôleur (backend)
exports.getSkillsForMultipleUsers = async (req, res) => {
  try {
      const { userIds } = req.body;
      
      if (!userIds || !Array.isArray(userIds)) {
          return res.status(400).json({ 
              success: false, 
              message: 'User IDs array is required' 
          });
      }

      // Récupérer les compétences pour tous les utilisateurs en une seule requête
      const userSkills = await UserSkills.find({ 
          user_id: { $in: userIds }
      })
      .populate({
          path: 'skill_id',
          select: 'name'
      })
      .populate({
          path: 'user_id',
          select: 'firstName lastName image'
      });

      // Structurer les données par utilisateur
      const skillsByUser = {};
      
      userSkills.forEach(userSkill => {
          const userId = userSkill.user_id._id.toString();
          
          if (!skillsByUser[userId]) {
              skillsByUser[userId] = [];
          }

          // Parcourir toutes les compétences de l'utilisateur
          userSkill.skill_id.forEach(skill => {
              skillsByUser[userId].push({
                  _id: skill._id,
                  name: skill.name
              });
          });
      });

      console.log('Skills by user:', JSON.stringify(skillsByUser, null, 2)); // Debug

      res.status(200).json({ 
          success: true, 
          data: skillsByUser 
      });

  } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ 
          success: false, 
          message: 'Server error',
          error: error.message 
      });
  }
}


  exports.searchUsersBySkills = async (req, res) => {
    try {
      const { skillIds } = req.body;
      
      if (!skillIds || !Array.isArray(skillIds)) {
        return res.status(400).json({
          success: false,
          message: 'skillIds array is required'
        });
      }

      // Trouver tous les UserSkills qui contiennent AU MOINS UNE des compétences recherchées
      const userSkills = await UserSkills.find({
        skill_id: { $in: skillIds }
      })
      .populate({
        path: 'user_id',
        select: 'firstName lastName email image role'
      })
      .populate({
        path: 'skill_id',
        select: 'name'
      });

      // Grouper par utilisateur
      const usersMap = new Map();
      
      userSkills.forEach(userSkill => {
        const userId = userSkill.user_id._id.toString();
        
        if (!usersMap.has(userId)) {
          usersMap.set(userId, {
            ...userSkill.user_id._doc,
            skills: []
          });
        }
        
        // Filtrer seulement les compétences qui correspondent à la recherche
        const matchingSkills = userSkill.skill_id.filter(skill => 
          skillIds.includes(skill._id.toString())
        );
        
        // Ajouter les compétences correspondantes
        matchingSkills.forEach(skill => {
          usersMap.get(userId).skills.push({
            _id: skill._id,
            name: skill.name
          });
        });
      });

      const users = Array.from(usersMap.values());

      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error searching users by skills:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
};