import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './KanbanBoard.css';

const KanbanBoard = () => {
    const { projectId } = useParams();
    const [tasks, setTasks] = useState({
        'Not Started': [],
        'In Progress': [],
        'In Review': [],
        'Done': []
    });
    const [loading, setLoading] = useState(true);

    // Fetch tasks on component mount
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                // Use the correct API endpoint from the Task.js routes file
                const response = await axios.get(`https://lavoro-back.onrender.com/tasks/projects/${projectId}/kanban`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });

                // Process the response data
                console.log('API Response:', response.data);

                // Check if the response is already grouped by status or needs to be grouped
                let groupedTasks;

                if (response.data && typeof response.data === 'object' && 'Not Started' in response.data) {
                    // Response is already grouped by status
                    groupedTasks = response.data;
                    console.log('Using pre-grouped tasks from API');
                } else {
                    // Need to group the tasks by status
                    const tasksData = response.data || [];
                    console.log('Fetched tasks:', tasksData);

                    groupedTasks = {
                        'Not Started': tasksData.filter(t => t.status === 'Not Started'),
                        'In Progress': tasksData.filter(t => t.status === 'In Progress'),
                        'In Review': tasksData.filter(t => t.status === 'In Review'),
                        'Done': tasksData.filter(t => t.status === 'Done')
                    };
                }

                setTasks(groupedTasks);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching tasks:', error);
                setLoading(false);
            }
        };

        fetchTasks();
    }, [projectId]);

    // No drag and drop functionality - this is a read-only board

    // Column colors and icons
    const columnConfig = {
        'Not Started': { bg: 'bg-primary', icon: 'ri-inbox-line' },
        'In Progress': { bg: 'bg-primary2', icon: 'ri-refresh-line' },
        'In Review': { bg: 'bg-primary3', icon: 'ri-eye-line' },
        'Done': { bg: 'bg-secondary', icon: 'ri-checkbox-circle-line' },
        // Add fallback configuration
        'default': { bg: 'bg-light', icon: 'ri-question-line' }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid">
            {/* Page Header */}
            <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
                <div>
                    <nav>
                        <ol className="breadcrumb mb-1">
                            <li className="breadcrumb-item"><a href="javascript:void(0);">Apps</a></li>
                            <span className="mx-1">→</span>
                            <li className="breadcrumb-item"><a href="javascript:void(0);">Task</a></li>
                            <span className="mx-1">→</span>
                            <li className="breadcrumb-item active" aria-current="page">Kanban Board</li>
                        </ol>
                    </nav>
                    <h1 className="page-title fw-medium fs-18 mb-0">Kanban Board</h1>
                </div>
                <div className="btn-list">
                    <a href={`/overviewPro/${projectId}`} className="btn btn-primary btn-wave me-0">
                        <i className="ri-arrow-left-line me-1"></i> Back to Project
                    </a>
                </div>
            </div>

            {/* Static Kanban Board */}
            <div className="TASK-kanban-board">
                {Object.entries(tasks).map(([status, tasks]) => (
                    <div key={status} className="kanban-tasks-type">
                        <div className="pe-3 mb-3">
                            <div className={`d-flex justify-content-between align-items-center px-3 py-2 ${(columnConfig[status] || columnConfig.default).bg} text-fixed-white rounded`}>
                                <span className="d-block fw-medium fs-15">
                                    <i className={`${(columnConfig[status] || columnConfig.default).icon} me-2`}></i>
                                    {status.toUpperCase()}
                                </span>
                                <div>
                                    <span className="badge badge-task text-fixed-white">{tasks.length}</span>
                                </div>
                            </div>
                        </div>

                        <div
                            className="kanban-tasks"
                            style={{
                                minHeight: '100px',
                                padding: '8px',
                                backgroundColor: 'transparent',
                                borderRadius: '6px',
                                overflowY: 'auto',
                                maxHeight: '600px'
                            }}
                        >
                            {tasks.map((task, index) => (
                                <div
                                    key={task._id || `task-${index}`}
                                    className="card custom-card mb-3"
                                    style={{
                                        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                                        borderLeft: `4px solid ${task.priority === 'High' ? '#dc3545' : task.priority === 'Medium' ? '#0dcaf0' : '#ffc107'}`
                                    }}
                                >
                                    <div className="card-header justify-content-between">
                                        <div className="task-badges d-flex gap-1 flex-wrap">
                                            {task._id && (
                                                <span className="badge bg-primary1-transparent">#{task._id.slice(-4)}</span>
                                            )}
                                            {task.tags && Array.isArray(task.tags) && task.tags.map(tag => (
                                                <span key={tag} className="badge bg-info-transparent">{tag}</span>
                                            ))}
                                        </div>
                                        
                                    </div>
                                    <div className="card-body">
                                        <h6 className="fw-medium mb-1 fs-15">{task.title || 'Untitled Task'}</h6>
                                        <p className="kanban-task-description text-muted small mb-2">
                                            {task.description || 'No description provided'}
                                        </p>
                                        <div className="kanban-card-footer d-flex gap-2 mt-3">
                                            <span className={`badge ${task.priority === 'High' ? 'bg-danger' : task.priority === 'Medium' ? 'bg-info' : 'bg-warning'}`}>
                                                {task.priority || 'Low'}
                                            </span>
                                            <span className="badge bg-success">
                                                {task.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3 border-top border-block-start-dashed">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="avatar-list-stacked">
                                                {task.assigned_to && Array.isArray(task.assigned_to) && task.assigned_to.length > 0 ? (
                                                    <>
                                                        {task.assigned_to.slice(0, 3).map((member, idx) => (
                                                            <span key={member._id || `member-${idx}`} className="avatar avatar-sm avatar-rounded">
                                                                
                                                            </span>
                                                        ))}
                                                        {task.assigned_to.length > 3 && (
                                                            <span className="avatar avatar-sm bg-primary avatar-rounded text-fixed-white">
                                                                +{task.assigned_to.length - 3}
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="badge bg-light text-dark">Unassigned</span>
                                                )}
                                            </div>
                                            <div>
                                                <span className="me-2 text-secondary small">
                                                    <i className="ri-calendar-line me-1"></i>
                                                    {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default KanbanBoard;