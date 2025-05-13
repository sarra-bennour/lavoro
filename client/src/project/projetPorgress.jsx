import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Sous-composant pour afficher une carte de projet individuelle
const ProjectCard = ({ project }) => {
    const { 
        name, 
        description, 
        progress = 0,
        status,
        updated_at
    } = project;

    // Fonction pour calculer le temps écoulé
    const getTimeAgo = (date) => {
        if (!date) return 'No update';
        const now = new Date();
        const updated = new Date(date);
        const diffInMinutes = Math.floor((now - updated) / (1000 * 60));
        
        if (diffInMinutes < 60) {
            return `${diffInMinutes} mins ago`;
        } else if (diffInMinutes < 1440) {
            return `${Math.floor(diffInMinutes / 60)} hours ago`;
        } else {
            return `${Math.floor(diffInMinutes / 1440)} days ago`;
        }
    };

    // Déterminer la couleur en fonction du statut
    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed':
                return 'success';
            case 'In Progress':
                return 'primary';
            case 'Not Started':
                return 'warning';
            default:
                return 'info';
        }
    };

    // Déterminer la couleur de la barre de progression en fonction du pourcentage
    const getProgressColor = (progress) => {
        if (progress >= 80) {
            return 'bg-success';
        } else if (progress >= 50) {
            return 'bg-primary';
        } else if (progress >= 20) {
            return 'bg-warning';
        } else {
            return 'bg-danger';
        }
    };

    // Déterminer la couleur de fond de la barre de progression
    const getProgressBgColor = (progress) => {
        if (progress >= 80) {
            return 'bg-success-transparent';
        } else if (progress >= 50) {
            return 'bg-primary-transparent';
        } else if (progress >= 20) {
            return 'bg-warning-transparent';
        } else {
            return 'bg-danger-transparent';
        }
    };

    return (
        <div className="p-3 pb-2">
            <div className="d-flex align-items-start gap-3 mb-3">
                <div className="flex-grow-1">
                    <p className="fw-medium mb-1 fs-14">
                        {name} 
                        <a href="javascript:void(0);" className="text-info" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Get Info">
                            <i className="ri-information-line fs-13 op-7 lh-1 align-middle"></i>
                        </a>
                    </p>
                    <p className="text-muted mb-1 fw-normal fs-12">{description || 'No description available'}</p>
                    <div>Status: <span className={`text-${getStatusColor(status)} fw-normal fs-12`}>{status}</span></div>
                </div>
                <div className="flex-shrink-0 text-end">
                    <p className="mb-3 fs-11 text-muted">
                        <i className="ri-time-line text-muted fs-11 align-middle lh-1 me-1 d-inline-block"></i>
                        {getTimeAgo(updated_at)}
                    </p>
                </div>
            </div>
            <div>
                <div className={`progress progress-lg rounded-pill p-1 ms-auto ${getProgressBgColor(progress)}`} 
                     role="progressbar" 
                     aria-valuenow={progress} 
                     aria-valuemin="0" 
                     aria-valuemax="100">
                    <div className={`progress-bar ${getProgressColor(progress)} progress-bar-striped progress-bar-animated rounded-pill`} 
                         style={{ width: `${progress}%` }}>
                        {progress}%
                    </div>
                </div>
            </div>
        </div>
    );
};

// Composant principal
const ProjectProgress = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const navigate = useNavigate();

    const fetchProjects = async () => {
        try {
            const response = await axios.get('https://lavoro-back.onrender.com/project/projects-with-progress');
            setProjects(response.data);
            setLoading(false);
            setError(null);
        } catch (err) {
            console.error('Error fetching projects:', err);
            if (retryCount < 3) {
                setRetryCount(prev => prev + 1);
                setTimeout(fetchProjects, 2000);
            } else {
                setError('Failed to connect to the server. Please make sure the backend is running.');
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const getTimeAgo = (date) => {
        if (!date) return 'No updates yet';
        const now = new Date();
        const updated = new Date(date);
        const diffInSeconds = Math.floor((now - updated) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'text-green-500';
            case 'In Progress': return 'text-blue-500';
            case 'On Hold': return 'text-yellow-500';
            case 'Cancelled': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getProgressColor = (progress) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-blue-500';
        if (progress >= 20) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getProgressBgColor = (progress) => {
        if (progress >= 80) return 'bg-green-100';
        if (progress >= 50) return 'bg-blue-100';
        if (progress >= 20) return 'bg-yellow-100';
        return 'bg-red-100';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="mt-4 text-gray-600">
                    {retryCount > 0 ? `Retrying connection (${retryCount}/3)...` : 'Loading projects...'}
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
                <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => {
                            setRetryCount(0);
                            setLoading(true);
                            fetchProjects();
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            <div className="row">
           
                <div className="col-12">
                <br />
                <br />
                    <div className="card custom-card">
                        <div className="card-header justify-content-between">
                            <div className="card-title">
                                Projects Progress
                            </div>
                            <button type="button" className="btn btn-sm btn-primary-light">
                                View All
                            </button>
                        </div>
                        <div className="card-body">
                            {projects.map((project) => (
                                <div key={project._id} className="col-12 mb-4">
                                    <div className="p-3 pb-2">
                                        <div className="d-flex align-items-start gap-3 mb-3">
                                            <div className="flex-grow-1">
                                                <p className="fw-medium mb-1 fs-14">
                                                    {project.name}
                                                    <a href="javascript:void(0);" className="text-info" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Get Info">
                                                        <i className="ri-information-line fs-13 op-7 lh-1 align-middle"></i>
                                                    </a>
                                                </p>
                                                <p className="text-muted mb-1 fw-normal fs-12">{project.description}</p>
                                                <div>Status: <span className={`text-${getStatusColor(project.status)} fw-normal fs-12`}>{project.status}</span></div>
                                            </div>
                                            <div className="flex-shrink-0 text-end">
                                                <p className="mb-3 fs-11 text-muted">
                                                    <i className="ri-time-line text-muted fs-11 align-middle lh-1 me-1 d-inline-block"></i>
                                                    {getTimeAgo(project.updated_at)}
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <div className={`progress progress-lg rounded-pill p-1 ms-auto ${getProgressBgColor(project.progress)}`} 
                                                 role="progressbar" 
                                                 aria-valuenow={project.progress} 
                                                 aria-valuemin="0" 
                                                 aria-valuemax="100">
                                                <div className={`progress-bar ${getProgressColor(project.progress)} progress-bar-striped progress-bar-animated rounded-pill`} 
                                                     style={{ width: `${project.progress}%` }}>
                                                    {project.progress}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectProgress;