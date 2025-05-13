import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import Choices from 'choices.js';
import 'choices.js/public/assets/styles/choices.min.css';
import 'quill/dist/quill.snow.css';

import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import 'filepond/dist/filepond.min.css';


const CreateProject = () => {
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    budget: '',
    client: '',
    start_date: '',
    end_date: '',
    status: 'Not Started',
    risk_level: 'Medium',
    tags: ''
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [teamManagers, setTeamManagers] = useState([]);
  const [selectedManager, setSelectedManager] = useState(null);
  const [message, setMessage] = useState("");
  const [messageColor, setMessageColor] = useState("black");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const tagsRef = useRef(null);

  // Add this near your other state declarations
const [currentUser, setCurrentUser] = useState(null);

// Add this useEffect to fetch the current user when the component mounts
useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("No token found");
      }

      const response = await axios.get("https://lavoro-back.onrender.com/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.data) {
        setCurrentUser(response.data);
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  fetchCurrentUser();
}, []);

// Modify your handleSubmit function to include both sender and receiver users
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    Swal.fire('Validation Error', 'Please fix all errors before submitting', 'error');
    return;
  }

  try {
    setLoading(true);
    
    const dataToSend = {
      ...projectData,
      budget: Number(projectData.budget),
      start_date: new Date(projectData.start_date).toISOString(),
      end_date: new Date(projectData.end_date).toISOString(),
      ...(selectedManager && { 
        manager_id: selectedManager._id,
        teamManager: `${selectedManager.firstName} ${selectedManager.lastName}`
      }),
      // Include the current user as the sender in the project data
      senderUser: currentUser?._id
    };

    const token = localStorage.getItem('token');
    const response = await axios.post(
      'https://lavoro-back.onrender.com/project/createProject',
      dataToSend,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // If there's a team manager assigned, send them an email
    if (selectedManager && currentUser) {
      try {
        await axios.post(
          'https://lavoro-back.onrender.com/project/sendProjectAssignmentEmail',
          {
            email: selectedManager.email,
            projectDetails: response.data,
            senderUserId: currentUser._id,
            receiverUserId: selectedManager._id  // Add the team manager as receiver
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } catch (emailError) {
        console.error('Error sending project assignment email:', emailError);
        // Optionally show a warning that email failed but project was created
        Swal.fire({
          title: 'Project Created',
          text: 'Project was created but email notification failed',
          icon: 'warning',
          timer: 2000,
          timerProgressBar: true
        });
      }
    }

    await Swal.fire({
      title: 'Success!',
      text: 'Project created successfully',
      icon: 'success',
      confirmButtonText: 'OK',
      timer: 2000,
      timerProgressBar: true
    });
    
    navigate('/ListPro');
    
  } catch (error) {
    const errorMessage = error.response?.data?.message || 'Error creating project';
    Swal.fire('Error', errorMessage, 'error');
  } finally {
    setLoading(false);
  }
};



  // Initialize date pickers and choices
  useEffect(() => {
    // Date pickers
    const startPicker = flatpickr(startDateRef.current, {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      minDate: "today",
      onChange: (selectedDates) => {
        const dateStr = selectedDates[0]?.toISOString();
        setProjectData(prev => ({ ...prev, start_date: dateStr }));
        validateDates(dateStr, projectData.end_date);
        
        if (dateStr && endDateRef.current?._flatpickr) {
          const minEndDate = new Date(dateStr);
          minEndDate.setDate(minEndDate.getDate() + 14); // 2 semaines minimum
          endDateRef.current._flatpickr.set('minDate', minEndDate);
        }
      }
    });

    const endPicker = flatpickr(endDateRef.current, {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
      onChange: (selectedDates) => {
        const dateStr = selectedDates[0]?.toISOString();
        setProjectData(prev => ({ ...prev, end_date: dateStr }));
        validateDates(projectData.start_date, dateStr);
      }
    });

    // Tags input with Choices
    if (tagsRef.current) {
      new Choices(tagsRef.current, {
        delimiter: ',',
        editItems: true,
        removeItemButton: true,
        addItems: true
      });
    }

    // Store picker references
    startDateRef.current._flatpickr = startPicker;
    endDateRef.current._flatpickr = endPicker;

    return () => {
      startPicker.destroy();
      endPicker.destroy();
      if (tagsRef.current?.choices) {
        tagsRef.current.choices.destroy();
      }
    };
  }, []);

  // Team manager search
  const searchTeamManagers = async (term) => {
    try {
      const response = await axios.get(`https://lavoro-back.onrender.com/users/getTeamManager?search=${term}`);
      console.log("API Response:", response.data); // Log pour déboguer
      setTeamManagers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching team managers:", error);
      setTeamManagers([]);
    }
  };

  // Check team manager availability
  const checkTeamManagerProjects = async (managerId) => {
    try {
      const response = await axios.get(`https://lavoro-back.onrender.com/project/checkTeamManagerProjects/${managerId}`);
      setMessage(response.data.message);
      console.log("API Response:", response.data); // Log pour déboguer

      // Définir la couleur du message en fonction de la disponibilité du Team Manager
      if (response.status===200) {
        setMessageColor("#28a745"); // Message en vert si disponible
      } 
      
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // On affiche uniquement le message d'erreur 400
        setMessage(error.response.data.message);
        setMessageColor("#dc3545"); // Rouge pour les erreurs
      } else {
        console.error("Error checking team manager projects:", error);
        // On n'affiche PAS de message pour les autres erreurs
        setMessage("An error has occurred"); // Ou null si vous préférez
      }
    }
  };

  // Handle team manager selection
  const handleSelectManager = (manager) => {
    setSelectedManager(manager);
    setSearchTerm(`${manager.firstName} ${manager.lastName}`);
    setTeamManagers([]);
    checkTeamManagerProjects(manager._id);
  };

  // Date validation with 2 weeks minimum
  const validateDates = (start, end) => {
    const newErrors = { ...errors };
    
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      const minEndDate = new Date(startDate);
      minEndDate.setDate(minEndDate.getDate() + 14); // Ajoute 2 semaines

      if (endDate < minEndDate) {
        newErrors.end_date = 'La date de fin doit être au moins 2 semaines après la date de début';
      } else {
        delete newErrors.end_date;
      }
    }
    
    setErrors(newErrors);
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!projectData.name.trim()) newErrors.name = 'Project name is required';
    if (!projectData.client.trim()) newErrors.client = 'Client is required';
    if (!projectData.description.trim()) newErrors.description = 'Description is required';
    if (!projectData.start_date) newErrors.start_date = 'Start date is required';
    if (!projectData.end_date) newErrors.end_date = 'End date is required';
    if (!projectData.budget) newErrors.budget = 'Budget is required';
    
    // Validation des 2 semaines
    if (projectData.start_date && projectData.end_date) {
      const startDate = new Date(projectData.start_date);
      const endDate = new Date(projectData.end_date);
      const minEndDate = new Date(startDate);
      minEndDate.setDate(minEndDate.getDate() + 14);

      if (endDate < minEndDate) {
        newErrors.end_date = 'La date de fin doit être au moins 2 semaines après la date de début';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
              <li className="breadcrumb-item active" aria-current="page">Create Project</li>
            </ol>
          </nav>
          
          <h1 className="page-title fw-medium fs-18 mb-0">Create Project</h1>
        </div>
        
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header bg-transparent border-bottom">
              <div className="card-title">Project Details</div>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="row gy-4">
                  {/* Project Name */}
                  <div className="col-xl-6">
                    <label className="form-label">Project Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      name="name"
                      value={projectData.name}
                      onChange={(e) => {
                        setProjectData({...projectData, name: e.target.value});
                        if (errors.name) setErrors({...errors, name: ''});
                      }}
                      placeholder="Enter project name"
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                  </div>

                  {/* Team Manager */}
                  <div className="col-xl-6" style={{ position: "relative" }}>
                    <label className="form-label">Team Manager</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search team manager"
                      value={searchTerm}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSearchTerm(value);
                        setSelectedManager(null);
                        setMessage("");
                        if (value) searchTeamManagers(value);
                        else setTeamManagers([]);
                      }}
                    />
                    
                    {searchTerm && teamManagers.length > 0 && (
                      <ul className="dropdown-menu show w-100" style={{ zIndex: 1000 }}>
                        {teamManagers.map((manager) => (
                          <li key={manager._id}>
                            <button
                              type="button"
                              className="dropdown-item d-flex align-items-center"
                              onClick={() => handleSelectManager(manager)}
                            >
                              <img
                                src={`https://lavoro-back.onrender.com${manager.image}` || "https://via.placeholder.com/30"}
                                alt={manager.firstName}
                                className="rounded-circle me-2"
                                width="30"
                                height="30"
                              />
                              <span>{manager.firstName} {manager.lastName}</span>
                            </button>
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
                      </div>
                    )}
                    
                    {message && (
                      <div className="mt-2 small" style={{ color: messageColor }}>
                        {message}
                      </div>
                    )}
                  </div>

                  {/* Client */}
                  <div className="col-xl-6">
                    <label className="form-label">Client <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className={`form-control ${errors.client ? 'is-invalid' : ''}`}
                      name="client"
                      value={projectData.client}
                      onChange={(e) => {
                        setProjectData({...projectData, client: e.target.value});
                        if (errors.client) setErrors({...errors, client: ''});
                      }}
                      placeholder="Enter client name"
                    />
                    {errors.client && <div className="invalid-feedback">{errors.client}</div>}
                  </div>

                  {/* Budget */}
                  <div className="col-xl-6">
                    <label className="form-label">Budget <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input
                        type="number"
                        className={`form-control ${errors.budget ? 'is-invalid' : ''}`}
                        name="budget"
                        value={projectData.budget}
                        onChange={(e) => {
                          setProjectData({...projectData, budget: e.target.value});
                          if (errors.budget) setErrors({...errors, budget: ''});
                        }}
                        min="0"
                        step="0.01"
                        placeholder="Enter budget"
                      />
                      {errors.budget && <div className="invalid-feedback">{errors.budget}</div>}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-12">
                    <label className="form-label">Description <span className="text-danger">*</span></label>
                    <textarea
                      className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                      name="description"
                      value={projectData.description}
                      onChange={(e) => {
                        setProjectData({...projectData, description: e.target.value});
                        if (errors.description) setErrors({...errors, description: ''});
                      }}
                      rows="4"
                      placeholder="Enter project description"
                    />
                    {errors.description && <div className="invalid-feedback">{errors.description}</div>}
                  </div>

                  {/* Dates */}
                  <div className="col-xl-6">
                    <label className="form-label">Start Date <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="ri-calendar-line"></i></span>
                      <input
                        type="text"
                        className={`form-control ${errors.start_date ? 'is-invalid' : ''}`}
                        ref={startDateRef}
                        data-input
                        placeholder="Select start date"
                      />
                      {errors.start_date && <div className="invalid-feedback">{errors.start_date}</div>}
                    </div>
                  </div>

                  <div className="col-xl-6">
                    <label className="form-label">End Date <span className="text-danger">*</span></label>
                    <div className="input-group">
                      <span className="input-group-text"><i className="ri-calendar-line"></i></span>
                      <input
                        type="text"
                        className={`form-control ${errors.end_date ? 'is-invalid' : ''}`}
                        ref={endDateRef}
                        data-input
                        placeholder="Select end date"
                      />
                      {errors.end_date && <div className="invalid-feedback">{errors.end_date}</div>}
                    </div>
                  </div>

                  {/* 
                   <div className="col-xl-6">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      value={projectData.status}
                      onChange={(e) => setProjectData({...projectData, status: e.target.value})}
                    >
                      <option value="Completed">Completed</option> 
                    </select>
                  </div> */}

<div className="col-xl-6">
  <label className="form-label">Status</label>
  
  {/* Visible read-only display */}
  <input
    type="text"
    className="form-control"
    value={projectData.status || "Not Started"}
    readOnly
  />
  
  {/* Hidden field to maintain the value in form data */}
  <input
    type="hidden"
    name="status"
    value={projectData.status || "Not Started"}
  />
</div>

                  <div className="col-xl-6">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-select"
                      name="risk_level"
                      value={projectData.risk_level}
                      onChange={(e) => setProjectData({...projectData, risk_level: e.target.value})}
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="col-12">
                    <label className="form-label">Tags</label>
                    <input
                      type="text"
                      className="form-control"
                      name="tags"
                      value={projectData.tags}
                      onChange={(e) => setProjectData({...projectData, tags: e.target.value})}
                      placeholder="Enter tags separated by commas"
                      ref={tagsRef}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="col-12 mt-4">
                  <button 
                  type="button"  // Add this line
                  className="btn btn-info btn-wave"
                  onClick={() => navigate('/createProWithAi')}
                >
                  <i className="ri-magic-line me-1"></i> AI Assistant
                </button>
                    <button
                      type="submit"
                      className="btn btn-primary btn-wave float-end"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Creating...
                        </>
                      ) : 'Create Project'}
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

export default CreateProject;