import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

export const TaskList = () => {
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [showUnassignModal, setShowUnassignModal] = useState(false);
    const [selectedUnassignMembers, setSelectedUnassignMembers] = useState([]);
    const navigate = useNavigate();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [stats, setStats] = useState({
        new: 0,
        Done: 0,
        pending: 0,
        inprogress: 0,
        notStarted: 0
    });
    const [currentPage, setCurrentPage] = useState(1);
    const tasksPerPage = 5;
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    

    const fetchCurrentUser = async () => {
        try {

            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/signin');
                return;
            }

            const response = await axios.get('https://lavoro-back.onrender.com/users/me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data) {
                setCurrentUser(response.data);
                return response.data._id;
            }
            throw new Error('Failed to fetch user data');
        } catch (err) {
            console.error('Error fetching user:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load user data');
            throw err;
        }
    };

    const fetchTasks = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/signin');
                return;
            }
            const response = await axios.get(`https://lavoro-back.onrender.com/tasks?created_by=${userId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }            });

            if (response.data.success) {
                setTasks(response.data.data);
                calculateStats(response.data.data);
            } else {
                throw new Error(response.data.message || 'Failed to fetch tasks');
            }
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError(err.response?.data?.message || err.message || 'Failed to load tasks');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const response = await axios.get('https://lavoro-back.onrender.com/teamMember/getAllMemberTasks', {
                withCredentials: true
            });
            if (response.data.success) {
                const validMembers = response.data.data.filter(member => member?._id);
                setTeamMembers(validMembers);
            }
        } catch (err) {
            console.error('Error fetching team members:', err);
            Swal.fire('Error', 'Failed to load team members', 'error');
        }
    };

    useEffect(() => {
        const initializeData = async () => {
            try {
                setLoading(true);
                const userId = await fetchCurrentUser();
                if (userId) {
                    await Promise.all([
                        fetchTasks(userId),
                        fetchTeamMembers()
                    ]);
                }
            } catch (err) {
                console.error('Initialization error:', err);
                setLoading(false);
            }
        };

        initializeData();
    }, []);

    useEffect(() => {
        calculateStats(getFilteredTasks());
    }, [statusFilter, tasks]);

    const getPaginatedTasks = () => {
        const filtered = getFilteredTasks();
        const startIndex = (currentPage - 1) * tasksPerPage;
        return filtered.slice(startIndex, startIndex + tasksPerPage);
    };

  const getFilteredTasks = () => {
    let filtered = tasks;
    
    // Apply status filter if not 'all'
    if (statusFilter !== 'all') {
        filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Apply search filter if query exists
    if (searchQuery) {
        filtered = filtered.filter(task => 
            task.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }
    
    return filtered;
};

useEffect(() => {
    if (searchQuery) {
        setCurrentPage(1);
    }
}, [searchQuery]);

    const calculateStats = (tasks) => {
        const newStats = {
            new: tasks.length,
            Done: tasks.filter(task => task.status === 'Done').length,
            pending: tasks.filter(task => task.status === 'Not Started').length,
            inprogress: tasks.filter(task => task.status === 'In Progress').length
        };
        setStats(newStats);
    };

    const handleAssignMembers = async () => {
        if (!currentTask || selectedMembers.length === 0) return;

        try {
            setIsAssigning(true);

            const response = await axios.patch(
                `https://lavoro-back.onrender.com/tasks/${currentTask._id}/assign`,
                {
                    memberIds: selectedMembers.filter(id => id)
                },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                // Preserve the existing project_id data when updating
                setTasks(tasks.map(task =>
                    task._id === currentTask._id
                        ? { ...response.data.data, project_id: task.project_id }
                        : task
                ));

                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Members assigned successfully',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (err) {
            console.error('Error assigning members:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'Failed to assign members',
                confirmButtonText: 'OK'
            });
        } finally {
            setIsAssigning(false);
            setShowAssignModal(false);
            setSelectedMembers([]);
        }
    };

    const handleUnassignMembers = async () => {
        if (!currentTask || selectedUnassignMembers.length === 0) return;

        try {
            setIsAssigning(true);

            const response = await axios.patch(
                `https://lavoro-back.onrender.com/tasks/${currentTask._id}/unassign`,
                {
                    memberIds: selectedUnassignMembers.filter(id => id)
                },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data.success) {
                // Preserve the existing project_id data when updating
                setTasks(tasks.map(task =>
                    task._id === currentTask._id
                        ? { ...response.data.data, project_id: task.project_id }
                        : task
                ));

                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Members unassigned successfully',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (err) {
            console.error('Error unassigning members:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'Failed to unassign members',
                confirmButtonText: 'OK'
            });
        } finally {
            setIsAssigning(false);
            setShowUnassignModal(false);
            setSelectedUnassignMembers([]);
        }
    };


    const handleDeleteTask = async (taskId, status) => {
        if (status !== 'Not Started') {
            Swal.fire({
                icon: 'error',
                title: 'Cannot Delete Task',
                text: 'You can only delete tasks that are "Not Started"',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            const result = await Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, delete it!'
            });

            if (result.isConfirmed) {
                const response = await axios.delete(`https://lavoro-back.onrender.com/tasks/${taskId}`, {
                    withCredentials: true
                });

                if (response.data.success) {
                    setTasks(tasks.filter(task => task._id !== taskId));
                    calculateStats(tasks.filter(task => task._id !== taskId));
                    Swal.fire(
                        'Deleted!',
                        'Your task has been deleted.',
                        'success'
                    );
                } else {
                    throw new Error(response.data.message || 'Failed to delete task');
                }
            }
        } catch (err) {
            console.error('Error deleting task:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || err.message || 'Failed to delete task',
                confirmButtonText: 'OK'
            });
        }
    };

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 'High':
                return 'badge bg-danger-transparent';
            case 'Medium':
                return 'badge bg-secondary-transparent';
            case 'Low':
                return 'badge bg-success-transparent';
            default:
                return 'badge bg-secondary-transparent';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Not Started':
                return 'text-primary';
            case 'In Progress':
                return 'text-secondary';
            case 'Pending':
                return 'text-warning';
            case 'Done':
                return 'text-success';
            default:
                return 'text-primary';
        }
    };

    const renderAssignedAvatars = (assignedTo, task) => {
        if (!assignedTo || assignedTo.length === 0) {
            return <span className="text-muted">Not assigned</span>;
        }

        const validMembers = assignedTo.filter(member => member && member.user_id);
        const membersToShow = validMembers.slice(0, 4);
        const extraMembersCount = validMembers.length - 4;

        return (
            <div className="avatar-list-stacked">
                {membersToShow.map((member) => {
                    const user = member.user_id;
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                    const avatarKey = member._id || user._id || Math.random().toString(36).substr(2, 9);

                    return (
                        <span
                            key={avatarKey}
                            className="avatar avatar-sm avatar-rounded"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCurrentTask(task);
                                setSelectedUnassignMembers([member._id]);
                                setShowUnassignModal(true);
                            }}
                            style={{ cursor: 'pointer' }}
                        >
                            <img
                                src={
                                    user.image && (user.image.startsWith('http') || user.image.startsWith('https'))
                                        ? user.image
                                        : user.image
                                            ? `https://lavoro-back.onrender.com${user.image}`
                                            : '../assets/images/faces/11.jpg'
                                }
                                alt={fullName || 'User avatar'}
                                className="img-fluid"
                                onError={(e) => {
                                    e.target.src = '../assets/images/faces/11.jpg';
                                    e.target.alt = 'Default avatar';
                                }}
                            />
                        </span>
                    );
                })}

                {extraMembersCount > 0 && (
                    <span
                        className="avatar avatar-sm avatar-rounded"
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentTask(task);
                            setShowUnassignModal(true);
                        }}
                        style={{
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#6366F1'
                        }}
                        title={`${extraMembersCount} more members`}
                    >
                        <span className="text-dark fw-semibold">+{extraMembersCount}</span>
                    </span>
                )}
            </div>
        );

    };


    const handleSendReminder = async (taskId) => {
      try {
        const token = localStorage.getItem('token');
        await axios.post(`https://lavoro-back.onrender.com/notifications/tasks/${taskId}/reminder`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Show success message using SweetAlert2
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Reminder sent successfully',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (err) {
        console.error('Error sending reminder:', err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || 'Failed to send reminder',
          confirmButtonText: 'OK'
        });
      }
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

    if (error) {
        return (
            <div className="alert alert-danger">
                <strong>Error:</strong> {error}
                <button className="btn btn-sm btn-link" onClick={() => window.location.reload()}>Try again</button>
            </div>
        );
    }

    return (
        <>
            <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
                <div>
                    <nav>
                        <ol className="breadcrumb mb-1">
                            <li className="breadcrumb-item">
                                <a href="javascript:void(0);">Apps</a>
                            </li>
                            <span className="mx-1">→</span>
                            <li className="breadcrumb-item">
                                <a href="javascript:void(0);">Task</a>
                            </li>
                            <span className="mx-1">→</span>
                            <li className="breadcrumb-item active" aria-current="page">
                                Task List View
                            </li>
                        </ol>
                    </nav>
                    <h1 className="page-title fw-medium fs-18 mb-0">
                        Task List View
                    </h1>
                </div>

            </div>

            <div className="row">
                <div className="col-xxl-3">
                    <div className="card custom-card overflow-hidden main-content-card">
                        <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between mb-2">
                                <div>
                                    <span className="text-muted d-block mb-1">All Tasks</span>
                                    <h4 className="fw-medium mb-0">{stats.new}</h4>
                                </div>
                                <div className="lh-1">
                                    <span className="avatar avatar-md avatar-rounded bg-primary">
                                        <i className="ri-task-line fs-5" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xxl-3">
                    <div className="card custom-card overflow-hidden main-content-card">
                        <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between mb-2">
                                <div>
                                    <span className="text-muted d-block mb-1">Done Tasks</span>
                                    <h4 className="fw-medium mb-0">{stats.Done}</h4>
                                </div>
                                <div className="lh-1">
                                    <span className="avatar avatar-md avatar-rounded bg-primary1">
                                        <i className="ri-check-line fs-5" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xxl-3">
                    <div className="card custom-card overflow-hidden main-content-card">
                        <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between mb-2">
                                <div>
                                    <span className="text-muted d-block mb-1">Not Started Tasks</span>
                                    <h4 className="fw-medium mb-0">{stats.pending}</h4>
                                </div>
                                <div className="lh-1">
                                    <span className="avatar avatar-md avatar-rounded bg-primary2">
                                        <i className="ri-time-line fs-5" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-xxl-3">
                    <div className="card custom-card overflow-hidden main-content-card">
                        <div className="card-body">
                            <div className="d-flex align-items-start justify-content-between mb-2">
                                <div>
                                    <span className="text-muted d-block mb-1">In Progress Tasks</span>
                                    <h4 className="fw-medium mb-0">{stats.inprogress}</h4>
                                </div>
                                <div className="lh-1">
                                    <span className="avatar avatar-md avatar-rounded bg-primary3">
                                        <i className="ri-loader-line fs-5" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Task Table */}
            <div className="row">
                <div className="col-xxl-12 col-xl-12">
                    <div className="card custom-card">
                        <div className="card-header justify-content-between">
                            <div className="card-title">Total Tasks</div>
                             <div className="input-group me-2" style={{ maxWidth: '250px' }}>
            <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            
        </div>
                            <div className="d-flex align-items-center">
                               
                                <div className="d-flex">
                                    <button
                                        className="btn btn-sm btn-primary btn-wave waves-light"
                                        onClick={() => navigate('/createTask')}
                                    >
                                        <i className="ri-add-line fw-medium align-middle me-1" />{" "}
                                        Create Task
                                    </button>
                                </div>
                                <div className="dropdown ms-2">
                                    <button
                                        className="btn btn-icon btn-secondary-light btn-sm btn-wave waves-light"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                    >
                                        <i className="ri-more-2-fill" />
                                    </button>
                                    <ul className="dropdown-menu">
                                        <li>
                                            <a
                                                className="dropdown-item"
                                                href="javascript:void(0);"
                                                onClick={() => setStatusFilter('all')}
                                            >
                                                All Tasks
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                className="dropdown-item"
                                                href="javascript:void(0);"
                                                onClick={() => setStatusFilter('Not Started')}
                                            >
                                                Not Started Tasks
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                className="dropdown-item"
                                                href="javascript:void(0);"
                                                onClick={() => setStatusFilter('In Progress')}
                                            >
                                                In Progress Tasks
                                            </a>
                                        </li>
                                        <li>
                                            <a
                                                className="dropdown-item"
                                                href="javascript:void(0);"
                                                onClick={() => setStatusFilter('Done')}
                                            >
                                                Done Tasks
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table text-nowrap">
                                    <thead>
                                        <tr>
                                            <th>
                                                <input
                                                    className="form-check-input check-all"
                                                    type="checkbox"
                                                    id="all-tasks"
                                                    defaultValue=""
                                                    aria-label="..."
                                                />
                                            </th>
                                            <th scope="col">Task</th>
                                            <th scope="col">Assigned Date</th>
                                            <th scope="col">Status</th>
                                            <th scope="col">Due Date</th>
                                            <th scope="col">Priority</th>
                                            <th scope="col">Assigned To</th>
                                            <th scope="col">Project</th>
                                            <th scope="col">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {getPaginatedTasks().map(task => (
                                            <tr
                                                className="task-list"
                                                key={`task-${task._id}`}
                                                onClick={() => navigate(`/taskdetails/${task._id}`)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <td className="task-checkbox" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        defaultValue=""
                                                        aria-label="..."
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td>
                                                    <span className="fw-medium">
                                                        {task.title}
                                                    </span>
                                                </td>
                                                <td>
                                                    {new Date(task.start_date).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <span className={`fw-medium ${getStatusClass(task.status)}`}>
                                                        {task.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {new Date(task.deadline).toLocaleDateString()}
                                                </td>
                                                <td>
                                                    <span className={getPriorityBadge(task.priority)}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    {renderAssignedAvatars(task.assigned_to, task)}
                                                </td>
                                                <td>
                                                    <span className="badge bg-info-transparent">
                                                        {task.project_id?.name || 'No Project'}
                                                    </span>
                                                </td>
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <div className="d-flex align-items-center">
                                                        <button
                                                            className="btn btn-primary-light btn-icon btn-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCurrentTask(task);
                                                                setShowAssignModal(true);
                                                            }}
                                                        >
                                                            <i className="ri-user-add-line" />
                                                        </button>
                                                        <button
                                                            className="btn btn-danger-light btn-icon ms-1 btn-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeleteTask(task._id, task.status);
                                                            }}
                                                        >
                                                            <i className="ri-delete-bin-5-line" />
                                                        </button>
                                                        <button 
            className="btn btn-secondary-light btn-icon ms-1 btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleSendReminder(task._id);
            }}
          >
            <i className="ri-notification-3-line" />
          </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {getFilteredTasks().length > tasksPerPage && (
                            <div className="d-flex justify-content-end mt-3">
                                <nav aria-label="Page navigation" className="pagination-style-4">
                                    <ul className="pagination mb-0 flex-wrap">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link"
                                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            >
                                                Prev
                                            </button>
                                        </li>

                                        {Array.from({ length: Math.ceil(getFilteredTasks().length / tasksPerPage) }).map((_, index) => {
                                            const pageNumber = index + 1;
                                            if (
                                                pageNumber === 1 ||
                                                pageNumber === 2 ||
                                                pageNumber === Math.ceil(getFilteredTasks().length / tasksPerPage) - 1 ||
                                                pageNumber === Math.ceil(getFilteredTasks().length / tasksPerPage) ||
                                                (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                            ) {
                                                return (
                                                    <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                                                        <button className="page-link" onClick={() => setCurrentPage(pageNumber)}>
                                                            {pageNumber}
                                                        </button>
                                                    </li>
                                                );
                                            } else if (
                                                pageNumber === 3 ||
                                                pageNumber === Math.ceil(getFilteredTasks().length / tasksPerPage) - 2
                                            ) {
                                                return (
                                                    <li key={pageNumber} className="page-item">
                                                        <button className="page-link">
                                                            <i className="ri-more-line"></i>
                                                        </button>
                                                    </li>
                                                );
                                            }
                                            return null;
                                        })}

                                        <li className={`page-item ${currentPage === Math.ceil(getFilteredTasks().length / tasksPerPage) ? 'disabled' : ''}`}>
                                            <button
                                                className="page-link text-primary"
                                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(getFilteredTasks().length / tasksPerPage)))}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}
                        <br />
                    </div>
                </div>
            </div>

            {/* Assign Member Modal */}
            {showAssignModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">Assign Members</h6>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedMembers([]);
                                    }}
                                    aria-label="Close"
                                />
                            </div>
                            <div className="modal-body">
                                <div className="row gy-2">
                                    <div className="col-xl-12">
                                        <label className="form-label">Select Members</label>
                                        <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {teamMembers.map(member => {
                                                if (!member || !member._id) return null;

                                                const user = member.user_id || {};
                                                const isAssigned = currentTask?.assigned_to?.some(
                                                    a => a?._id?.toString() === member._id.toString()
                                                );

                                                const memberKey = `member-${member._id}`;

                                                return (
                                                    <div
                                                        key={memberKey}
                                                        className={`list-group-item list-group-item-action ${isAssigned ? 'disabled' : ''}`}
                                                        onClick={() => {
                                                            if (!isAssigned) {
                                                                setSelectedMembers(prev => {
                                                                    if (prev.includes(member._id)) {
                                                                        return prev.filter(id => id !== member._id);
                                                                    } else {
                                                                        return [...prev, member._id];
                                                                    }
                                                                });
                                                            }
                                                        }}
                                                        style={{ cursor: isAssigned ? 'not-allowed' : 'pointer' }}
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <div className="form-check me-3">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={selectedMembers.includes(member._id)}
                                                                    onChange={() => {}}
                                                                    disabled={isAssigned}
                                                                />
                                                            </div>
                                                            <div className="avatar avatar-sm avatar-rounded me-3" style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                borderRadius: '1px',
                                                                overflow: 'hidden'
                                                            }}>
                                                                <img
                                                                    src={
                                                                        user.image && (user.image.startsWith('http') || user.image.startsWith('https'))
                                                                            ? user.image
                                                                            : user.image
                                                                                ? `https://lavoro-back.onrender.com${user.image}`
                                                                                : '../assets/images/faces/11.jpg'
                                                                    }
                                                                    alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'}
                                                                    className="img-fluid h-100 w-100 object-fit-cover"
                                                                    style={{ objectFit: 'cover' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="fw-medium">
                                                                    {user.firstName || 'Unknown'} {user.lastName || ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        setSelectedMembers([]);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    disabled={isAssigning || selectedMembers.length === 0}
                                    onClick={handleAssignMembers}
                                >
                                    {isAssigning ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                            Assigning...
                                        </>
                                    ) : 'Assign Members'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Unassign Member Modal */}
            {showUnassignModal && (
                <div className="modal fade show" style={{ display: 'block' }} tabIndex={-1}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h6 className="modal-title">Unassign Members</h6>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowUnassignModal(false);
                                        setSelectedUnassignMembers([]);
                                    }}
                                    aria-label="Close"
                                />
                            </div>
                            <div className="modal-body">
                                <div className="row gy-2">
                                    <div className="col-xl-12">
                                        <label className="form-label">Select Members to Unassign</label>
                                        <div className="list-group" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                            {currentTask?.assigned_to?.map(member => {
                                                if (!member || !member._id) return null;

                                                const user = member.user_id || {};
                                                const memberKey = `unassign-member-${member._id}`;

                                                return (
                                                    <div
                                                        key={memberKey}
                                                        className="list-group-item list-group-item-action"
                                                    >
                                                        <div className="d-flex align-items-center">
                                                            <div className="form-check me-3">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={selectedUnassignMembers.includes(member._id)}
                                                                    onChange={() => {
                                                                        setSelectedUnassignMembers(prev => {
                                                                            if (prev.includes(member._id)) {
                                                                                return prev.filter(id => id !== member._id);
                                                                            } else {
                                                                                return [...prev, member._id];
                                                                            }
                                                                        });
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="avatar avatar-sm avatar-rounded me-3" style={{
                                                                width: '40px',
                                                                height: '40px',
                                                                borderRadius: '1px',
                                                                overflow: 'hidden'
                                                            }}>
                                                                <img
                                                                    src={
                                                                        user.image && (user.image.startsWith('http') || user.image.startsWith('https'))
                                                                            ? user.image
                                                                            : user.image
                                                                                ? `https://lavoro-back.onrender.com${user.image}`
                                                                                : '../assets/images/faces/11.jpg'
                                                                    }
                                                                    alt={`${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User'}
                                                                    className="img-fluid h-100 w-100 object-fit-cover"
                                                                    style={{ objectFit: 'cover' }}
                                                                />
                                                            </div>
                                                            <div>
                                                                <div className="fw-medium">
                                                                    {user.firstName || 'Unknown'} {user.lastName || ''}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={() => {
                                        setShowUnassignModal(false);
                                        setSelectedUnassignMembers([]);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    disabled={isAssigning || selectedUnassignMembers.length === 0}
                                    onClick={handleUnassignMembers}
                                >
                                    {isAssigning ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                            Unassigning...
                                        </>
                                    ) : 'Unassign Members'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};