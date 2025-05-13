import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import Mailer from './Mailer'

function UsersList({ onRoleUpdate, onViewActivity }) {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMailComposer, setShowMailComposer] = useState(false);
  const adminEmail = 'lavoroprojectmanagement@gmail.com';

const fetchUsersAndRoles = async () => {
  try {
    const response = await axios.get('https://lavoro-back.onrender.com/admin/dashboard', {
      withCredentials: true,
    });
    setUsers(response.data.users);
    setFilteredUsers(response.data.users); 
    setRoles(response.data.roles);
    setError(null);
  } catch (err) {
    setError('Failed to fetch data. Please try again.');
    console.error('Fetch error:', err);
  }
};

// Use it in useEffect
useEffect(() => {
  fetchUsersAndRoles();
}, []);

  // Apply filters whenever searchQuery or selectedRole changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedRole, users]);
  const handleRoleUpdate = async (userId, newRoleId) => {
    try {
      const { data } = await axios.put(
        `https://lavoro-back.onrender.com/admin/update-role/${userId}`,
        { role: newRoleId },
        { withCredentials: true }
      );
  
      if (data.success) {
        Swal.fire({
          title: 'Success!',
          text: data.message,
          icon: 'success',
          timer: 2000
        });
        fetchUsersAndRoles();
      }
    } catch (error) {
      const response = error.response?.data;
      
      if (response?.error === 'Active Projects Exist') {
        const projectsList = response.projects
          .map(p => `<li>${p.name} (${p.status})</li>`)
          .join('');
  
        await Swal.fire({
          title: 'Cannot Change Role',
          html: `
            <div class="text-start">
              <p>${response.message}</p>
              <ul class="mt-2">${projectsList}</ul>
              <small class="text-muted">Please reassign these projects first</small>
            </div>
          `,
          icon: 'error',
          confirmButtonText: 'Understood'
        });
      } 
      else if (response?.error === 'Hierarchy Violation') {
        await Swal.fire({
          title: 'Invalid Role Change',
          html: `
            <p>Cannot change from <strong>${response.currentRole}</strong>
            to <strong>${response.newRole}</strong></p>
            <p class="text-danger mt-2">This violates role hierarchy rules</p>
          `,
          icon: 'error'
        });
      }
      else {
        await Swal.fire('Error', response?.message || 'Update failed', 'error');
      }
      
      // Refresh data to ensure UI consistency
      fetchUsersAndRoles();
    }
  };
 

  // Handle sending email to a user
  const handleSendEmail = (email) => {
    window.location.href = `mailto:${email}`;
  };

  // Handle role filter change
  const handleRoleFilterChange = (roleId) => {
    setSelectedRole(roleId);
  };

  // Handle creation date filter change
  const handleCreationDateFilterChange = (filterType) => {
    let sortedUsers = [...filteredUsers]; // Sort the currently filtered users, not all users
  
    switch (filterType) {
      case 'newest':
        sortedUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        sortedUsers.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      default:
        // No sorting needed
        break;
    }
  
    setFilteredUsers(sortedUsers); // Update the filtered users with the sorted array
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Apply all active filters
  const applyFilters = (usersToFilter = users) => {
    let filtered = [...usersToFilter];

    // Apply role filter first
    if (selectedRole) {
      filtered = filtered.filter(user => user.role?._id === selectedRole);
    }

    // Then apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        user =>
          user.firstName?.toLowerCase().includes(query) ||
          user.lastName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  return (
    
    <div className="card custom-card">
      <div className="card-header justify-content-between">
        <div className="card-title">Users List</div>
        <div className="d-flex flex-wrap">
          {/* Search Bar */}
          <div className="me-3 my-1">
            <input
              className="form-control form-control-sm"
              type="text"
              placeholder="Search by name, email, or phone"
              aria-label="search"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          {/* Sort By Creation Date */}
          {/* Sort By Creation Date */}
          <div className="dropdown my-1">
            <button
              className="btn btn-sm btn-primary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Sort By
            </button>
            <ul className="dropdown-menu">
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => handleCreationDateFilterChange('newest')}
                >
                  Newest First
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => handleCreationDateFilterChange('oldest')}
                >
                  Oldest First
                </button>
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => applyFilters()} // Reset sorting
                >
                  Reset Sorting
                </button>
              </li>
            </ul>
          </div>
          {/* Filter By Role */}
          <div className="dropdown my-1">
            <button
              className="btn btn-sm btn-primary dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              Filter By Role
            </button>
            <ul className="dropdown-menu">
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => handleRoleFilterChange('')}
                >
                  All Roles
                </button>
              </li>
              {roles.map(role => (
                <li key={role._id}>
                  <button
                    className="dropdown-item"
                    onClick={() => handleRoleFilterChange(role._id)}
                  >
                    {role.RoleName}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <div className="card-body">
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="table-responsive">
          <table className="table table-hover text-nowrap table-bordered">
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Phone Number</th>
                <th scope="col">Role</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <tr key={user._id}>
                    <td>
                      <div className="d-flex align-items-center">
                      <img
  src={
    user.image
      ? user.image.startsWith('http') // Check if it's already a full URL
        ? user.image // Use as-is if full URL
        : `https://lavoro-back.onrender.com${user.image}` // Prepend server URL if relative
      : 'https://via.placeholder.com/50' // Fallback if no image
  }
  className="avatar avatar-sm me-2"
  alt={`${user.firstName} ${user.lastName}`}
  onError={(e) => {
    e.target.src = 'https://via.placeholder.com/50';
  }}
/>
                        <span>
                          {user.firstName} {user.lastName}
                        </span>
                      </div>
                    </td>
                    <td>
                      <a href={`mailto:${user.email}`}>{user.email}</a>
                    </td>
                    <td>{user.phone_number || 'N/A'}</td>
                    <td>
                    <select
                      value={user.role._id}
                      onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                      className="form-select form-select-sm"
                    >
                      {roles.map((role) => (
                        <option 
                          key={role._id} 
                          value={role._id}
                          disabled={role.hierarchyLevel < user.role.hierarchyLevel}
                        >
                          {role.RoleName}
                        </option>
                      ))}
                    </select>
                    </td>
                    <td>
                      <div className="btn-list">
                        <button
                          type="button"
                          className="btn btn-icon btn-sm btn-primary-light"
                          onClick={() => onViewActivity(user._id)}
                          title="View Activity"
                        >
                          <i className="ri-eye-line"></i>
                        </button>
                        <button
                          type="button"
                          className="btn btn-icon btn-sm btn-success-light ms-2"
                          onClick={() => handleSendEmail(user.email)}
                          title="Send Email"
                        >
                          <i className="ri-mail-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No users found matching your criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card-footer">
        <div className="d-flex align-items-center justify-content-between">

          <div>
            Showing {filteredUsers.length} Entries
          </div>
          <button 
        className="btn btn-primary"
        onClick={() => setShowMailComposer(true)}
      >
        <i className="bi bi-envelope me-2"></i> Compose Mail
      </button>

      
        </div>
        
      </div>
      <Mailer
        show={showMailComposer}
        handleClose={() => setShowMailComposer(false)}
        adminEmail={adminEmail}
      />
    </div>
    
  );
}

export default UsersList;