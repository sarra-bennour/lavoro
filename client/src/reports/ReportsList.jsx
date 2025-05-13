import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import ReportForm from './ReportForm';

const ReportsList = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReportForm, setShowReportForm] = useState(false);
    const [projects, setProjects] = useState({});  // Stockage des projets par ID
    const [users, setUsers] = useState({});  // Stockage des utilisateurs par ID
    const navigate = useNavigate();

    // Fonction pour supprimer un rapport de la base de données
    const handleDeleteReport = (reportId) => {
        Swal.fire({
            title: 'Êtes-vous sûr?',
            text: "Cette action supprimera définitivement ce rapport. Voulez-vous continuer?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer',
            cancelButtonText: 'Annuler'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    // Afficher un indicateur de chargement
                    Swal.fire({
                        title: 'Suppression en cours...',
                        text: 'Veuillez patienter',
                        allowOutsideClick: false,
                        allowEscapeKey: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });

                    // Appel API pour supprimer le rapport (utilisation de la route de test)
                    console.log('Tentative de suppression du rapport avec ID:', reportId);
                    console.log('URL de suppression (test):', `https://lavoro-back.onrender.com/reports/delete-test/${reportId}`);

                    // Essayons avec la nouvelle route dédiée (méthode POST)
                    let response;
                    try {
                        console.log('URL de suppression (POST):', `https://lavoro-back.onrender.com/delete-report/${reportId}`);
                        response = await axios.post(`https://lavoro-back.onrender.com/delete-report/${reportId}`);
                        console.log('Réponse de suppression (POST):', response.data);
                    } catch (postError) {
                        console.error('Erreur avec la méthode POST:', postError);

                        // Essayons avec la nouvelle route dédiée (méthode DELETE)
                        try {
                            console.log('URL de suppression (DELETE):', `https://lavoro-back.onrender.com/delete-report/${reportId}`);
                            response = await axios.delete(`https://lavoro-back.onrender.com/delete-report/${reportId}`);
                            console.log('Réponse de suppression (DELETE):', response.data);
                        } catch (deleteError) {
                            console.error('Erreur avec la méthode DELETE:', deleteError);

                            // Essayons avec la route alternative
                            try {
                                console.log('URL de suppression (alternative):', `https://lavoro-back.onrender.com/api/reports/${reportId}`);
                                response = await axios.delete(`https://lavoro-back.onrender.com/api/reports/${reportId}`);
                                console.log('Réponse de suppression (alternative):', response.data);
                            } catch (alternativeError) {
                                console.error('Erreur avec la route alternative:', alternativeError);

                                // Essayons avec la route originale
                                try {
                                    console.log('URL de suppression (originale):', `https://lavoro-back.onrender.com/reports/${reportId}`);
                                    response = await axios.delete(`https://lavoro-back.onrender.com/reports/${reportId}`);
                                    console.log('Réponse de suppression (originale):', response.data);
                                } catch (originalError) {
                                    console.error('Erreur avec la route originale:', originalError);
                                    throw originalError; // Propager l'erreur
                                }
                            }
                        }
                    }

                    if (response && response.data && response.data.success) {
                        // Supprimer le rapport de la liste locale
                        setReports(prevReports => prevReports.filter(report => report._id !== reportId));

                        // Afficher un message de succès
                        Swal.fire({
                            icon: 'success',
                            title: 'Supprimé!',
                            text: 'Le rapport a été supprimé avec succès.',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    } else if (response) {
                        throw new Error(response.data?.message || 'Erreur lors de la suppression');
                    } else {
                        throw new Error('Aucune réponse reçue du serveur');
                    }
                } catch (error) {
                    console.error('Erreur lors de la suppression du rapport:', error);

                    // Afficher un message d'erreur
                    Swal.fire({
                        icon: 'error',
                        title: 'Erreur',
                        text: error.response?.data?.message || 'Erreur lors de la suppression du rapport'
                    });
                }
            }
        });
    };



    // Fonction pour récupérer tous les utilisateurs
    const fetchAllUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            // Utiliser l'endpoint /users/all pour récupérer tous les utilisateurs
            const response = await axios.get('https://lavoro-back.onrender.com/users/all', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                const usersData = {};
                // Convertir le tableau d'utilisateurs en objet avec l'ID comme clé
                response.data.data.forEach(user => {
                    if (user && user._id) {
                        usersData[user._id] = user;
                    }
                });
                console.log('Tous les utilisateurs récupérés:', usersData);
                setUsers(usersData);
                return usersData;
            } else {
                console.warn('Format de données d\'utilisateurs inattendu:', response.data);
                return {};
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs:', error);
            return {};
        }
    };

    // Fonction pour récupérer tous les projets
    const fetchAllProjects = async () => {
        try {
            const token = localStorage.getItem('token');
            // Utiliser l'endpoint /project/dash qui semble fonctionner dans d'autres parties de l'application
            const response = await axios.get('https://lavoro-back.onrender.com/project/dash', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && Array.isArray(response.data)) {
                const projectsData = {};
                // Convertir le tableau de projets en objet avec l'ID comme clé
                response.data.forEach(project => {
                    if (project && project._id) {
                        projectsData[project._id] = project;
                    }
                });
                console.log('Tous les projets récupérés:', projectsData);
                setProjects(projectsData);
                return projectsData;
            } else {
                console.warn('Format de données de projets inattendu:', response.data);
                return {};
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des projets:', error);
            // Essayer avec un autre endpoint en cas d'échec
            try {
                const token = localStorage.getItem('token');
                const fallbackResponse = await axios.get('https://lavoro-back.onrender.com/project/all', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (fallbackResponse.data && fallbackResponse.data.data) {
                    const projectsData = {};
                    fallbackResponse.data.data.forEach(project => {
                        if (project && project._id) {
                            projectsData[project._id] = project;
                        }
                    });
                    console.log('Projets récupérés (fallback):', projectsData);
                    setProjects(projectsData);
                    return projectsData;
                }
            } catch (fallbackError) {
                console.error('Erreur lors de la récupération des projets (fallback):', fallbackError);
            }
            return {};
        }
    };

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/signin');
                    return;
                }

                console.log('Tentative de récupération des rapports...');

                // Récupérer d'abord tous les projets et utilisateurs
                const projectsData = await fetchAllProjects();
                const usersData = await fetchAllUsers();

                // Pour les tests, nous n'envoyons pas le token d'authentification
                const response = await axios.get('https://lavoro-back.onrender.com/reports/all');

                console.log('Réponse reçue:', response.data);

                if (response.data.success) {
                    // Ignorer l'avertissement et simplement afficher les données
                    if (response.data.warning) {
                        console.warn('Avertissement ignoré:', response.data.warning);
                    }

                    console.log('Rapports reçus:', response.data.data);

                    // Traiter les données pour s'assurer que les informations sont complètes
                    const processedReports = response.data.data.map(report => {
                        // Créer une copie du rapport pour éviter de modifier l'objet original
                        const reportCopy = { ...report };

                        // Vérifier si reported_user_id est un objet ou juste un ID
                        if (reportCopy.reported_user_id && typeof reportCopy.reported_user_id === 'string') {
                            console.log('Rapport avec ID utilisateur non résolu:', reportCopy._id);

                            // Vérifier si l'utilisateur existe dans usersData
                            if (usersData[reportCopy.reported_user_id]) {
                                console.log('Utilisateur trouvé dans usersData:', usersData[reportCopy.reported_user_id]);
                                reportCopy.reported_user_id = {
                                    _id: reportCopy.reported_user_id,
                                    firstName: usersData[reportCopy.reported_user_id].firstName,
                                    lastName: usersData[reportCopy.reported_user_id].lastName,
                                    email: usersData[reportCopy.reported_user_id].email,
                                    image: usersData[reportCopy.reported_user_id].image
                                };
                            } else {
                                console.warn('Utilisateur non trouvé dans usersData pour ID:', reportCopy.reported_user_id);
                            }
                        }

                        // Vérifier si project_id est un objet ou juste un ID
                        if (reportCopy.project_id && typeof reportCopy.project_id === 'string') {
                            console.log('Rapport avec ID projet non résolu:', reportCopy._id, 'Project ID:', reportCopy.project_id);

                            // Vérifier si le projet existe dans projectsData
                            if (projectsData[reportCopy.project_id]) {
                                console.log('Projet trouvé dans projectsData:', projectsData[reportCopy.project_id]);
                                reportCopy.project_id = {
                                    _id: reportCopy.project_id,
                                    name: projectsData[reportCopy.project_id].name,
                                    description: projectsData[reportCopy.project_id].description
                                };
                            } else {
                                console.warn('Projet non trouvé dans projectsData pour ID:', reportCopy.project_id);
                            }
                        }

                        // Vérifier si reporter_id est un objet ou juste un ID
                        if (reportCopy.reporter_id && typeof reportCopy.reporter_id === 'string') {
                            console.log('Rapport avec ID reporter non résolu:', reportCopy._id, 'Reporter ID:', reportCopy.reporter_id);

                            // Vérifier si l'utilisateur existe dans usersData
                            if (usersData[reportCopy.reporter_id]) {
                                console.log('Reporter trouvé dans usersData:', usersData[reportCopy.reporter_id]);
                                reportCopy.reporter_id = {
                                    _id: reportCopy.reporter_id,
                                    firstName: usersData[reportCopy.reporter_id].firstName,
                                    lastName: usersData[reportCopy.reporter_id].lastName,
                                    email: usersData[reportCopy.reporter_id].email,
                                    image: usersData[reportCopy.reporter_id].image
                                };
                            } else {
                                console.warn('Reporter non trouvé dans usersData pour ID:', reportCopy.reporter_id);
                            }
                        }

                        // Vérifier si team_manager_id est un objet ou juste un ID
                        if (reportCopy.team_manager_id && typeof reportCopy.team_manager_id === 'string') {
                            console.log('Rapport avec ID team manager non résolu:', reportCopy._id, 'Team Manager ID:', reportCopy.team_manager_id);
                        }

                        return reportCopy;
                    });

                    setReports(processedReports);
                } else {
                    throw new Error('La requête a échoué');
                }
            } catch (error) {
                console.error('Erreur lors de la récupération des rapports:', error);

                // Afficher un message d'erreur à l'utilisateur
                Swal.fire({
                    icon: 'error',
                    title: 'Erreur',
                    text: 'Impossible de récupérer les rapports. Veuillez réessayer plus tard.'
                });

                // Initialiser avec un tableau vide au lieu des données de test
                setReports([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [navigate]);

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Pending':
                return 'badge bg-warning-transparent';
            case 'Under Review':
                return 'badge bg-info-transparent';
            case 'Resolved':
                return 'badge bg-success-transparent';
            case 'Dismissed':
                return 'badge bg-danger-transparent';
            default:
                return 'badge bg-secondary-transparent';
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    // Fonction pour rafraîchir la liste des rapports
    const refreshReports = async () => {
        setLoading(true);
        try {
            console.log('Rafraîchissement des rapports...');

            // Récupérer d'abord tous les projets et utilisateurs
            const projectsData = await fetchAllProjects();
            const usersData = await fetchAllUsers();

            const response = await axios.get('https://lavoro-back.onrender.com/reports/all');

            if (response.data.success) {
                console.log('Rapports reçus:', response.data.data);

                // Traiter les données pour s'assurer que les informations sont complètes
                const processedReports = response.data.data.map(report => {
                    // Créer une copie du rapport pour éviter de modifier l'objet original
                    const reportCopy = { ...report };

                    // Vérifier si reported_user_id est un objet ou juste un ID
                    if (reportCopy.reported_user_id && typeof reportCopy.reported_user_id === 'string') {
                        console.log('Rapport avec ID utilisateur non résolu:', reportCopy._id);

                        // Vérifier si l'utilisateur existe dans usersData
                        if (usersData[reportCopy.reported_user_id]) {
                            console.log('Utilisateur trouvé dans usersData:', usersData[reportCopy.reported_user_id]);
                            reportCopy.reported_user_id = {
                                _id: reportCopy.reported_user_id,
                                firstName: usersData[reportCopy.reported_user_id].firstName,
                                lastName: usersData[reportCopy.reported_user_id].lastName,
                                email: usersData[reportCopy.reported_user_id].email,
                                image: usersData[reportCopy.reported_user_id].image
                            };
                        } else {
                            console.warn('Utilisateur non trouvé dans usersData pour ID:', reportCopy.reported_user_id);
                        }
                    }

                    // Vérifier si project_id est un objet ou juste un ID
                    if (reportCopy.project_id && typeof reportCopy.project_id === 'string') {
                        console.log('Rapport avec ID projet non résolu:', reportCopy._id, 'Project ID:', reportCopy.project_id);
                        console.log('Tous les projets:', projectsData);

                        // Vérifier si le projet existe dans projectsData
                        if (projectsData[reportCopy.project_id]) {
                            console.log('Projet trouvé dans projectsData:', projectsData[reportCopy.project_id]);
                            reportCopy.project_id = {
                                _id: reportCopy.project_id,
                                name: projectsData[reportCopy.project_id].name,
                                description: projectsData[reportCopy.project_id].description
                            };
                        } else {
                            console.warn('Projet non trouvé dans projectsData pour ID:', reportCopy.project_id);
                        }
                    }

                    // Vérifier si reporter_id est un objet ou juste un ID
                    if (reportCopy.reporter_id && typeof reportCopy.reporter_id === 'string') {
                        console.log('Rapport avec ID reporter non résolu:', reportCopy._id, 'Reporter ID:', reportCopy.reporter_id);

                        // Vérifier si l'utilisateur existe dans usersData
                        if (usersData[reportCopy.reporter_id]) {
                            console.log('Reporter trouvé dans usersData:', usersData[reportCopy.reporter_id]);
                            reportCopy.reporter_id = {
                                _id: reportCopy.reporter_id,
                                firstName: usersData[reportCopy.reporter_id].firstName,
                                lastName: usersData[reportCopy.reporter_id].lastName,
                                email: usersData[reportCopy.reporter_id].email,
                                image: usersData[reportCopy.reporter_id].image
                            };
                        } else {
                            console.warn('Reporter non trouvé dans usersData pour ID:', reportCopy.reporter_id);
                        }
                    }

                    // Vérifier si team_manager_id est un objet ou juste un ID
                    if (reportCopy.team_manager_id && typeof reportCopy.team_manager_id === 'string') {
                        console.log('Rapport avec ID team manager non résolu:', reportCopy._id, 'Team Manager ID:', reportCopy.team_manager_id);
                    }

                    return reportCopy;
                });

                setReports(processedReports);

                // Afficher un message de succès
                Swal.fire({
                    icon: 'info',
                    title: 'Liste mise à jour',
                    text: 'La liste des rapports a été mise à jour avec succès',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            console.error('Erreur lors du rafraîchissement des rapports:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container-fluid">
            {/* Modal pour le formulaire de rapport */}

            {/* Page Header */}
            <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
                <div>
                    <nav>
                        <ol className="breadcrumb mb-1">
                            <li className="breadcrumb-item"><a href="#!">Teams</a></li>
                            <span className="mx-1">→</span>
                            <li className="breadcrumb-item active" aria-current="page">Reports</li>
                        </ol>
                    </nav>
                    <h1 className="page-title fw-medium fs-18 mb-0">
                        <i className="ri-error-warning-line text-danger me-2"></i>
                        Reports 
                    </h1>
                </div>
                <div className="btn-list">
                    <button
                        className="btn btn-primary btn-wave"
                        onClick={() => refreshReports()}
                    >
                        <i className="ri-refresh-line me-1"></i> Refresh
                    </button>
                </div>
            </div>
            {/* Page Header Close */}

            {/* Start::row-1 */}
            <div className="row">
                <div className="col-xl-12">
                    <h6 className="mb-3">
                        <span className="badge bg-danger-transparent me-2">
                            <i className="ri-alarm-warning-line me-1"></i>
                            Important
                        </span>
                        Reports List
                    </h6>
                    <div className="swiper testimonialSwiperService1">
                        <div className="row">
                            {reports.length > 0 ? (
                                reports.map((report) => (
                                    <div className="col-xl-4 col-md-6 mb-4" key={report._id}>
                                        <div className="card custom-card text-fixed-white h-100 border-start border-danger border-3">
                                            <div className="card-body">
                                                <div className="d-flex justify-content-between gap-2 align-items-center mb-3">
                                                    <span className="avatar rounded-circle">
                                                        {report.reported_user_id && report.reported_user_id.image ? (
                                                            <img
                                                                src={report.reported_user_id.image?.startsWith('http')
                                                                    ? report.reported_user_id.image
                                                                    : `https://lavoro-back.onrender.com${report.reported_user_id.image}`}
                                                                alt=""
                                                                className="img-fluid rounded-circle"
                                                            />
                                                        ) : (
                                                            <div className="avatar avatar-sm bg-primary rounded-circle">
                                                                <i className="ri-user-line fs-18 text-white"></i>
                                                            </div>
                                                        )}
                                                    </span>
                                                    <div className="text-end">
                                                        <span className={getStatusBadgeClass(report.status)}>
                                                            {report.status || 'Pending'}
                                                        </span>
                                                        <span className="op-8 d-block fs-12 fw-medium">
                                                            {formatDate(report.report_date)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="fs-14">
                                                    <strong>Reason:</strong> {report.reason}<br />
                                                    <strong>Details:</strong> {report.details.length > 100
                                                        ? `${report.details.substring(0, 100)}...`
                                                        : report.details}
                                                    {report.details.length > 100 && (
                                                        <a href="#!"
                                                           className="fw-semibold fs-11"
                                                           data-bs-toggle="tooltip"
                                                           data-bs-custom-class="tooltip-primary"
                                                           data-bs-placement="top"
                                                           data-bs-title={report.details}>
                                                            Lire plus
                                                        </a>
                                                    )}
                                                </p>
                                                <div className="d-flex align-items-center justify-content-between gap-3">
                                                    <div className="flex-fill">
                                                        <p className="mb-0 fw-bold fs-14 text-primary">
                                                            {report.reported_user_id && (report.reported_user_id.firstName || report.reported_user_id.name)
                                                                ? (report.reported_user_id.firstName
                                                                    ? `${report.reported_user_id.firstName} ${report.reported_user_id.lastName || ''}`
                                                                    : report.reported_user_id.name)
                                                                : 'Utilisateur inconnu'}
                                                        </p>
                                                        <p className="mb-0 fs-11 fw-normal op-8">
                                                            <strong>Projet:</strong> {
                                                                (() => {
                                                                    // Vérifier si project_id est un objet avec une propriété name
                                                                    if (report.project_id && typeof report.project_id === 'object' && report.project_id.name) {
                                                                        return report.project_id.name;
                                                                    }

                                                                    // Si project_id est une chaîne, essayer de trouver le projet dans projectsData
                                                                    if (report.project_id && typeof report.project_id === 'string') {
                                                                        const project = projects[report.project_id];
                                                                        if (project && project.name) {
                                                                            return project.name;
                                                                        }
                                                                        return `ID: ${report.project_id}`;
                                                                    }

                                                                    // Si project_id n'est pas défini ou est null
                                                                    return 'Project not defined ';
                                                                })()
                                                            }
                                                        </p>
                                                       
                                                    </div>
                                                    <div className="ms-auto fs-12 fw-semibold op-8 text-end">
                                                        
                                                        <div
                                                            className="btn btn-sm btn-icon btn-danger"
                                                            title="Delete "
                                                            onClick={() => handleDeleteReport(report._id)}
                                                        >
                                                            <i className="ri-delete-bin-line"></i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 text-center py-5">
                                    <div className="card custom-card">
                                        <div className="card-body">
                                            <i className="ri-file-list-3-line fs-3 text-muted mb-3"></i>
                                            <h5>No Reports  Found </h5>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* End::row-1 */}
        </div>
    );
};

export default ReportsList;
