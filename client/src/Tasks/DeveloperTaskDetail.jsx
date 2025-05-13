import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import DeveloperCommentsView from './DeveloperCommentsView';
import './DeveloperTaskDetail.css';

export const DeveloperTaskDetail = () => {
  const [assigneePage, setAssigneePage] = useState(0);
  const assigneesPerPage = 4;
  const [issueUrl, setIssueUrl] = useState('');

  const { taskId } = useParams();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const fetchTaskAndCheckRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const userResponse = await axios.get('https://lavoro-back.onrender.com/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCurrentUser(userResponse.data);
        setIsDeveloper(userResponse.data.role?.RoleName === 'Developer');

        const response = await axios.get(`https://lavoro-back.onrender.com/tasks/task/${taskId}`);
        setTask(response.data.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Error fetching task');
      } finally {
        setLoading(false);
      }
    };

    fetchTaskAndCheckRole();
  }, [taskId]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Not Started':
        return <span className="badge bg-warning-transparent">Not Started</span>;
      case 'In Progress':
        return <span className="badge bg-info-transparent">In Progress</span>;
      case 'Completed':
        return <span className="badge bg-success-transparent">Completed</span>;
      default:
        return <span className="badge bg-secondary-transparent">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Low':
        return <span className="badge bg-success-transparent">Low</span>;
      case 'Medium':
        return <span className="badge bg-warning-transparent">Medium</span>;
      case 'High':
        return <span className="badge bg-danger-transparent">High</span>;
      default:
        return <span className="badge bg-secondary-transparent">{priority}</span>;
    }
  };

  const totalAssigneePages = task?.assigned_to ? Math.ceil(task.assigned_to.length / assigneesPerPage) : 0;

  const handlePrevPage = () => {
    setAssigneePage((prev) => Math.max(prev - 1, 0));
  };

  const handleNextPage = () => {
    setAssigneePage((prev) => Math.min(prev + 1, totalAssigneePages - 1));
  };

  const exportToGitHub = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You must be logged in');

      const response = await fetch(`https://lavoro-back.onrender.com/tasks/${task._id}/export-to-github`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Error exporting to GitHub');

      setIssueUrl(data.issueUrl);
      
      await Swal.fire({
        title: 'Success!',
        text: 'Task successfully exported to GitHub',
        icon: 'success',
        confirmButtonText: 'View Issue',
        showCancelButton: true,
        cancelButtonText: 'Close'
      }).then((result) => {
        if (result.isConfirmed) {
          window.open(data.issueUrl, '_blank');
        }
      });
    } catch (err) {
      await Swal.fire({
        title: 'Error!',
        text: err.message,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setExportLoading(false);
    }
  };

  const paginatedAssignees = task?.assigned_to
    ? task.assigned_to.slice(assigneePage * assigneesPerPage, (assigneePage + 1) * assigneesPerPage)
    : [];

  if (loading) return <div className="text-center p-5"><div className="spinner-border" role="status"></div></div>;
  if (error) return <div className="alert alert-danger m-3">Error: {error}</div>;
  if (!task) return <div className="alert alert-warning m-3">Task not found</div>;
  if (!isDeveloper) return <div className="alert alert-danger m-3">Access denied. This view is only for developers.</div>;

  return (
    <>
    <div className="container-fluid">
      <div className="row mb-3">
        <div className="col-md-12 d-flex justify-content-end" style={{ marginTop: '10px' }}>
          <button 
            onClick={exportToGitHub} 
            className="btn btn-primary"
            disabled={exportLoading}
          >
            {exportLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Exporting...
              </>
            ) : (
              <>
                <i className="ri-github-fill me-2"></i>
                Export to GitHub
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="row">
        
        <div className="col-xxl-9">
          <div className="card custom-card">
            <div className="card-body product-checkout">
              <ul
                className="nav nav-tabs tab-style-8 scaleX d-sm-flex d-block justify-content-around border border-dashed border-bottom-0 bg-light rounded-top"
                id="myTab1"
                role="tablist"
              >
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link p-3 active"
                    id="order-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#order-tab-pane"
                    type="button"
                    role="tab"
                    aria-controls="order-tab"
                    aria-selected="true"
                  >
                    <i className="ri-list-check-3 me-2 align-middle" />
                    Details
                  </button>
                </li>
                
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link p-3"
                    id="comments-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#comments-tab-pane"
                    type="button"
                    role="tab"
                    aria-controls="comments-tab"
                    aria-selected="false"
                  >
                    <i className="ri-chat-3-line me-2 align-middle" />
                    Comments
                  </button>
                </li>
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link p-3"
                    id="delivered-tab"
                    data-bs-toggle="tab"
                    data-bs-target="#delivery-tab-pane"
                    type="button"
                    role="tab"
                    aria-controls="delivered-tab"
                    aria-selected="false"
                  >
                    <i className="ri-checkbox-circle-line me-2 align-middle" />
                    Progress
                  </button>
                </li>
              </ul>
              <div
                className="tab-content border border-dashed"
                id="myTabContent"
              >
                <div
                  className="tab-pane fade show active border-0 p-0"
                  id="order-tab-pane"
                  role="tabpanel"
                  aria-labelledby="order-tab-pane"
                  tabIndex={0}
                >
                  <div className="p-3">
                    <div className="tab-content" id="profile-tabs">
                      <div
                        className="tab-pane show active p-0 border-0"
                        id="profile-about-tab-pane"
                        role="tabpanel"
                        aria-labelledby="profile-about-tab"
                        tabIndex={0}
                      >
                        <ul className="list-group list-group-flush border rounded-3">
                          <li className="list-group-item p-3">
                            <span className="fw-medium fs-15 d-block mb-3">
                              <span className="me-1">✨</span>
                              {task.title} : {getStatusBadge(task.status)}
                            </span>
                            <p className="text-muted mb-2">
                              {task.description || 'No description provided'}
                            </p>
                          </li>
                          <li className="list-group-item p-3">
                            <div className="text-muted">
                              <p className="mb-3">
                                <span className="avatar avatar-sm avatar-rounded text-primary p-1 bg-primary-transparent me-2">
                                  <i className="ri-mail-line align-middle fs-15" />
                                </span>
                                <span className="fw-medium text-default">Start Date : </span>{" "}
                                {task.start_date ? new Date(task.start_date).toLocaleDateString() : 'Not set'}
                              </p>
                              <p className="mb-3">
                                <span className="avatar avatar-sm avatar-rounded text-primary1 p-1 bg-primary1-transparent me-2">
                                  <i className="ri-map-pin-line align-middle fs-15" />
                                </span>
                                <span className="fw-medium text-default">End Date : </span>{" "}
                                {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Not set'}
                              </p>
                              <p className="mb-3">
                                <span className="avatar avatar-sm avatar-rounded text-primary2 p-1 bg-primary2-transparent me-2">
                                  <i className="ri-building-line align-middle fs-15" />
                                </span>
                                <span className="fw-medium text-default">Estimated Duration : </span>{" "}
                                {task.estimated_duration ? `${task.estimated_duration} days` : 'Not estimated'}
                              </p>
                              <p className="mb-0">
                                <span className="avatar avatar-sm avatar-rounded text-primary3 p-1 bg-primary3-transparent me-2">
                                  <i className="ri-phone-line align-middle fs-15" />
                                </span>
                                <span className="fw-medium text-default">Priority : </span>{" "}
                                {getPriorityBadge(task.priority)}
                              </p>
                            </div>
                          </li>
                          {task.tags && task.tags.length > 0 && (
                            <li className="list-group-item p-3">
                              <span className="fw-medium fs-15 d-block mb-3">Tags :</span>
                              <div className="w-75">
                                {task.tags.map((tag, index) => (
                                  <span key={index} className="badge bg-light text-muted m-1 border">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                                <div
                  className="tab-pane fade border-0 p-0"
                  id="comments-tab-pane"
                  role="tabpanel"
                  aria-labelledby="comments-tab-pane"
                  tabIndex={0}
                >
                  <DeveloperCommentsView taskId={task._id} />
                </div>
                <div
                  className="tab-pane fade border-0 p-0"
                  id="delivery-tab-pane"
                  role="tabpanel"
                  aria-labelledby="delivery-tab-pane"
                  tabIndex={0}
                >
                  <div className="p-3">
                    <h5 className="card-title mb-3">Task Progress</h5>

                    {/* Progress bar based on task status */}
                    <div className="progress-stacked mb-4" style={{ height: '30px' }}>
                      <div
                        className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                        role="progressbar"
                        style={{
                          width: task.status === 'Done' || task.status === 'Completed' ? '100%' :
                                 task.status === 'In Review' ? '75%' :
                                 task.status === 'In Progress' ? '50%' : '10%'
                        }}
                        aria-valuenow={
                          task.status === 'Done' || task.status === 'Completed' ? 100 :
                          task.status === 'In Review' ? 75 :
                          task.status === 'In Progress' ? 50 : 10
                        }
                        aria-valuemin="0"
                        aria-valuemax="100"
                      >
                        {task.status === 'Done' || task.status === 'Completed' ? '100%' :
                         task.status === 'In Review' ? '75%' :
                         task.status === 'In Progress' ? '50%' : '10%'}
                      </div>
                    </div>

                    {/* Status timeline */}
                    <div className="task-status-timeline mb-4">
                      <div className="d-flex justify-content-between position-relative">
                        <div className="status-point text-center">
                          <div className={`avatar avatar-xs rounded-circle ${task.status !== 'Not Started' ? 'bg-primary' : 'bg-light'} mx-auto mb-1`}>
                            <i className={`ri-checkbox-blank-circle-fill fs-10 ${task.status !== 'Not Started' ? 'text-white' : 'text-muted'}`}></i>
                          </div>
                          <span className="d-block fs-11 text-muted">Not Started</span>
                        </div>
                        <div className="status-point text-center">
                          <div className={`avatar avatar-xs rounded-circle ${task.status === 'In Progress' || task.status === 'In Review' || task.status === 'Done' || task.status === 'Completed' ? 'bg-primary' : 'bg-light'} mx-auto mb-1`}>
                            <i className={`ri-checkbox-blank-circle-fill fs-10 ${task.status === 'In Progress' || task.status === 'In Review' || task.status === 'Done' || task.status === 'Completed' ? 'text-white' : 'text-muted'}`}></i>
                          </div>
                          <span className="d-block fs-11 text-muted">In Progress</span>
                        </div>
                        <div className="status-point text-center">
                          <div className={`avatar avatar-xs rounded-circle ${task.status === 'In Review' || task.status === 'Done' || task.status === 'Completed' ? 'bg-primary' : 'bg-light'} mx-auto mb-1`}>
                            <i className={`ri-checkbox-blank-circle-fill fs-10 ${task.status === 'In Review' || task.status === 'Done' || task.status === 'Completed' ? 'text-white' : 'text-muted'}`}></i>
                          </div>
                          <span className="d-block fs-11 text-muted">In Review</span>
                        </div>
                        <div className="status-point text-center">
                          <div className={`avatar avatar-xs rounded-circle ${task.status === 'Done' || task.status === 'Completed' ? 'bg-primary' : 'bg-light'} mx-auto mb-1`}>
                            <i className={`ri-checkbox-blank-circle-fill fs-10 ${task.status === 'Done' || task.status === 'Completed' ? 'text-white' : 'text-muted'}`}></i>
                          </div>
                          <span className="d-block fs-11 text-muted">Completed</span>
                        </div>

                        {/* Progress line connecting the points */}
                        <div className="progress position-absolute" style={{ height: '2px', top: '9px', left: '15px', right: '15px', zIndex: 0 }}>
                          <div
                            className="progress-bar bg-primary"
                            role="progressbar"
                            style={{
                              width: task.status === 'Done' || task.status === 'Completed' ? '100%' :
                                    task.status === 'In Review' ? '75%' :
                                    task.status === 'In Progress' ? '50%' : '10%'
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className="alert alert-info">
                      <i className="ri-information-line me-2"></i>
                      Task progress is automatically updated based on the task status.
                    </div>

                    {/* Current status details */}
                    <div className="card bg-light-transparent border mt-4">
                      <div className="card-body">
                        <h6 className="card-title">Current Status: {getStatusBadge(task.status)}</h6>
                        <p className="card-text mb-0">
                          {task.status === 'Not Started' && 'This task has not been started yet.'}
                          {task.status === 'In Progress' && 'This task is currently being worked on.'}
                          {task.status === 'In Review' && 'This task is currently being reviewed.'}
                          {(task.status === 'Done' || task.status === 'Completed') && 'This task has been completed.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xxl-3">
          <div className="card custom-card">
            <div className="card-header">
            <div className="mt-3">
 
</div>
              <div className="card-title me-1"> {task.project_id.name}</div>
            </div>
            <div className="card-body p-0">
              {task.project_id ? (
                <>
                  <ul className="list-group mb-0 border-0 rounded-0">
                    <li className="list-group-item p-3 border-top-0">
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        {task.project_id.ProjectManager_id?.image ? (
                          <img
                            src={
                              task.project_id.ProjectManager_id.image.startsWith('http') ||
                              task.project_id.ProjectManager_id.image.startsWith('https')
                                ? task.project_id.ProjectManager_id.image
                                : `https://lavoro-back.onrender.com${task.project_id.ProjectManager_id.image}`
                            }
                            alt={`${task.project_id.ProjectManager_id.firstName} ${task.project_id.ProjectManager_id.lastName}`}
                            className="avatar avatar-lg bg-light rounded-circle"
                            onError={(e) => {
                              e.target.src = '../assets/images/faces/11.jpg';
                            }}
                          />
                        ) : (
                          <div className="avatar avatar-lg bg-primary rounded-circle d-flex align-items-center justify-content-center">
                            <span className="text-white fs-18">
                              {task.project_id.ProjectManager_id?.firstName?.charAt(0)}
                              {task.project_id.ProjectManager_id?.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-fill">
                          <p className="mb-0 fw-semibold">Project Manager</p>
                          <p className="mb-0 text-muted fs-12">
                            {task.project_id.ProjectManager_id?.firstName} {task.project_id.ProjectManager_id?.lastName}
                          </p>
                        </div>
                      </div>
                    </li>
                    <li className="list-group-item p-3 border-top-0">
                      <div className="d-flex align-items-center flex-wrap gap-2">
                        {task.project_id.manager_id?.image ? (
                          <img
                            src={
                              task.project_id.manager_id.image.startsWith('http') ||
                              task.project_id.manager_id.image.startsWith('https')
                                ? task.project_id.manager_id.image
                                : `https://lavoro-back.onrender.com${task.project_id.manager_id.image}`
                            }
                            alt={`${task.project_id.manager_id.firstName} ${task.project_id.manager_id.lastName}`}
                            className="avatar avatar-lg bg-light rounded-circle"
                            onError={(e) => {
                              e.target.src = '../assets/images/faces/11.jpg';
                            }}
                          />
                        ) : (
                          <div className="avatar avatar-lg bg-primary rounded-circle d-flex align-items-center justify-content-center">
                            <span className="text-white fs-18">
                              {task.project_id.manager_id?.firstName?.charAt(0)}
                              {task.project_id.manager_id?.lastName?.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-fill">
                          <p className="mb-0 fw-semibold">Team Manager</p>
                          <p className="mb-0 text-muted fs-12">
                           {task.project_id.manager_id?.firstName} {task.project_id.manager_id?.lastName}
                          </p>
                        </div>
                      </div>
                    </li>
                    <li className="list-group-item p-3 border-bottom border-block-end-dashed">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-muted">Status:</span>
                        <span>{getStatusBadge(task.project_id.status)}</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-muted">Priority:</span>
                        <span>{getPriorityBadge(task.project_id.priority)}</span>
                      </div>
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <span className="text-muted">Risk Level:</span>
                        <span className="badge bg-light text-muted border">{task.project_id.risk_level || 'N/A'}</span>
                      </div>
                    </li>
                  </ul>
                  <div className="p-3 border-bottom border-block-end-dashed">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-muted">Start Date:</span>
                      <span className="fw-semibold">
                        {task.project_id.start_date ? new Date(task.project_id.start_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-muted">End Date:</span>
                      <span className="fw-semibold">
                        {task.project_id.end_date ? new Date(task.project_id.end_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="text-muted">Budget:</span>
                      <span className="fw-semibold">
                        {task.project_id.budget ? `${task.project_id.budget.toLocaleString()} TND` : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="d-flex align-items-center justify-content-between mt-3">
                      <span className="fw-semibold">Tasks in Project:</span>
                      <span className="badge bg-primary rounded-pill">
                        {task.project_id.tasks?.length || 0}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-3 text-center">
                  <p className="text-muted">No project associated with this task</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default DeveloperTaskDetail;
