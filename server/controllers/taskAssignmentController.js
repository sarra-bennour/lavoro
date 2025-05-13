const { spawn } = require('child_process');
const path = require('path');
const Task = require('../models/Task');
const TeamMember = require('../models/teamMember');
const mongoose = require('mongoose');

const runPythonScript = (scriptName, inputData) => {
  return new Promise((resolve, reject) => {


    const pythonProcess = spawn(
        'python',
        [
            path.join(__dirname, '..', 'ml_model', 'task_matcher.py')
        ],
        {
            cwd: path.join(__dirname, '..'), // Définit le répertoire de travail
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PYTHONUNBUFFERED: '1'
            }
        }
    );

    let output = '';
    let errors = '';

    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errors += data.toString();
    });

    const timeout = setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Python script timeout after 30s'));
    }, 30000);

    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 0 || errors) {
        reject(new Error(`Python error (code ${code}): ${errors}`));
      } else {
        try {
          resolve(JSON.parse(output));
        } catch (e) {
          reject(new Error('Failed to parse Python output'));
        }
      }
    });
  });
};

const taskMatchingController = {
  getTaskMatches: async (req, res) => {
    try {
      const { taskId } = req.params;
      const { topN = 5 } = req.query;

      if (!mongoose.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ error: 'Invalid task ID' });
      }

      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const members = await TeamMember.find().populate('skills');

      // Modifiez la préparation des données :
const inputData = {
    tasks: [ 
      {
        task_id: task._id.toString(),
        required_skills_list: task.requiredSkills,
        description: task.description || task.title
      }
    ],
    members: members.map(member => ({
      employer_id: member._id.toString(),
      employer_skills_list: member.skills.map(skill => skill.name),
      experience_level: member.experience_level,
      performance_score: member.performance_score
    })),
    topN: parseInt(topN)
  };

      const results = await runPythonScript('task_matcher.py', inputData);

      const enhancedMatches = await Promise.all(
        results.matches.map(async match => {
          const member = await TeamMember.findById(match.member_id)
            .populate('user_id')
            .populate('skills')
            .populate('team_id');

          return {
            ...match,
            member_details: {
              ...match.member_details,
              full_info: {
                _id: member._id,
                user: member.user_id,
                team: member.team_id,
                role: member.role,
                skills: member.skills,
                performance_metrics: {
                  experience_level: member.experience_level,
                  performance_score: member.performance_score
                }
              }
            }
          };
        })
      );

      res.json({
        success: true,
        task: {
          _id: task._id,
          title: task.title,
          description: task.description,
          requiredSkills: task.requiredSkills
        },
        matches: enhancedMatches
      });

    } catch (error) {
      console.error('Controller error:', error);
      res.status(500).json({ 
        error: 'Server error',
        details: error.message
      });
    }
  }
};

module.exports = taskMatchingController;