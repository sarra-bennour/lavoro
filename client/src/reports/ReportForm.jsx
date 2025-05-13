import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const ReportForm = ({ onClose, onSuccess, initialData = {} }) => {
    const [users, setUsers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        reported_user_id: initialData.reported_user_id || '',
        project_id: initialData.project_id || '',
        reason: initialData.reason || '',
        details: initialData.details || '',
        report_date: initialData.report_date || new Date().toISOString().split('T')[0],
        reporter_id: initialData.team_manager_id || localStorage.getItem('userId') || '', // Use team manager as reporter
        team_manager_id: initialData.team_manager_id || '' // Add team manager ID
    });
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/signin');
                    return;
                }

                // Get logged-in user ID if not already set
                if (!formData.reporter_id) {
                    try {
                        const userResponse = await axios.get('https://lavoro-back.onrender.com/users/profile', {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });

                        if (userResponse.data.success) {
                            const userId = userResponse.data.data._id;
                            localStorage.setItem('userId', userId);
                            setFormData(prev => ({ ...prev, reporter_id: userId }));
                        }
                    } catch (userError) {
                        console.error('Error fetching profile:', userError);
                    }
                }

                // Fetch users list
                const usersResponse = await axios.get('https://lavoro-back.onrender.com/users/all', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Fetch projects list
                const projectsResponse = await axios.get('https://lavoro-back.onrender.com/project/dash', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (usersResponse.data.success) {
                    setUsers(usersResponse.data.data);
                }

                if (Array.isArray(projectsResponse.data)) {
                    setProjects(projectsResponse.data);

                    // If we have projects and project_id isn't set, use the first project
                    if (projectsResponse.data.length > 0 && !formData.project_id) {
                        const defaultProject = projectsResponse.data[0];
                        setFormData(prev => ({
                            ...prev,
                            project_id: defaultProject._id
                        }));
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate, formData.reporter_id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Verify all required fields are filled
            const requiredFields = [];

            // Only check reported_user_id if field is visible
            if (!initialData.hideUserField && !formData.reported_user_id) {
                requiredFields.push('Member to report');
            }

            // Only check project_id if field is visible
            if (!initialData.hideProjectField && !formData.project_id) {
                requiredFields.push('Related project');
            }

            if (!formData.reason) {
                requiredFields.push('Reason');
            }

            if (!formData.details) {
                requiredFields.push('Details');
            }

            if (requiredFields.length > 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Missing fields',
                    text: `Please fill in the following fields: ${requiredFields.join(', ')}`
                });
                return;
            }

            // If reported_user_id is hidden but initialData.reported_user_id is set, use it
            if (initialData.hideUserField && initialData.reported_user_id) {
                formData.reported_user_id = initialData.reported_user_id;
            }

            // If project_id is hidden but initialData.projectInfo is set, use its ID
            if (initialData.hideProjectField && initialData.projectInfo) {
                formData.project_id = initialData.projectInfo._id || initialData.projectInfo.project_id;
            }

            // Ensure team_manager_id is set
            if (initialData.team_manager_id) {
                formData.team_manager_id = initialData.team_manager_id;
            }

            // Verify reporter_id is present
            if (!formData.reporter_id) {
                // If ID isn't available, use a default ID for testing
                setFormData(prev => ({
                    ...prev,
                    reporter_id: '60d0fe4f5311236168a109ca' // Test ID
                }));
                return; // Exit to let useEffect update formData
            }

            try {
                // Prepare data for submission
                const dataToSubmit = { ...formData };

                // If fields are hidden but we have values from initialData, use them
                if (initialData.hideUserField && initialData.reported_user_id) {
                    dataToSubmit.reported_user_id = initialData.reported_user_id;
                }

                // Ensure project_id is always set
                if (!dataToSubmit.project_id || dataToSubmit.project_id === '') {
                    // First try to use team project
                    if (initialData.projectInfo && (initialData.projectInfo._id || initialData.projectInfo.project_id)) {
                        dataToSubmit.project_id = initialData.projectInfo._id || initialData.projectInfo.project_id;
                    }
                    // Otherwise use first available project
                    else if (projects.length > 0) {
                        dataToSubmit.project_id = projects[0]._id;
                    }
                    // If no project available, use default ID
                    else {
                        dataToSubmit.project_id = "64f8b0e5e6f5d1a1e7c5a1b2";
                    }
                }

                // Ensure team_manager_id is set
                if (initialData.team_manager_id) {
                    dataToSubmit.team_manager_id = initialData.team_manager_id;
                    // Also set reporter_id to team_manager_id
                    dataToSubmit.reporter_id = initialData.team_manager_id;
                } else {
                    // If team_manager_id isn't set, use reporter_id as team_manager_id
                    dataToSubmit.team_manager_id = dataToSubmit.reporter_id;
                }

                // Ensure reporter_id is set
                if (!dataToSubmit.reporter_id || dataToSubmit.reporter_id === '') {
                    // Use user ID from localStorage
                    const userId = localStorage.getItem('userId');
                    if (userId) {
                        dataToSubmit.reporter_id = userId;
                        // If team_manager_id isn't set, also use this ID
                        if (!dataToSubmit.team_manager_id || dataToSubmit.team_manager_id === '') {
                            dataToSubmit.team_manager_id = userId;
                        }
                    } else {
                        // Default ID if no ID available
                        dataToSubmit.reporter_id = "60d0fe4f5311236168a109ca";
                        dataToSubmit.team_manager_id = "60d0fe4f5311236168a109ca";
                    }
                }

                console.log('Submitting data:', dataToSubmit);

                const response = await axios.post('https://lavoro-back.onrender.com/reports/create', dataToSubmit);

                console.log('Server response:', response.data);

                if (onClose) {
                    onClose();
                }

                if (onSuccess) {
                    onSuccess();
                }

                Swal.fire({
                    icon: 'success',
                    title: 'Report created successfully!',
                    text: 'Your report has been recorded and will be processed soon.',
                    confirmButtonText: 'OK'
                });
            } catch (apiError) {
                console.error('API Error:', apiError);

                if (apiError.response && apiError.response.status === 201) {
                    if (onClose) {
                        onClose();
                    }

                    if (onSuccess) {
                        onSuccess();
                    }

                    Swal.fire({
                        icon: 'success',
                        title: 'Report created successfully!',
                        text: 'Your report has been recorded and will be processed soon.',
                        confirmButtonText: 'OK'
                    });
                } else {
                    throw apiError;
                }
            }
        } catch (error) {
            console.error('Error creating report:', error);

            const errorMessage = error.response?.data?.message || 'An error occurred while creating the report';
            const errorDetails = error.response?.data?.error || error.message;

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: errorMessage,
                footer: `<div class="text-danger">Details: ${errorDetails}</div>`
            });
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="card custom-card border border-danger">
            <div className="card-header bg-danger-transparent">
                <div className="card-title">
                    <i className="ri-error-warning-line text-danger me-2"></i>
                    {initialData.memberName ?
                        `Report ${initialData.memberName}` :
                        'Report a member'
                    }
                </div>
            </div>
            <div className="card-body">
                <div className="alert alert-danger mb-4" role="alert">
                    <div className="d-flex">
                        <i className="ri-information-line fs-3 me-2"></i>
                        <div>
                            <h6 className="fw-bold mb-1">Important</h6>
                            <p className="mb-0">
                                {initialData.memberName ?
                                    `You are about to report ${initialData.memberName}. ` :
                                    ''
                                }
                                {initialData.teamInfo && initialData.teamInfo.manager_id ?
                                    `This report will be submitted on behalf of ${initialData.teamInfo.manager_id.firstName} ${initialData.teamInfo.manager_id.lastName} (Team Manager). ` :
                                    'This report will be forwarded to the relevant team manager. '
                                }
                                Please provide accurate and objective information.
                            </p>
                        </div>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    {/* Hide user field if hideUserField is true */}
                    {!initialData.hideUserField && (
                        <div className="mb-3">
                            <label htmlFor="reported_user_id" className="form-label">Member to report</label>
                            <select
                                id="reported_user_id"
                                name="reported_user_id"
                                className="form-select"
                                value={formData.reported_user_id}
                                onChange={handleChange}
                                required
                                disabled={initialData.reported_user_id ? true : false}
                            >
                                <option value="">Select a member</option>
                                {users.map(user => (
                                    <option key={user._id} value={user._id}>
                                        {user.firstName} {user.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Hide project field if hideProjectField is true, but show project info */}
                    {initialData.hideProjectField && initialData.projectInfo ? (
                        <div className="mb-3">
                            <label className="form-label">Related project</label>
                            <div className="form-control bg-light">
                                {initialData.projectInfo.name}
                            </div>
                            <small className="form-text text-muted">
                                The project is automatically selected based on the member's team.
                            </small>
                        </div>
                    ) : !initialData.hideProjectField && (
                        <div className="mb-3">
                            <label htmlFor="project_id" className="form-label">Related project</label>
                            <select
                                id="project_id"
                                name="project_id"
                                className="form-select"
                                value={formData.project_id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select a project</option>
                                {projects.map(project => (
                                    <option key={project._id} value={project._id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="mb-3">
                        <label htmlFor="reason" className="form-label">Reason</label>
                        <select
                            id="reason"
                            name="reason"
                            className="form-select"
                            value={formData.reason}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Select a reason</option>
                            <option value="Inappropriate Behavior">Inappropriate Behavior</option>
                            <option value="Performance Issues">Performance Issues</option>
                            <option value="Attendance Problems">Attendance Problems</option>
                            <option value="Communication Issues">Communication Issues</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="details" className="form-label">Details</label>
                        <textarea
                            id="details"
                            name="details"
                            className="form-control"
                            rows="4"
                            value={formData.details}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="report_date" className="form-label">Date</label>
                        <input
                            type="date"
                            id="report_date"
                            name="report_date"
                            className="form-control"
                            value={formData.report_date}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-danger">
                            <i className="ri-alarm-warning-line me-1"></i>
                            Submit Report
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportForm;