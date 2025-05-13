import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

const CreateWithAI = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    budget: 0,
    client: '',
    start_date: '',
    end_date: '',
    estimated_duration: 0,
    priority: 'Medium',
    risk_level: 'Medium',
    team_member_count: 0,
    total_tasks_count: 0,
    tags: '',
    status: 'Not Started'
  });
  
  // Team Manager search state
  const [searchTerm, setSearchTerm] = useState('');
  const [teamManagers, setTeamManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [message, setMessage] = useState('');
  const [messageColor, setMessageColor] = useState('black');
  
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Initialize date pickers
  useEffect(() => {
    flatpickr("#aiStartDate", {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
    });

    flatpickr("#aiEndDate", {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
    });
  }, []);

  // Search team managers with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchTeamManagers(searchTerm);
      } else {
        setTeamManagers([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Check manager availability when selected
  useEffect(() => {
    if (selectedManager) {
      checkTeamManagerProjects(selectedManager._id);
    } else {
      setMessage(""); 
    }
  }, [selectedManager]);

  const searchTeamManagers = async (term) => {
    try {
      const response = await axios.get(
        `https://lavoro-back.onrender.com/users/getTeamManager?search=${term}`
      );
      setTeamManagers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching team managers:", error);
      setTeamManagers([]);
    }
  };

  const checkTeamManagerProjects = async (managerId) => {
    try {
      const response = await axios.get(
        `https://lavoro-back.onrender.com/project/checkTeamManagerProjects/${managerId}`
      );
      setMessage(response.data.message);
      
      if (response.status === 200) {
        setMessageColor("#28a745");
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setMessage(error.response.data.message);
        setMessageColor("#dc3545");
      } else {
        console.error("Error checking team manager projects:", error);
        setMessage("An error has occurred");
        setMessageColor("#dc3545");
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (!value) {
      setSelectedManager(null);
      setMessage("");
    }
  };

  const handleSelectManager = (manager) => {
    setSelectedManager(manager);
    setSearchTerm(`${manager.firstName} ${manager.lastName}`);
    setTeamManagers([]);
    setMessage("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, dateString) => {
    setFormData(prev => ({ ...prev, [name]: dateString }));
  };

  const generateWithAI = async () => {
    if (!formData.name || !formData.description) {
      Swal.fire('Error', 'Please enter project name and description first', 'error');
      return;
    }

    try {
      setAiLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'https://lavoro-back.onrender.com/project/generateAISuggestions', // Changed to a different endpoint
        {
          name: formData.name,
          description: formData.description,
          client: formData.client,
          manager_id: selectedManager?._id
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Format dates properly for the form
      const startDate = new Date(response.data.start_date);
      const endDate = new Date(response.data.end_date);

      setFormData(prev => ({
        ...prev,
        budget: response.data.budget || 0,
        start_date: startDate.toISOString().slice(0, 16),
        end_date: endDate.toISOString().slice(0, 16),
        estimated_duration: response.data.estimated_duration || 0,
        risk_level: response.data.risk_level || 'Medium',
        priority: response.data.priority || 'Medium',
        team_member_count: response.data.team_member_count || 0,
        total_tasks_count: response.data.total_tasks_count || 0,
        tags: response.data.tags || '',
        status: 'Not Started'
      }));

      Swal.fire('Success', 'AI suggestions applied!', 'success');
    } catch (error) {
      console.error('AI generation error:', error);
      Swal.fire('Error', 'Failed to generate AI suggestions', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.name) {
      Swal.fire('Error', 'Project name is required', 'error');
      return false;
    }
    if (!formData.description) {
      Swal.fire('Error', 'Description is required', 'error');
      return false;
    }
    if (!selectedManager) {
      Swal.fire('Error', 'Team manager is required', 'error');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
  
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const dataToSend = {
        name: formData.name,
        description: formData.description,
        client: formData.client,
        budget: Number(formData.budget),
        start_date: new Date(formData.start_date),
        end_date: new Date(formData.end_date),
        estimated_duration: Number(formData.estimated_duration),
        priority: formData.priority,
        risk_level: formData.risk_level,
        team_member_count: Number(formData.team_member_count),
        total_tasks_count: Number(formData.total_tasks_count),
        tags: formData.tags,
        status: formData.status,
        manager_id: selectedManager._id
      };
  
      await axios.post(
        'https://lavoro-back.onrender.com/project/createProjectWithAI',
        dataToSend,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      Swal.fire('Success', 'Project created successfully!', 'success');
      navigate('/ListPro');
    } catch (error) {
      console.error('Error creating project:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to create project', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid">
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2 mb-4">
      <div>
      <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <a href="#" onClick={(e) => e.preventDefault()}>Projects</a>
              </li>
              <span className="mx-1">→</span>
              <li className="breadcrumb-item active" aria-current="page">Create Project With AI Assistance</li>
            </ol>
      </nav>
          <h1 className="page-title fw-medium fs-18 mb-0">Create Project</h1>
        </div>
        
      </div>
    <div className="row">
      <div className="col-xl-12">
        <div className="card custom-card">
          <div className="card-header">
            <div className="card-title">Create Project with AI Assistant</div>
          </div>
          
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row gy-3">
                <div className="col-xl-4">
                  <label className="form-label">Project Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-xl-4">
                  <label className="form-label">Client</label>
                  <input
                    type="text"
                    className="form-control"
                    name="client"
                    value={formData.client}
                    onChange={handleChange}
                  />
                </div>

                
                <div className="col-xl-4" style={{ position: "relative" }}>
                  <label className="form-label">Team Manager</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search manager..."
                    value={searchTerm}
                    onChange={handleInputChange}
                  />
                  
                  {searchTerm && teamManagers.length > 0 && (
                    <ul
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        backgroundColor: "var(--background-color)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "4px",
                        boxShadow: "0 4px 8px rgba(96, 94, 94, 0.57)",
                        zIndex: 1000,
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        color: "var(--text-color)",
                      }}
                    >
                      {teamManagers.map((manager) => (
                        <li
                          key={manager._id}
                          onClick={() => handleSelectManager(manager)}
                          style={{
                            padding: "10px",
                            cursor: "pointer",
                            borderBottom: "1px solid var(--border-color)",
                            transition: "background-color 0.2s",
                            display: "flex",
                            alignItems: "center",
                          }}
                          onMouseEnter={(e) => (e.target.style.backgroundColor = "var(--hover-background)")}
                          onMouseLeave={(e) => (e.target.style.backgroundColor = "var(--background-color)")}
                        >
                          <img
                            src={`https://lavoro-back.onrender.com${manager.image}` || "https://via.placeholder.com/30"}
                            alt={`${manager.firstName} ${manager.lastName}`}
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              marginRight: "10px",
                            }}
                          />
                          <span>
                            {manager.firstName} {manager.lastName}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  
                  {selectedManager && (
                  <div className="mt-2">
                    <span className="badge bg-light text-dark">
                      <img
                        src={`https://lavoro-back.onrender.com${selectedManager.image}` || "https://via.placeholder.com/20"}
                        alt={selectedManager.firstName}
                        className="rounded-circle me-1"
                        width="20"
                        height="20"
                      />
                      {selectedManager.firstName} {selectedManager.lastName}
                    </span>
                    {message && (
                      <div className="small mt-1" style={{ color: messageColor }}>
                        {message}
                      </div>
                    )}
                  </div>
                )}
                </div>

                <div className="col-xl-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                  />
                </div>

                <div className="col-xl-12 text-center">
                  <button
                    type="button"
                    className="btn btn-info btn-wave"
                    onClick={generateWithAI}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="ri-magic-line me-1"></i> Generate with AI
                      </>
                    )}
                  </button>
                </div>

                {/* AI-generated fields */}
                <div className="col-xl-4">
                  <label className="form-label">Budget ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-xl-4">
                  <label className="form-label">Start Date</label>
                  <input
                    id="aiStartDate"
                    type="text"
                    className="form-control"
                    name="start_date"
                    value={formData.start_date}
                    onChange={(e) => handleDateChange('start_date', e.target.value)}
                  />
                </div>

                <div className="col-xl-4">
                  <label className="form-label">End Date</label>
                  <input
                    id="aiEndDate"
                    type="text"
                    className="form-control"
                    name="end_date"
                    value={formData.end_date}
                    onChange={(e) => handleDateChange('end_date', e.target.value)}
                  />
                </div>

                <div className="col-xl-4">
                  <label className="form-label">Estimated Duration (months)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="estimated_duration"
                    value={formData.estimated_duration}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-xl-4">
                  <label className="form-label">Team Members Count</label>
                  <input
                    type="number"
                    className="form-control"
                    name="team_member_count"
                    value={formData.team_member_count}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-xl-4">
                  <label className="form-label">Task Count</label>
                  <input
                    type="number"
                    className="form-control"
                    name="total_tasks_count"
                    value={formData.total_tasks_count}
                    onChange={handleChange}
                  />
                </div>

                

                <div className="col-xl-6">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-control"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="col-xl-6">
                  <label className="form-label">Risk Level</label>
                  <select
                    className="form-control"
                    name="risk_level"
                    value={formData.risk_level}
                    onChange={handleChange}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div className="col-xl-12">
                  <label className="form-label">Tags</label>
                  <input
                    type="text"
                    className="form-control"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Separate with commas"
                  />
                </div>
              </div>

              <div className="card-footer">
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-light btn-wave"
                    onClick={() => navigate(-1)}
                  >
                    <i className="ri-arrow-left-line me-1"></i> Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-wave"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Project'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default CreateWithAI;