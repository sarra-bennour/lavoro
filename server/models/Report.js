const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
    // Membre qui est rapporté
    reported_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'teammembers',
        required: true
    },

    // Personne qui fait le rapport
    reporter_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    // Manager de l'équipe du membre rapporté
    team_manager_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    // Projet concerné par le rapport
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },

    // Raison du rapport
    reason: {
        type: String,
        required: true,
        enum: [
            'Inappropriate Behavior',
            'Performance Issues',
            'Attendance Problems',
            'Communication Issues',
            'Other'
        ]
    },

    // Détails du rapport
    details: {
        type: String,
        required: true
    },

    // Date du rapport
    report_date: {
        type: Date,
        default: Date.now
    },

    // Statut du rapport
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Resolved', 'Dismissed'],
        default: 'Pending'
    },

    // Date de création
    created_at: {
        type: Date,
        default: Date.now
    },

    // Date de mise à jour
    updated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Report', ReportSchema);
