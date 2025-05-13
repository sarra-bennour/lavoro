import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const UpdateTeam = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [],
    members: [],
    color: '#3755e6',
    status: 'Active'
  });
  const [projectInfo, setProjectInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [allMembers, setAllMembers] = useState([]);
  const [tagInput, setTagInput] = useState('');
  // Removed unused validation errors state

  // Predefined colors
  const predefinedColors = [
    { name: 'Red', value: '#ea5455' },
    { name: 'Pink', value: '#e83e8c' },
    { name: 'Purple', value: '#7367f0' },
    { name: 'Primary', value: '#3755e6' },
    { name: 'Info', value: '#00cfe8' },
    { name: 'Success', value: '#28c76f' },
    { name: 'Warning', value: '#ff9f43' },
    { name: 'Orange', value: '#fd7e14' },
    { name: 'Secondary', value: '#6c757d' },
    { name: 'Dark', value: '#4b4b4b' }
  ];

  // Fetch team data and members
  useEffect(() => {
    const fetchTeamAndMembers = async () => {
      try {
        setLoading(true);
        setError('');

        // Get the token for authentication
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }

        // Fetch team data first to get the correct member IDs
        console.log(`Fetching team details for ID: ${id}`);
        const teamResponse = await axios.get(`https://lavoro-back.onrender.com/teams/teamDetails/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        });

        console.log('Team fetch response:', teamResponse.data);

        if (!teamResponse.data.success) {
          throw new Error(teamResponse.data.message || 'Failed to fetch team data');
        }

        const team = teamResponse.data.data;

        // Ensure members are valid MongoDB ObjectIds
        let memberIds = team.members
          .filter(m => m && m._id) // Filter out any null or undefined members
          .map(m => m._id.toString()) // Convert to string
          .filter(id => /^[0-9a-fA-F]{24}$/.test(id)); // Validate MongoDB ObjectId format

        console.log('Initial member IDs from API:', memberIds);

        // Now fetch all developers to populate the dropdown
        console.log('Fetching all developers');
        const membersResponse = await axios.get('https://lavoro-back.onrender.com/users/getAllDevelopers', {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true
        });

        if (!membersResponse.data.data) {
          throw new Error('Failed to fetch developers data');
        }

        // Format and validate member data
        const formattedMembers = membersResponse.data.data
          .filter(dev => dev && dev._id) // Filter out any null or undefined members
          .map(dev => ({
            _id: dev._id.toString(), // Ensure string IDs
            firstName: dev.firstName || '',
            lastName: dev.lastName || '',
            role: dev.role?.RoleName || 'Developer',
            image: dev.image || '',
            email: dev.email || ''
          }))
          .filter(member => /^[0-9a-fA-F]{24}$/.test(member._id)); // Validate MongoDB ObjectId format

        console.log(`Formatted ${formattedMembers.length} developers`);

        // Check if any members from the team are missing in the allMembers list
        // This could happen if a member was removed from the system but still in the team
        const missingMemberIds = memberIds.filter(memberId =>
          !formattedMembers.some(m => m._id === memberId)
        );

        if (missingMemberIds.length > 0) {
          console.log(`Found ${missingMemberIds.length} missing member IDs:`, missingMemberIds);

          // Filter out the missing members from the memberIds array
          // This will remove any members that don't exist in the database
          memberIds = memberIds.filter(id => !missingMemberIds.includes(id));
          console.log('Filtered member IDs (removed missing members):', memberIds);
        }

        // Set all members - only use the valid members from the database
        setAllMembers(formattedMembers);
        setFilteredMembers(formattedMembers);

        // Set form data
        setFormData({
          name: team.name,
          description: team.description || '',
          tags: team.tags || [],
          members: memberIds,
          color: team.color || '#3755e6',
          status: team.status || 'Active'
        });

        // Set project info
        if (team.project_id) {
          setProjectInfo({
            id: team.project_id._id,
            name: team.project_id.name
          });
        }

        console.log('Team data loaded successfully');
      } catch (error) {
        console.error('Error fetching team data:', error);
        setError(error.message || 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamAndMembers();
  }, [id]);

  // Filter members based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredMembers(allMembers);
    } else {
      const filtered = allMembers.filter(member => {
        const fullName = `${member.firstName || ''} ${member.lastName || ''}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      });
      setFilteredMembers(filtered);
    }
  }, [searchTerm, allMembers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleColorChange = (color) => {
    setFormData(prev => ({
      ...prev,
      color: color
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() !== '' && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    try {
      setLoading(true);
      setError('');

      // Get authentication token - we don't need to explicitly get the user ID
      // as the backend will use the authenticated user from the token
      const token = localStorage.getItem('token');

      // Ensure we have a valid token
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      // We'll get the user ID from the token on the server side

      // Ensure members is an array of valid MongoDB ObjectId strings
      const memberIds = formData.members
        .filter(id => id && id.toString().trim() !== '' && /^[0-9a-fA-F]{24}$/.test(id.toString().trim()))
        .map(id => id.toString().trim());

      console.log('Submitting with members:', memberIds);
      console.log('Original members array:', formData.members);

      // Make sure we have at least one member
      if (memberIds.length === 0) {
        setError('Team must have at least one member with valid ID');
        setLoading(false);
        return;
      }

      // Ensure name is not empty
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        setError('Team name cannot be empty');
        setLoading(false);
        return;
      }

      const payload = {
        name: trimmedName,
        description: formData.description?.trim() || '',
        tags: formData.tags || [],
        members: memberIds,
        color: formData.color,
        status: formData.status
        // The server will get the user ID from the token
      };

      console.log('Sending payload:', payload);

      // Check if the team ID is valid
      if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        setError(`Invalid team ID format: ${id}`);
        setLoading(false);
        return;
      }

      // Token validation already done above

      // Make the API request
      try {
        console.log('Making API request to:', `https://lavoro-back.onrender.com/teams/updateTeam/${id}`);

        console.log('Sending update request with payload:', payload);

        const response = await axios.put(
          `https://lavoro-back.onrender.com/teams/updateTeam/${id}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            withCredentials: true
          }
        );

        console.log('Update response received:', response.data);

        if (response.data.success) {
          navigate(`/teams/teamDetails/${id}`, {
            state: { message: 'Team updated successfully!' }
          });
        } else {
          // Handle non-success response
          setError(response.data.message || 'Failed to update team');
        }
      } catch (apiError) {
        console.error('API error:', apiError);

        if (apiError.response) {
          console.error('Error response status:', apiError.response.status);
          console.error('Error response data:', apiError.response.data);

          if (apiError.response.data?.message) {
            setError(apiError.response.data.message);
          } else {
            setError(`Server error: ${apiError.response.status}`);
          }
        } else if (apiError.request) {
          console.error('Error request:', apiError.request);
          setError('No response received from server. Please check your network connection.');
        } else {
          console.error('Error message:', apiError.message);
          setError(`Error: ${apiError.message}`);
        }
      }
    } catch (err) {
      console.error('Update error:', err);
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.name) {
    return (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="alert alert-danger mx-3">
        <i className="ri-error-warning-line me-2"></i>
        {error}
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
              <li className="breadcrumb-item">
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/teams'); }}>
                  Teams
                </a>
              </li>
              <span className="mx-1">→</span>

              <li className="breadcrumb-item active" aria-current="page">
                Edit Team
              </li>
            </ol>
          </nav>
          <h1 className="page-title fw-medium fs-18 mb-0">Edit Team: {formData.name}</h1>
        </div>
      </div>

      {/* Main Form */}
      <div className="row">
        <div className="col-xxl-9 col-xl-8">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">
                Edit Team Details
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="card-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <div className="row gy-4">
                  <div className="col-xl-6">
                    <label htmlFor="team-name" className="form-label">Team Name*</label>
                    <input
                      type="text"
                      className="form-control"
                      id="team-name"
                      name="name"
                      placeholder="Enter Team Name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-xl-6">
                    <label htmlFor="project-id" className="form-label">Project</label>
                    <input
                      type="text"
                      className="form-control"
                      id="project-id"
                      value={projectInfo?.name || 'Loading...'}
                      readOnly
                    />
                  </div>

                  <div className="col-xl-6">
                    <label htmlFor="team-status" className="form-label">Status*</label>
                    <select
                      className="form-control"
                      id="team-status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      required
                    >
                      <option value="Active">Active</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  <div className="col-xl-12 mt-3">
                    <label className="form-label">Team Color</label>
                    <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
                      {predefinedColors.map((color, index) => (
                        <div
                          key={index}
                          className="color-option"
                          title={color.name}
                          onClick={() => handleColorChange(color.value)}
                          style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '50%',
                            backgroundColor: color.value,
                            cursor: 'pointer',
                            border: formData.color === color.value ? '2px solid #000' : '1px solid #dee2e6',
                            transform: formData.color === color.value ? 'scale(1.2)' : 'scale(1)'
                          }}
                        ></div>
                      ))}
                      <div className="ms-auto d-flex align-items-center">
                        <input
                          type="color"
                          className="form-control form-control-color"
                          value={formData.color}
                          onChange={(e) => handleColorChange(e.target.value)}
                          title="Choose custom team color"
                          style={{ width: '40px' }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="col-xl-12">
                    <label htmlFor="team-description" className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      id="team-description"
                      name="description"
                      rows="4"
                      placeholder="Enter team description"
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-xl-6">
                    <label htmlFor="team-tags" className="form-label">Tags</label>
                    <div className="form-control d-flex flex-wrap align-items-center gap-2"
                      style={{ minHeight: '45px', padding: '0.375rem 0.75rem' }}
                    >
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="badge d-flex align-items-center me-1 mb-1"
                          style={{
                            padding: '6px 10px',
                            backgroundColor: formData.color
                          }}
                        >
                          {tag}
                          <i
                            className="ri-close-line ms-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleRemoveTag(tag)}
                          ></i>
                        </span>
                      ))}
                      <input
                        type="text"
                        className="border-0 flex-grow-1"
                        id="team-tags"
                        placeholder={formData.tags.length ? "" : "Type a tag and press Enter"}
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card-footer text-end">
                <button
                  type="button"
                  className="btn btn-outline-secondary me-2"
                  onClick={() => navigate(`/teams/${id}`)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                  ) : (
                    <i className="ri-save-line me-1"></i>
                  )}
                  Save Changes
                </button>
              </div>
              {/* Hidden input to ensure members are included in form submission */}
              <input
                type="hidden"
                name="members"
                value={formData.members.join(',')}
              />
            </form>
          </div>
        </div>

        <div className="col-xxl-3 col-xl-4">
          <div className="card custom-card">
            <div className="card-header">
              <div className="card-title">Team Members</div>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Add Members</label>
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsDropdownOpen(true); // Keep dropdown open when typing
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 300)} // Increased timeout
                  />
                  <div className={`dropdown-menu w-100 ${isDropdownOpen ? 'show' : ''}`}>
                    {filteredMembers
                      // Only show members that aren't already selected
                      .filter(member => !formData.members.some(id => id === member._id || id === member._id.toString()))
                      .map(member => (
                        <a
                          key={member._id}
                          className="dropdown-item d-flex align-items-center"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            const memberId = member._id.toString();
                            // Validate MongoDB ObjectId format
                            if (!/^[0-9a-fA-F]{24}$/.test(memberId)) {
                              console.error('Invalid member ID format:', memberId);
                              return;
                            }

                            console.log('Adding member to team:', member);
                            setFormData(prev => {
                              const updatedMembers = [...prev.members, memberId];
                              console.log('Updated members array:', updatedMembers);
                              return {
                                ...prev,
                                members: updatedMembers
                              };
                            });
                            setSearchTerm('');
                            // Keep dropdown open to allow selecting multiple members
                            // setIsDropdownOpen(false);
                          }}
                        >
                           <img
                        src={
                          member.image
                            ? member.image.startsWith('http') // Check if it's already a full URL
                              ? member.image // Use as-is if full URL
                              : `https://lavoro-back.onrender.com${member.image}` // Prepend server URL if relative
                            : 'https://via.placeholder.com/50' // Fallback if no image
                        }
                        className="avatar avatar-sm me-2"
                        alt={`${member.firstName} ${member.lastName}`}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/50';
                        }}
                      />
                                                {member.firstName} {member.lastName}
                        </a>
                      ))}
                    {filteredMembers.filter(member => !formData.members.some(id => id === member._id || id === member._id.toString())).length === 0 && (
                      <div className="dropdown-item text-muted">No more members available</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="selected-members">
                <label className="form-label">Current Members ({formData.members.length})</label>
                <div className="member-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {formData.members.map(memberId => {
                    // Convert to string for comparison
                    const memberIdStr = memberId.toString();
                    const member = allMembers.find(m => m._id.toString() === memberIdStr);

                    // If member not found, skip it - we've already filtered out non-existent members
                    if (!member) {
                      console.log(`Member with ID ${memberIdStr} not found in allMembers, skipping`);
                      // Remove this member from formData.members
                      setTimeout(() => {
                        setFormData(prev => ({
                          ...prev,
                          members: prev.members.filter(id => id !== memberIdStr)
                        }));
                      }, 0);
                      return null; // Don't render anything for this member
                    }

                    // Normal member display
                    return (
                      <div key={memberIdStr} className="d-flex align-items-center justify-content-between mb-2 p-2 border rounded">
                        <div className="d-flex align-items-center">
                          {member.image ? (
                             <img
                             src={
                               member.image
                                 ? member.image.startsWith('http') // Check if it's already a full URL
                                   ? member.image // Use as-is if full URL
                                   : `https://lavoro-back.onrender.com${member.image}` // Prepend server URL if relative
                                 : 'https://via.placeholder.com/50' // Fallback if no image
                             }
                             className="avatar avatar-sm me-2"
                             alt={`${member.firstName} ${member.lastName}`}
                             onError={(e) => {
                               e.target.src = 'https://via.placeholder.com/50';
                             }}
                           />
                          ) : (
                            <span className="avatar avatar-xs bg-primary text-white rounded-circle me-2">
                              {(member.firstName || '').charAt(0)}
                            </span>
                          )}
                          <div>
                            <div>
                              {member.firstName} {member.lastName}
                            </div>
                            <small className="text-muted">{member.role}</small>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => {
                            const memberId = member._id.toString();
                            console.log('Removing member:', memberId);
                            setFormData(prev => {
                              const updatedMembers = prev.members.filter(id => id !== memberId);
                              console.log('Updated members after removal:', updatedMembers);
                              return {
                                ...prev,
                                members: updatedMembers
                              };
                            });
                          }}
                        >
                          <i className="ri-close-line"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="card custom-card mt-3">
            <div className="card-header">
              <div className="card-title">Project Information</div>
            </div>
            <div className="card-body">
              {projectInfo ? (
                <div className="d-flex align-items-center">
                  <div className="avatar avatar-sm bg-primary text-white rounded me-2">
                    {projectInfo.name.charAt(0)}
                  </div>
                  <div>
                    <h6 className="mb-0">{projectInfo.name}</h6>

                  </div>
                </div>
              ) : (
                <div className="alert alert-warning mb-0">No project information</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateTeam;