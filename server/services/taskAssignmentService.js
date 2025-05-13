const { PythonShell } = require('python-shell');
const path = require('path');
const Task = require('../models/Task');
const TeamMember = require('../models/teamMember');
const NodeCache = require('node-cache');

// Cache predictions for 1 hour
const predictionCache = new NodeCache({ stdTTL: 3600 });

class TaskAssignmentService {
    constructor() {
        this.pythonShell = null;
       // this.initPythonShell();
    }

//    // initPythonShell() {
//         try {
//             this.pythonShell = new PythonShell('predict.py', {
//                 mode: 'json',
//                // pythonPath: 'C:\\Users\\LENOVO\\ \\pidev\\LAVORO\\LavoroBack\\ml_model\\.venv\\Scripts\\python.exe', 
//                 scriptPath: path.join(__dirname, '../ml_model'),
//                 pythonOptions: ['-u']
//             });

//             this.pythonShell.on('error', (err) => {
//                 console.error('PythonShell Error:', err);
//                 this.reconnectPythonShell();
//             });

//             this.pythonShell.on('close', () => {
//                 console.log('PythonShell closed, reconnecting...');
//                 this.reconnectPythonShell();
//             });

//             console.log('PythonShell initialized successfully');
//         } catch (err) {
//             console.error('Failed to initialize PythonShell:', err);
//         }
//     }

    // reconnectPythonShell() {
    //     if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    //     this.reconnectTimer = setTimeout(() => {
    //         this.initPythonShell();
    //     }, 5000);
    // }

    async predictMatch(requiredSkills, memberSkills) {
        const cacheKey = JSON.stringify({
            req: [...requiredSkills].sort(),
            mem: [...memberSkills].sort()
        });

        const cached = predictionCache.get(cacheKey);
        if (cached) return cached;

        return new Promise((resolve, reject) => {
            if (!this.pythonShell) {
                return reject(new Error('PythonShell not initialized'));
            }

            const timeout = setTimeout(() => {
                reject(new Error('Python prediction timeout'));
            }, 10000);

            this.pythonShell.send({
                required_skills: requiredSkills,
                member_skills: memberSkills
            });

            this.pythonShell.once('message', (message) => {
                clearTimeout(timeout);
                if (message.error) {
                    reject(new Error(message.error));
                } else {
                    predictionCache.set(cacheKey, message);
                    resolve(message);
                }
            });
        });
    }

    async findBestMatch(taskId, teamId) {
        try {
            const task = await Task.findById(taskId).lean();
            if (!task) throw new Error('Task not found');

            const teamMembers = await TeamMember.find({ team_id: teamId })
                .populate('skills', 'name -_id')
                .lean();

            if (teamMembers.length === 0) {
                throw new Error('No team members found');
            }

            const requiredSkills = task.requiredSkills;
            const membersWithScores = await Promise.all(
                teamMembers.map(async (member) => {
                    const memberSkills = member.skills.map(s => s.name);
                    try {
                        const prediction = await this.predictMatch(requiredSkills, memberSkills);
                        return {
                            memberId: member.user_id,
                            score: prediction.confidence,
                            skills: memberSkills,
                            matchDetails: prediction
                        };
                    } catch (err) {
                        console.error(`Prediction error for member ${member.user_id}:`, err);
                        return {
                            memberId: member.user_id,
                            score: 0,
                            skills: memberSkills,
                            error: err.message
                        };
                    }
                })
            );

            membersWithScores.sort((a, b) => b.score - a.score);
            const bestMatch = membersWithScores[0];

            return {
                taskId: task._id,
                taskTitle: task.title,
                requiredSkills,
                bestMatch,
                allMatches: membersWithScores
            };
        } catch (error) {
            console.error('Error in findBestMatch:', error);
            throw error;
        }
    }

    async assignTaskToMember(taskId, memberId) {
        try {
            return await Task.findByIdAndUpdate(
                taskId,
                {
                    assigned_to: memberId,
                    status: 'In Progress',
                    start_date: new Date()
                },
                { new: true }
            );
        } catch (error) {
            console.error('Error assigning task:', error);
            throw error;
        }
    }
}

module.exports = new TaskAssignmentService();