const Skills = require('../models/skills');

exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skills.find({});
    
    if (!skills || skills.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Aucun skill trouvé'
      });
    }


    res.status(200).json({
      success: true,
      count: skills.length,
      data: skills
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des skills:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des skills',
      error: error.message
    });
  }
};