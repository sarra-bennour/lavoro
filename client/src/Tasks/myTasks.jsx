

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../../public/assets/libs/dragula/dragula.min.css";

export const MyTasks = () => {
  const [allTasks, setAllTasks] = useState([]); // Store all tasks
  const [filteredTasks, setFilteredTasks] = useState([]); // Tasks to display
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const navigateToPrioritizedTasks = () => {
    navigate('/prioritized-tasks');
  };

  // State for active tab and filters
  const [activeTab, setActiveTab] = useState('all');
  const [priorityFilters, setPriorityFilters] = useState({
    High: false,
    Medium: false,
    Low: false
  });

  // Status counts for the sidebar
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    Done: 0,
    today: 0,
    starred: 0,
    InProgress: 0,
    NotStarted: 0
  });

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate("/signin");
          return;
        }

        // Fetch user info
        const userResponse = await axios.get("https://lavoro-back.onrender.com/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true
        });
        setUser(userResponse.data);

        // Fetch tasks for the user
        const tasksResponse = await axios.get(`https://lavoro-back.onrender.com/tasks/my-tasks`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setAllTasks(tasksResponse.data.data);
        setFilteredTasks(tasksResponse.data.data);

        // Calculate status counts
        const today = new Date().toISOString().split('T')[0];
        setStatusCounts({
          all: tasksResponse.data.data.length,
          Done: tasksResponse.data.data.filter(t => t.status === 'Done').length,
          today: tasksResponse.data.data.filter(t =>
            t.deadline && new Date(t.deadline).toISOString().split('T')[0] === today
          ).length,
          InProgress: tasksResponse.data.data.filter(t => t.status === 'In Progress').length,
          NotStarted: tasksResponse.data.data.filter(t => t.status === 'Not Started').length,
        });

      } catch (err) {
        console.error("Error:", err);
        setError(err.response?.data?.message || 'Error fetching data');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate("/signin");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndTasks();
  }, [navigate]);

  // Filter tasks based on active tab and priority filters
  useEffect(() => {
    let filtered = allTasks;

    // Apply status filter based on active tab
    if (activeTab !== 'all') {
      filtered = filtered.filter(task => {
        switch (activeTab) {
          case 'Done': return task.status === 'Done';
          case 'today':
            const today = new Date().toISOString().split('T')[0];
            return task.deadline && new Date(task.deadline).toISOString().split('T')[0] === today;
          case 'InProgress': return task.status === 'In Progress';
          case 'NotStarted': return task.status === 'Not Started';
          default: return true;
        }
      });
    }

    // Apply priority filters if any are selected
    const activePriorityFilters = Object.keys(priorityFilters).filter(
      key => priorityFilters[key]
    );

    if (activePriorityFilters.length > 0) {
      filtered = filtered.filter(task =>
        activePriorityFilters.includes(task.priority)
      );
    }

    setFilteredTasks(filtered);
  }, [activeTab, priorityFilters, allTasks]);

  const startTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `https://lavoro-back.onrender.com/tasks/${taskId}/start`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update the task in the local state
      setAllTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId
            ? { ...task, status: 'In Progress', start_date: new Date() }
            : task
        )
      );

    } catch (err) {
      console.error("Error starting task:", err);
      setError(err.response?.data?.message || 'Error starting task');
    }
  };

  const completeTask = async (taskId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `https://lavoro-back.onrender.com/tasks/${taskId}/complete`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Update the task in the local state
      setAllTasks(prevTasks =>
        prevTasks.map(task =>
          task._id === taskId
            ? { ...task, status: 'Done' }
            : task
        )
      );

    } catch (err) {
      console.error("Error completing task:", err);
      setError(err.response?.data?.message || 'Error completing task');
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handlePriorityFilterChange = (priority) => {
    setPriorityFilters(prev => ({
      ...prev,
      [priority]: !prev[priority]
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Not Started':
        return <span className="fw-medium text-muted">
          <i className="ri-circle-line fw-semibold fs-7 me-2 lh-1 align-middle" />
          Not Started
        </span>;
      case 'In Progress':
        return <span className="fw-medium text-primary">
          <i className="ri-circle-line fw-semibold fs-7 me-2 lh-1 align-middle" />
          In Progress
        </span>;
      case 'Done':
        return <span className="fw-medium text-success">
          <i className="ri-checkbox-circle-line fw-semibold fs-7 me-2 lh-1 align-middle" />
          Done
        </span>;
      default:
        return <span className="fw-medium text-secondary">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Low': return <span className="badge bg-success-transparent">Low</span>;
      case 'Medium': return <span className="badge bg-warning-transparent">Medium</span>;
      case 'High': return <span className="badge bg-danger-transparent">High</span>;
      default: return <span className="badge bg-secondary-transparent">{priority}</span>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return <div className="text-center p-5">Loading tasks...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <>
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
        <div>
          <nav>
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <a href="javascript:void(0);">Pages</a>
              </li>
              <span className="mx-1">→</span>
              <li className="breadcrumb-item active" aria-current="page">
              My Tasks
              </li>
            </ol>
          </nav>
          <h1 className="page-title fw-medium fs-18 mb-0">My Tasks </h1>
        </div>

      </div>

      <div className="row">
        <div className="col-xl-3">
          <div className="card custom-card">
            <div className="card-header gap-3 align-items-center pb-3 border-bottom border-block-end-dashed">
              <span className="avatar avatar-md bg-primary avatar-rounded">
                <i className="ri-file-list-3-line fs-16" />
              </span>
              <div className="card-title">
                To Do List
                <span className="text-muted d-block fs-12"> My Task list</span>
              </div>
              <div className="ms-auto">
                <button
                  className="btn btn-primary btn-sm btn-wave"
                  onClick={navigateToPrioritizedTasks}
                >
                  <i className="ri-ai-generate me-1"></i> AI Prioritized Tasks
                </button>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="p-3 task-navigation border-bottom border-block-end-dashed">
                <ul className="list-unstyled task-main-nav mb-0">
                  <li className="px-0 pt-0">
                    <span className="fs-11 text-muted op-7 fw-medium">General</span>
                  </li>
                  <li className={activeTab === 'all' ? 'active' : ''}>
                    <a href="javascript:void(0);" onClick={() => handleTabChange('all')}>
                      <div className="d-flex align-items-center">
                        <span className="me-2 lh-1">
                          <i className="ri-checkbox-multiple-line align-middle fs-14" />
                        </span>
                        <span className="flex-fill text-nowrap">All Tasks</span>
                        <span className="badge bg-info-transparent rounded-pill">
                          {statusCounts.all}
                        </span>
                      </div>
                    </a>
                  </li>
                  <li className={activeTab === 'Done' ? 'active' : ''}>
                    <a href="javascript:void(0);" onClick={() => handleTabChange('Done')}>
                      <div className="d-flex align-items-center">
                        <span className="me-2 lh-1">
                          <i className="ri-checkbox-circle-line align-middle fs-14 text-primary" />
                        </span>
                        <span className="flex-fill text-nowrap">Done</span>
                        <span className="badge bg-primary1-transparent rounded-pill">
                          {statusCounts.Done}
                        </span>
                      </div>
                    </a>
                  </li>
                  <li className={activeTab === 'today' ? 'active' : ''}>
                    <a href="javascript:void(0);" onClick={() => handleTabChange('today')}>
                      <div className="d-flex align-items-center">
                        <span className="me-2 lh-1">
                          <i className="ri-calendar-line align-middle fs-14 text-primary" />
                        </span>
                        <span className="flex-fill text-nowrap">Today</span>
                        <span className="badge bg-primary-transparent rounded-pill">
                          {statusCounts.today}
                        </span>
                      </div>
                    </a>
                  </li>
                  <li className={activeTab === 'NotStarted' ? 'active' : ''}>
                    <a href="javascript:void(0);" onClick={() => handleTabChange('NotStarted')}>
                      <div className="d-flex align-items-center">
                        <span className="me-2 lh-1">
                          <i className="ri-git-repository-line text-primary align-middle fs-14" />
                        </span>
                        <span className="flex-fill text-nowrap">Not Started</span>
                        <span className="badge bg-primary3-transparent rounded-pill">
                          {statusCounts.NotStarted}
                        </span>
                      </div>
                    </a>
                  </li>
                  <li className={activeTab === 'InProgress' ? 'active' : ''}>
                    <a href="javascript:void(0);" onClick={() => handleTabChange('InProgress')}>
                      <div className="d-flex align-items-center">
                        <span className="me-2 lh-1">
                          <i className="ri-hourglass-fill text-primary align-middle fs-14" />
                        </span>
                        <span className="flex-fill text-nowrap">In Progress</span>
                        <span className="badge bg-primary-transparent rounded-pill">
                          {statusCounts.InProgress}
                        </span>
                      </div>
                    </a>
                  </li>
                </ul>
                <ul className="list-unstyled task-main-nav mb-0">
                  <li className="px-0 pt-2 d-flex justify-content-between gap-2 align-items-center">
                    <span className="fs-11 text-muted op-7 fw-medium">Priority</span>
                  </li>
                  {['High', 'Medium', 'Low'].map(priority => (
                    <li key={priority}>
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        <div>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={priorityFilters[priority]}
                            onChange={() => handlePriorityFilterChange(priority)}
                            aria-label={priority}
                          />
                        </div>
                        <div>
                          <a href="javascript:void(0);">
                            <span className="fw-medium">{priority}</span>
                          </a>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-9">
          <div className="card custom-card">
            <div className="card-body p-0 position-relative" id="todo-content">
              <div>
                <div className="table-responsive">
                  <table className="table text-nowrap">
                    <thead>
                      <tr>
                        <th className="todolist-handle-drag"></th>
                        <th scope="col">Task Title</th>
                        <th scope="col">Status</th>
                        <th scope="col">Dead Line</th>
                        <th scope="col">Priority</th>
                        <th scope="col">Project</th>
                        <th scope="col" className="todolist-progress">
                          Progress
                        </th>
                        <th scope="col" className="text-end">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody id="todo-drag">
                      {filteredTasks.length > 0 ? (
                        filteredTasks.map(task => (
                          <tr
                            className="todo-box"
                            key={task._id}
                            onClick={() => navigate(`/developer/taskdetails/${task._id}`)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td onClick={(e) => e.stopPropagation()}>
                              <button className="btn btn-icon btn-sm btn-wave btn-light todo-handle">
                                : :
                              </button>
                            </td>
                            <td>
                              <a
                                href="#"
                                className="fw-medium text-dark"
                                onClick={(e) => {
                                  e.preventDefault();
                                  navigate(`/developer/taskdetails/${task._id}`);
                                }}
                                style={{ textDecoration: 'none' }}
                              >
                                {task.title}
                              </a>
                            </td>
                            <td>{getStatusBadge(task.status)}</td>
                            <td>{formatDate(task.deadline)}</td>
                            <td>{getPriorityBadge(task.priority)}</td>
                            <td className="fw-medium">
                              {task.project_id?.name || 'N/A'}
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="progress progress-animate progress-xs w-100">
                                  <div
                                    className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                                    style={{ width: task.status === 'Done' ? '100%' : task.status === 'In Progress' ? '50%' : '10%' }}
                                  />
                                </div>
                                <div className="ms-2">
                                  {task.status === 'Done' ? '100%' : task.status === 'In Progress' ? '50%' : '10%'}
                                </div>
                              </div>
                            </td>
                            <td className="text-end" onClick={(e) => e.stopPropagation()}>
                              <div className="d-flex gap-2 justify-content-end">
                                {task.status === 'Not Started' && (
                                  <button
                                    className="btn btn-icon btn-sm btn-info-light btn-wave"
                                    onClick={() => startTask(task._id)}
                                    title="Start Task"
                                  >
                                    <i className="ri-play-fill" />
                                  </button>
                                )}
                                {task.status === 'In Progress' && (
                                  <button
                                    className="btn btn-icon btn-sm btn-success-light btn-wave"
                                    onClick={() => completeTask(task._id)}
                                    title="Complete Task"
                                  >
                                    <i className="ri-checkbox-line" />
                                  </button>
                                )}
                                {task.status === 'Done' && (
                                  <span className="text-success">
                                    <i className="ri-checkbox-circle-fill fs-16" />
                                  </span>
                                )}

                                <button
                                  className="btn btn-icon btn-sm btn-primary-light btn-wave"
                                  onClick={() => navigate(`/developer/taskdetails/${task._id}`)}
                                  title="View Details"
                                >
                                  <i className="ri-eye-line" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            No tasks found matching your filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="card-footer border-top-0">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  Showing {filteredTasks.length} Entries <i className="ri-arrow-right ms-2 fw-semibold" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

