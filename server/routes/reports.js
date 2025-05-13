const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authenticateToken = require('../middleware/authenticatedToken');

// Route pour créer un nouveau rapport
// Temporairement désactivé l'authentification pour les tests
router.post('/create', reportController.createReport);

// Route pour récupérer tous les rapports
// Temporairement désactivé l'authentification pour les tests
router.get('/all', reportController.getAllReports);

// Route pour récupérer les projets pour le formulaire de rapport
router.get('/projects/list', authenticateToken, reportController.getProjectsForReport);

// Route pour récupérer un rapport par son ID
router.get('/:id', authenticateToken, reportController.getReportById);

// Route pour mettre à jour le statut d'un rapport
router.put('/:id/status', authenticateToken, reportController.updateReportStatus);

// Route de test pour vérifier si la suppression fonctionne
router.delete('/delete-test/:id', (req, res) => {
    console.log('Route de test pour la suppression appelée avec ID:', req.params.id);
    res.status(200).json({
        success: true,
        message: 'Route de test pour la suppression appelée avec succès',
        id: req.params.id
    });
});

// Route pour supprimer un rapport
// Temporairement désactivé l'authentification pour les tests
router.delete('/:id', reportController.deleteReport);

module.exports = router;
