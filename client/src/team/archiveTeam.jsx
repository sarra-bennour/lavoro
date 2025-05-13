import "../../public/assets/libs/sweetalert2/sweetalert2.min.css";
import Swal from "sweetalert2";
import "../../public/assets/js/wishlist.js";
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

export default function TeamArchive() {
  const [archivedTeams, setArchivedTeams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [sortCriteria, setSortCriteria] = useState('name');
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleViewClick = (teamId) => {
    navigate(`/teams/archived/${teamId}`);
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch('https://lavoro-back.onrender.com/teams/export-archived', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
      if (!response.ok) throw new Error('Failed to download Excel file');
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'archived-teams.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      Swal.fire("Error!", "Could not download the Excel file.", "error");
    }
  };

  useEffect(() => {
    const fetchArchivedTeams = async () => {
      try {
        const response = await fetch('https://lavoro-back.onrender.com/teams/archived', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setArchivedTeams(data);
        } else {
          console.error('Failed to fetch archived teams:', data.message);
          setArchivedTeams([]);
        }
      } catch (error) {
        console.error('Error fetching archived teams:', error);
        setArchivedTeams([]);
      }
    };

    fetchArchivedTeams();
  }, []);

  const handleUnarchive = async (teamId) => {
    try {
      const response = await fetch(`https://lavoro-back.onrender.com/teams/${teamId}/unarchive`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setArchivedTeams(prevTeams => prevTeams.filter(team => team._id !== teamId));
        Swal.fire({
          title: 'Unarchived!',
          text: 'The team has been unarchived successfully.',
          icon: 'success',
        });
      } else {
        Swal.fire({
          title: 'Error!',
          text: data.message || 'Failed to unarchive the team.',
          icon: 'error',
        });
      }
    } catch (error) {
      console.error('Error unarchiving team:', error);
      Swal.fire({
        title: 'Error!',
        text: 'An error occurred while unarchiving the team.',
        icon: 'error',
      });
    }
  };

  const handleDelete = async (teamId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`https://lavoro-back.onrender.com/teams/archived/${teamId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          setArchivedTeams(prevTeams => prevTeams.filter(team => team._id !== teamId));
          Swal.fire("Deleted!", "The team has been deleted from your archive.", "success");
        } else {
          const errorData = await response.json();
          Swal.fire("Error!", errorData.message || "Failed to delete the team.", "error");
        }
      } catch (error) {
        console.error('Error deleting team:', error);
        Swal.fire("Error!", "An error occurred while deleting the team.", "error");
      }
    }
  };

  const filteredTeams = archivedTeams.filter(team =>
    team.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedTeams = filteredTeams.sort((a, b) => {
    if (sortCriteria === 'name') {
      return a.name?.localeCompare(b.name);
    } else if (sortCriteria === 'members') {
      return (a.members?.length || 0) - (b.members?.length || 0);
    } else if (sortCriteria === 'new') {
      return new Date(b.updated_at) - new Date(a.updated_at);
    }
    return 0;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTeams = sortedTeams.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedTeams.length / itemsPerPage);

  const handleSortChange = (criteria) => {
    setSortCriteria(criteria);
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
        <div>
          <nav>
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Teams
                </a>
              </li>
              <span className="mx-1">→</span>
              <li className="breadcrumb-item active" aria-current="page">
                Team Archive
              </li>
            </ol>
          </nav>
          <br />
          <h1 className="page-title fw-medium fs-18 mb-0">Team Archive</h1>
        </div>
        <div className="btn-list">
          <button className="btn btn-white btn-wave" onClick={handleExportExcel}>
            <i className="ri-file-excel-2-line align-middle me-1 lh-1" /> Excel
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Our Archive</div>
              <div className="d-flex flex-wrap gap-2">
                <div>
                  <input
                    className="form-control form-control-sm"
                    type="text"
                    placeholder="Search Teams"
                    aria-label="Search"
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                </div>
                <div className="dropdown">
                  <a
                    href="javascript:void(0);"
                    className="btn btn-primary btn-sm btn-wave waves-effect waves-light"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    Sort By
                    <i className="ri-arrow-down-s-line align-middle ms-1" />
                  </a>
                  <ul className="dropdown-menu" role="menu">
                    <li>
                      <a className="dropdown-item" href="javascript:void(0);" onClick={() => handleSortChange('new')}>
                        Newest
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="javascript:void(0);" onClick={() => handleSortChange('name')}>
                        Name
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="javascript:void(0);" onClick={() => handleSortChange('members')}>
                        Members
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body card-body m-3 bg-light p-2 rounded mt-2">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 ps-2">
                <p className="mb-0 fs-15">
                  <span className="text-primary1 fw-semibold">{filteredTeams.length} teams</span> in our archive
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {currentTeams.length > 0 ? (
          currentTeams.map(team => (
            <div className="col-lg-6" key={team._id}>
              <div className="card custom-card card-style-3">
                <div className="card-body p-3">
                  <div className="row">
                    <div className="col-md-2">
                      <span 
                        className="avatar avatar-lg me-1"
                        style={{
                          backgroundColor: team.color || '#3755e6',
                          color: '#ffffff',
                          display: 'flex',
                          width: '70px',
                          height: '70px',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'regular',
                          fontSize: '18px',
                        }}
                      >
                        {getInitials(team.name)}
                      </span>
                    </div>
                    <div className="col-md-10">
                      <div className="d-flex align-items-start justify-content-between mb-2">
                        <div className="flex-grow-1">
                          <h6 className="fs-14 mb-1 fw-medium">
                            <a>{team.name}</a>
                          </h6>
                          <div className={`min-w-fit-content fw-normal mb-1 fs-13 fw-medium ${
                            team.originalStatus === 'Active' ? 'text-success' : 'text-secondary'
                          }`}>
                            {team.originalStatus || 'Archived'}
                          </div>
                          <div className="d-flex align-items-baseline gap-2 mb-1">
                            <span className="badge bg-primary1-transparent ms-2">
                              {team.members?.length || 0} Members
                            </span>
                          </div>
                        </div>
                        <a className="btn-delete btn btn-primary2-light btn-icon" onClick={() => handleDelete(team._id)}>
                          <i className="ri-delete-bin-line" />
                        </a>
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <a className="btn btn-primary btn-w-md" onClick={() => handleViewClick(team._id)}>
                          <i className="ri-eye-line me-1" /> View
                        </a>
                        <a
                          className="btn btn-primary-light btn-w-md"
                          onClick={() => handleUnarchive(team._id)}
                        >
                          <i className="ri-inbox-unarchive-line me-1" /> Unarchive
                        </a>
                        <div className="d-flex align-items-baseline fs-13 ms-auto">
                          <p className="mb-0 ms-1 min-w-fit-content text-muted">
                            <span>{new Date(team.updated_at).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="alert alert-info" role="alert">
              No archived teams found.
            </div>
          </div>
        )}
      </div>

      <div className="col-xl-12">
        <div className="d-flex align-items-center flex-wrap overflow-auto p-3 bg-white mb-3">
          <div className="mb-2 mb-sm-0">
            Showing <b>{indexOfFirstItem + 1}</b> to <b>{Math.min(indexOfLastItem, filteredTeams.length)}</b> of <b>{filteredTeams.length}</b> entries
          </div>
          <div className="ms-auto">
            <ul className="pagination mb-0 overflow-auto">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <a className="page-link" href="javascript:void(0);" onClick={() => handlePageChange(currentPage - 1)}>
                  Previous
                </a>
              </li>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                  <a className="page-link" href="javascript:void(0);" onClick={() => handlePageChange(number)}>
                    {number}
                  </a>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <a className="page-link" href="javascript:void(0);" onClick={() => handlePageChange(currentPage + 1)}>
                  Next
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}