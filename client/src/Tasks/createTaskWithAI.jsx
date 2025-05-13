import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Select from 'react-select';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import Swal from 'sweetalert2';

export const AITaskGenerator = ({ projectId: propProjectId }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingTasks, setSavingTasks] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [dateRange, setDateRange] = useState([]);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [editedTask, setEditedTask] = useState(null);

  // Fetch projects if no projectId prop
  useEffect(() => {
    if (!propProjectId) {
      setLoadingProjects(true);
      axios.get('https://lavoro-back.onrender.com/project', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => {
          // Handle different response structures
          const projectsData = res.data;
          console.log('Projects data:', projectsData);

          // Ensure projectsData is an array before mapping
          if (Array.isArray(projectsData)) {
            setProjects(projectsData.map(p => ({
              value: p._id,
              label: p.name,
              ...p
            })));
          } else if (projectsData && projectsData.data && Array.isArray(projectsData.data)) {
            // Alternative structure with data property
            setProjects(projectsData.data.map(p => ({
              value: p._id,
              label: p.name,
              ...p
            })));
          } else {
            console.error('Invalid projects data format:', projectsData);
            setProjects([]);
          }
        })
        .catch(err => {
          console.error("Failed to load projects", err);
          Swal.fire('Error', 'Failed to load projects', 'error');
        })
        .finally(() => setLoadingProjects(false));
    }
  }, [propProjectId]);

  // Fetch project details when propProjectId is provided
  useEffect(() => {
    if (propProjectId) {
      setLoading(true);
      axios.get(`https://lavoro-back.onrender.com/project/getProjectById/${propProjectId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => {
          const projectData = res.data;
          console.log('Project details:', projectData);

          // Set project dates if available
          if (projectData.start_date && projectData.end_date) {
            setDateRange([new Date(projectData.start_date), new Date(projectData.end_date)]);
          }

          // Set project name as default if available
          if (projectData.name && !name) {
            setName(projectData.name);
          }

          // Set project description as default if available
          if (projectData.description && !description) {
            setDescription(projectData.description);
          }
        })
        .catch(err => {
          console.error("Failed to load project details", err);
        })
        .finally(() => setLoading(false));
    }
  }, [propProjectId, name, description]);

  // Function to save generated tasks
  const saveGeneratedTasks = async () => {
    setSavingTasks(true);
    try {
      const targetProjectId = propProjectId || selectedProjectId;

      // Create toast notification function
      const showToast = (icon, title) => {
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });

        Swal.fire({ icon, title });
      };

      // Validate project ID
      if (!targetProjectId) {
        showToast('error', 'Project ID is missing');
        setSavingTasks(false);
        return;
      }

      // Validate tasks
      if (!tasks.length) {
        showToast('warning', 'No tasks to save. Generate tasks first');
        setSavingTasks(false);
        return;
      }

      // Save tasks to database
      const response = await axios.post(
        'https://lavoro-back.onrender.com/tasks/saveTasks',
        {
          projectId: targetProjectId,
          tasks: tasks
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        // Show a simple toast notification
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });

        Swal.fire({
          icon: 'success',
          title: `${tasks.length} tasks saved successfully`
        });

        // Redirect to tasks list after a short delay
        setTimeout(() => {
          navigate('/listTask');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to save tasks');
      }
    } catch (error) {
      console.error('Error saving tasks:', error);
      // Show error toast
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

      Swal.fire({
        icon: 'error',
        title: 'Failed to save tasks'
      });
    } finally {
      setSavingTasks(false);
    }
  };

  // Function to handle task deletion
  const handleDeleteTask = (index) => {
    Swal.fire({
      title: 'Delete Task',
      text: 'Are you sure you want to delete this task?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove the task at the specified index
        setTasks(prevTasks => prevTasks.filter((_, i) => i !== index));

        // Show success toast
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });

        Swal.fire({
          icon: 'success',
          title: 'Task deleted'
        });
      }
    });
  };

  // Function to open edit modal
  const handleEditTask = (task, index) => {
    setCurrentTask({ ...task, index });
    setEditedTask({ ...task });
    setShowEditModal(true);
  };

  // Function to save edited task
  const saveEditedTask = () => {
    if (!currentTask || !editedTask) return;

    // Update the task in the tasks array
    setTasks(prevTasks => {
      const newTasks = [...prevTasks];
      newTasks[currentTask.index] = { ...editedTask };
      return newTasks;
    });

    // Close the modal
    setShowEditModal(false);
    setCurrentTask(null);
    setEditedTask(null);

    // Show success toast
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });

    Swal.fire({
      icon: 'success',
      title: 'Task updated'
    });
  };

  const generateTasks = async () => {
    setLoading(true);
    try {
      const targetProjectId = propProjectId || selectedProjectId;

      // Validate that we have a project ID
      if (!targetProjectId) {
        // Show error toast
        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });

        Swal.fire({
          icon: 'error',
          title: 'Please select a project first'
        });
        setLoading(false);
        return;
      }

      const endpoint = propProjectId
        ? `https://lavoro-back.onrender.com/tasks/generateTasksOnly/${targetProjectId}`
        : 'https://lavoro-back.onrender.com/tasks/generateTasksOnly';

      console.log('Generating tasks with endpoint:', endpoint);
      // Prepare payload with date range if available
      const payload = propProjectId
        ? {
            name,
            description,
            ...(dateRange.length === 2 && {
              start_date: dateRange[0].toISOString(),
              end_date: dateRange[1].toISOString()
            })
          }
        : {
            projectId: targetProjectId,
            name,
            description,
            ...(dateRange.length === 2 && {
              start_date: dateRange[0].toISOString(),
              end_date: dateRange[1].toISOString()
            })
          };

      console.log('Request payload:', payload);

      const res = await axios.post(endpoint, payload,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      // Check if the response has a data property (new API format)
      const tasksData = res.data.data || res.data;
      setTasks(tasksData);

      // Show a simple toast notification instead of a popup
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

      Swal.fire({
        icon: 'success',
        title: `${tasksData.length} tasks generated successfully`
      });
    } catch (err) {
      console.error('Error generating tasks:', err);

      // Log detailed error information for debugging
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', err.response.data);
        console.error(`Server error: ${err.response.status}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error('Error request:', err.request);
        console.error('No response from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request
        console.error('Error message:', err.message);
      }

      // Show error toast
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

      Swal.fire({
        icon: 'error',
        title: 'Failed to generate tasks'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
     <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
                <div>
                    <nav>
                        <ol className="breadcrumb mb-1">
                            <li className="breadcrumb-item">
                                <a href="javascript:void(0);">Tasks</a>
                            </li>
                            <span className="mx-1">→</span>
                            <li className="breadcrumb-item active" aria-current="page">
                                Create Task With AI
                            </li>
                        </ol>
                    </nav>
                    
                    <h1 className="page-title fw-medium fs-18 mb-0">
                    Create Task With AI
                    </h1>
                </div>
            </div>

    <div className="card custom-card">
   
      <div className="card-body">
        <div className="row gy-3">
          {/* Project Selection (Only shown when no project ID is provided) */}
          {!propProjectId && (
            <div className="col-md-12 mb-3">
              <label className="form-label fw-bold">Select Project</label>
              <Select
                options={projects}
                isLoading={loadingProjects}
                onChange={(selected) => {
                  setSelectedProjectId(selected.value);
                  setSelectedProject(selected);

                  // Set date range if project has start and end dates
                  if (selected.start_date && selected.end_date) {
                    setDateRange([new Date(selected.start_date), new Date(selected.end_date)]);
                  } else {
                    setDateRange([]);
                  }
                }}
                placeholder="Search projects..."
                styles={{
                  control: (base) => ({
                    ...base,
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    minHeight: '42px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isSelected ? '#3755e6' : state.isFocused ? '#f0f4ff' : 'white',
                    color: state.isSelected ? 'white' : 'inherit',
                    padding: '10px 15px'
                  }),
                  menu: (base) => ({
                    ...base,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderRadius: '8px'
                  })
                }}
              />
            </div>
          )}

          {/* Project Name and Description (Only shown when a project ID is provided) */}
          {propProjectId && (
            <>
              <div className="col-md-12 mb-3">
                <label className="form-label fw-bold">Project Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="EcoTracker"
                />
                <small className="text-muted">Enter a name for the AI to understand the project context</small>
              </div>

              <div className="col-md-12 mb-3">
                <label className="form-label fw-bold">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A carbon footprint tracking app that helps users monitor and reduce their environmental impact..."
                />
                <small className="text-muted">Provide details about the project to help the AI generate relevant tasks</small>
              </div>
            </>
          )}

          {/* Date Range - shown in both contexts */}
          <div className="col-md-12 mb-3">
            <label className="form-label fw-bold">
              Timeline (Optional)
              {dateRange.length === 2 && (
                <span className="text-success ms-2 small">
                  <i className="ri-check-line"></i> Using project dates
                </span>
              )}
            </label>
            <Flatpickr
              className="form-control"
              value={dateRange}
              options={{
                mode: 'range',
                dateFormat: 'Y-m-d',
                minDate: 'today',
                defaultDate: dateRange.length === 2 ? dateRange : null
              }}
              onChange={(dates) => setDateRange(dates)}
              placeholder={dateRange.length === 2
                ? `${dateRange[0].toLocaleDateString()} to ${dateRange[1].toLocaleDateString()}`
                : "Select date range"}
            />
            <small className="text-muted">
              {dateRange.length === 2
                ? "Using project's start and end dates. You can modify if needed."
                : "Specify a timeline to help the AI schedule tasks appropriately"}
            </small>
          </div>

          {/* Generate Button */}
          <div className="col-md-12 mt-4">
            <button
              className="btn btn-primary w-100 py-2"
              onClick={generateTasks}
              disabled={loading || (!propProjectId && !selectedProjectId) || (propProjectId && (!name || !description))}
              style={{
                fontSize: '16px',
                boxShadow: '0 4px 6px rgba(55, 85, 230, 0.2)',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Generating AI Tasks...
                </>
              ) : (
                <>
                  <i className="ri-ai-generate me-2"></i>
                  {propProjectId
                    ? 'Generate Tasks for This Project'
                    : 'Generate Tasks for Selected Project'}
                </>
              )}
            </button>

            {/* Conditional help text */}
            {!loading && (
              <div className="text-center mt-2">
                <small className="text-muted">
                  {propProjectId
                    ? 'AI will generate tasks based on the project name and description you provided'
                    : 'Select a project first, then AI will generate appropriate tasks'}
                </small>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        {tasks.length > 0 && (
          <div className="mt-5">
            <div className="d-flex align-items-center mb-4">
              <h5 className="mb-0 text-primary">
                <i className="ri-list-check-2 me-2"></i>
                Generated Tasks ({tasks.length})
              </h5>
              <button
                className="btn btn-success ms-auto"
                onClick={saveGeneratedTasks}
                disabled={savingTasks}
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'all 0.2s ease'
                }}
              >
                {savingTasks ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line me-1"></i> Save Tasks
                  </>
                )}
              </button>
            </div>

            <div className="table-responsive" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderRadius: '8px' }}>
            <table className="table table-hover mb-0">
  <thead style={{ backgroundColor: '#f8f9fa' }}>
    <tr>
      <th style={{ borderTopLeftRadius: '8px' }}>Task</th>
      <th>Priority</th>
      <th>Required Skills</th>
      <th>Deadline</th>
      <th>Duration</th>
      <th style={{ borderTopRightRadius: '8px' }}>Actions</th>
    </tr>
  </thead>
  <tbody>
    {tasks.map((task, i) => (
      <tr key={i} style={{ borderLeft: '3px solid transparent', borderLeftColor: task.priority === 'High' ? '#dc3545' : task.priority === 'Medium' ? '#ffc107' : '#28a745' }}>
        <td>
          <div className="d-flex flex-column">
            <strong>{task.title}</strong>
            <p className="text-muted mb-0 small">{task.description}</p>
          </div>
        </td>
        <td>
          <span className={`badge bg-${task.priority === 'High' ? 'danger' : task.priority === 'Medium' ? 'warning' : 'success'}`} style={{ fontWeight: 'normal', padding: '5px 10px' }}>
            {task.priority}
          </span>
        </td>
        <td>
          {task.requiredSkills && task.requiredSkills.map((skill, index) => (
            <span key={index} className="badge bg-info me-1 mb-1">
              {skill}
            </span>
          ))}
        </td>
        <td>{new Date(task.deadline).toLocaleDateString()}</td>
        <td>
          <span className="badge bg-light text-dark">
            {task.estimated_duration} days
          </span>
        </td>
        <td>
          <div className="d-flex">
            <button
              className="btn btn-sm btn-primary me-2"
              onClick={() => handleEditTask(task, i)}
              title="Edit Task"
            >
              <i className="ri-edit-line"></i>
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={() => handleDeleteTask(i)}
              title="Delete Task"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          </div>
        </td>
      </tr>
    ))}
  </tbody>
</table>
            </div>

            <div className="text-center mt-3">
              <small className="text-muted">
                These tasks were generated by AI but have not been saved yet. Click "Save Tasks" to save them to your project.
              </small>
            </div>
          </div>
        )}
      </div>

      {/* Edit Task Modal */}
      {showEditModal && editedTask && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg" style={{ marginLeft: '300px' }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Task</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentTask(null);
                    setEditedTask(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editedTask.title || ''}
                      onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editedTask.description || ''}
                      onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                    ></textarea>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      value={editedTask.priority || 'Medium'}
                      onChange={(e) => setEditedTask({...editedTask, priority: e.target.value})}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Estimated Duration (days)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editedTask.estimated_duration || 1}
                      min="1"
                      onChange={(e) => setEditedTask({...editedTask, estimated_duration: parseInt(e.target.value) || 1})}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Deadline</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editedTask.deadline ? new Date(editedTask.deadline).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditedTask({...editedTask, deadline: e.target.value})}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editedTask.start_date ? new Date(editedTask.start_date).toISOString().split('T')[0] : ''}
                      onChange={(e) => setEditedTask({...editedTask, start_date: e.target.value})}
                    />
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label">Required Skills (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={(editedTask.requiredSkills || []).join(', ')}
                      onChange={(e) => {
                        const skillsArray = e.target.value
                          .split(',')
                          .map(skill => skill.trim())
                          .filter(skill => skill !== '');
                        setEditedTask({...editedTask, requiredSkills: skillsArray});
                      }}
                      placeholder="JavaScript, React, Node.js"
                    />
                    <small className="text-muted">Enter skills separated by commas</small>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-12">
                    <label className="form-label">Tags (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={(editedTask.tags || []).join(', ')}
                      onChange={(e) => {
                        const tagsArray = e.target.value
                          .split(',')
                          .map(tag => tag.trim())
                          .filter(tag => tag !== '');
                        setEditedTask({...editedTask, tags: tagsArray});
                      }}
                      placeholder="frontend, backend, feature"
                    />
                    <small className="text-muted">Enter tags separated by commas</small>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditModal(false);
                    setCurrentTask(null);
                    setEditedTask(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveEditedTask}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};