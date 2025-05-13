const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Report = require('../models/Report');

// Route pour supprimer un rapport par son ID
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        console.log('Route de suppression directe appelée avec ID:', id);
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
});

// Route de test simple pour vérifier que le routeur fonctionne
router.get('/test', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Route de test pour la suppression des rapports'
    });
});

// Route POST pour la suppression (pour les navigateurs qui ne supportent pas DELETE)
router.post('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        console.log('Route POST de suppression appelée avec ID:', id);
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
});

module.exports = router;
