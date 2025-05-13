const express = require('express');
const router = express.Router();

const ProjectController = require('../controllers/projectController');

const { getProjectsByStatus } = require('../controllers/projectController'); // Importez la fonction du contrôleur
const Project = require('../models/Project');




router.get('/', ProjectController.getAllProjects);


router.get('/dash', ProjectController.getAllProjectss);


router.get('/projects-with-progress', ProjectController.getProjectsWithProgress);

router.get('/projetStatus', async (req, res) => {
    try {
        const projectsByStatus = await ProjectController.getProjectsByStatus();
        res.json(projectsByStatus);
    } catch (err) {
        console.error('Error in /projects-by-status route:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.get('/managed-by-me',  ProjectController.getManagedProjects);


router.post('/createProject', ProjectController.createProject);
router.post('/createProjectWithAI', ProjectController.createProjectWithAI);
router.post('/generateAISuggestions', ProjectController.generateAISuggestions);
router.get('/getProjectById/:id', ProjectController.getProjectById);
router.get('/getProjectByName', ProjectController.getProjectByName);
router.put('/updateProjects/:id', ProjectController.updateProjects);
router.delete('/deleteProject/:id', ProjectController.deleteProject);
router.get('/countProject', ProjectController.getProjectCount);

router.get('/countArchive', ProjectController.getArchiveCount);



router.get('/archived-projects', ProjectController.getAllArchivedProjects);
router.get('/export-archived', ProjectController.exportArchivedProjects);





router.post('/:id/start', ProjectController.startProject);
router.get('/:id/history', ProjectController.getProjectHistory); // Add this route
router.get('/:id', ProjectController.getProjectById); // Add this route
router.post('/:id/archive', ProjectController.archiveProject);
router.post('/:id/unarchive', ProjectController.unarchiveProject);
router.delete('/archived-projects/:id', ProjectController.deleteArchivedProject);
router.get('/archived-projects/:id', ProjectController.getArchivedProjectById);

//check if the user is a team manager
router.get('/checkTeamManager/:id', ProjectController.checkTeamManager);
//check team manager projects
router.get('/checkTeamManagerProjects/:id', ProjectController.checkTeamManagerProjects);

module.exports = router;

