import "../../public/assets/libs/sweetalert2/sweetalert2.min.css";
import Swal from "sweetalert2";
import "../../public/assets/js/wishlist.js";
import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';




export default function Archieve() {

  const [archivedProjects, setArchivedProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // Track the current page
  const [itemsPerPage] = useState(4); // Number of items per page
  const [sortCriteria, setSortCriteria] = useState('name'); // Default sorting by name
  const navigate = useNavigate();

  const getInitials = (name) => {
    const names = name.split(' ');
    let initials = names[0].substring(0, 1).toUpperCase();
    if (names.length > 1) {
      initials += names[names.length - 1].substring(0, 1).toUpperCase();
    }
    return initials;
  };
  

  const handleSearch = (query) => {
    setSearchQuery(query); // Update the search query state
    setCurrentPage(1); // Reset to the first page when searching
  };

  const handleViewClick = (projectId) => {
    navigate(`/overviewArchive/${projectId}`); // Navigate to the project overview
  };



  const handleExportExcel = async () => {
    try {
      const response = await fetch('https://lavoro-back.onrender.com/project/export-archived', {
        method: 'GET',
      });
  
      if (!response.ok) throw new Error('Failed to download Excel file');
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'archived-projects.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Download error:', error);
      Swal.fire("Error!", "Could not download the Excel file.", "error");
    }
  };
  


  
  useEffect(() => {
    const fetchArchivedProjects = async () => {
      try {
        const response = await fetch('https://lavoro-back.onrender.com/project/archived-projects');
        const data = await response.json();
        console.log('API Response:', data); // Debugging: Log the API response
        if (response.ok) {
          setArchivedProjects(data);
        } else {
          console.error('Failed to fetch archived projects:', data.message);
          setArchivedProjects([]);
        }
      } catch (error) {
        console.error('Error fetching archived projects:', error);
        setArchivedProjects([]);
      }
    };

    fetchArchivedProjects();
  }, []);

  const handleUnarchive = async (projectId) => {
    try {
      const response = await fetch(`https://lavoro-back.onrender.com/project/${projectId}/unarchive`, {
        method: 'POST',
      });
      const data = await response.json();

      if (response.ok) {
        // Remove the unarchived project from the state
        setArchivedProjects((prevProjects) =>
          prevProjects.filter((project) => project._id !== projectId)
        );

        Swal.fire({
          title: 'Unarchived!',
          text: 'The project has been unarchived successfully.',
          icon: 'success',
        });
      } else {
        Swal.fire({
          title: 'Error!',
          text: data.message || 'Failed to unarchive the project.',
          icon: 'error',
        });
      }
    } catch (error) {
      console.error('Error unarchiving project:', error);
      Swal.fire({
        title: 'Error!',
        text: 'An error occurred while unarchiving the project.',
        icon: 'error',
      });
    }
  };

  const filteredProjects = archivedProjects.filter((project) =>
    project.name.toLowerCase().startsWith(searchQuery.toLowerCase())
  );

  // Sort the filtered projects
  const sortedProjects = filteredProjects.sort((a, b) => {
    if (sortCriteria === 'name') {
      return a.name.localeCompare(b.name); // Sort by name (A-Z)
    } else if (sortCriteria === 'budget') {
      return a.budget - b.budget; // Sort by budget (low to high)
    } else if (sortCriteria === 'new') {
      return new Date(b.updated_at) - new Date(a.updated_at); // Sort by newest first
    }
    return 0; // Default: no sorting
  });

  // Calculate the indices for the current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = sortedProjects.slice(indexOfFirstItem, indexOfLastItem);

  // Function to handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Calculate the total number of pages
  const totalPages = Math.ceil(sortedProjects.length / itemsPerPage);

  // Generate page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const handleDelete = async (projectId) => {
    // Use SweetAlert2 for confirmation
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
        // Call the backend API to delete the archived project
        const response = await fetch(`https://lavoro-back.onrender.com/project/archived-projects/${projectId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          // Remove the deleted project from the state
          setArchivedProjects((prevProjects) =>
            prevProjects.filter((project) => project._id !== projectId)
          );

          // Show success message
          Swal.fire("Deleted!", "The project has been deleted from your archive.", "success");
        } else {
          const errorData = await response.json();
          Swal.fire("Error!", errorData.message || "Failed to delete the project.", "error");
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        Swal.fire("Error!", "An error occurred while deleting the project.", "error");
      }
    }
  };

  // Function to handle sorting
  const handleSortChange = (criteria) => {
    setSortCriteria(criteria); // Update the sorting criteria
  };

  return (
    <>
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
        <div>
          <nav>
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <a href="#" onClick={(e) => e.preventDefault()}>
                  Projects
                </a>
              </li>
              <span className="mx-1">→</span>
              <li className="breadcrumb-item active" aria-current="page">
                Project Archive
              </li>
            </ol>
          </nav>
          <br />
          <h1 className="page-title fw-medium fs-18 mb-0">Project Archive</h1>
        </div>
        <div className="btn-list">
        <button className="btn btn-white btn-wave" onClick={handleExportExcel}>
        <i className="ri-file-excel-2-line align-middle me-1 lh-1" /> Excel
</button>

        </div>
      </div>
      {/* Page Header Close */}
      {/* Start::row-1 */}
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
                    placeholder="Search Here"
                    aria-label=".form-control-sm example"
                    onChange={(e) => handleSearch(e.target.value)} // Add onChange handler
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
                        New
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="javascript:void(0);" onClick={() => handleSortChange('name')}>
                        Name
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="javascript:void(0);" onClick={() => handleSortChange('budget')}>
                        Budget
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body card-body m-3 bg-light p-2 rounded mt-2">
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 ps-2">
                <p className="mb-0 fs-15">
                  <span className="text-primary1 fw-semibold"> {filteredProjects.length} items</span> in our archive
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {currentProjects.length > 0 ? (
          currentProjects.map((project) => (
            <div className="col-lg-6" key={project._id}>
              <div className="card custom-card card-style-3">
                <div className="card-body p-3">
                <div className="row">
              <div className="col-md-2">
<span className="avatar avatar-lg me-1 bg-primary-gradient"
                  style={{
                    color: '#ffffff', // White text color for contrast
                    display: 'flex',
                    width: '70px',
                    height: '70px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'regular',
                    fontSize: '18px',
                  }}
                >
                  {getInitials(project.name)}
                </span>
              </div>
             
                             <div className="col-md-10">
                      <div className="d-flex align-items-start justify-content-between mb-2">
                        <div className="flex-grow-1">
                          <h6 className="fs-14 mb-1 fw-medium">
                            <a>{project.name}</a>
                          </h6>
                          <div
  className={`min-w-fit-content fw-normal mb-1 fs-13 fw-medium ${
    project.originalStatus === 'Completed'
      ? 'text-success' // Green for "Completed"
      : project.originalStatus === 'Not Started'
      ? 'text-warning' // Yellow for "Not Started"
      : 'text-secondary' // Default color for other statuses
  }`}
>
  {project.originalStatus}
</div>                          <div className="d-flex align-items-baseline gap-2 mb-1">
                            <span className="badge bg-primary1-transparent ms-2">{project.budget} TND</span>
                          </div>
                        </div>
                        <a className="btn-delete btn btn-primary2-light btn-icon" onClick={() => handleDelete(project._id)}>
                          <i className="ri-delete-bin-line" />
                        </a>
                      </div>
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <a className="btn btn-primary btn-w-md" onClick={() => handleViewClick(project._id)}>
                          <i className="ri-eye-line me-1" /> View
                        </a>
                        <a
                          className="btn btn-primary-light btn-w-md"
                          onClick={() => handleUnarchive(project._id)}
                        >
                          <i className="ri-inbox-unarchive-line me-1" /> UnArchive
                        </a>
                        <div className="d-flex align-items-baseline fs-13 ms-auto">
                          <p className="mb-0 ms-1 min-w-fit-content text-muted">
                            <span>{new Date(project.updated_at).toLocaleDateString()}</span>
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
              No archived projects found.
            </div>
          </div>
        )}
      </div>

      <div className="col-xl-12">
        <div className="d-flex align-items-center flex-wrap overflow-auto p-3 bg-white mb-3">
          <div className="mb-2 mb-sm-0">
            Showing <b>{indexOfFirstItem + 1}</b> to <b>{Math.min(indexOfLastItem, filteredProjects.length)}</b> of <b>{filteredProjects.length}</b> entries
          </div>
          <div className="ms-auto">
            <ul className="pagination mb-0 overflow-auto">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <a className="page-link" href="javascript:void(0);" onClick={() => handlePageChange(currentPage - 1)}>
                  Previous
                </a>
              </li>
              {pageNumbers.map((number) => (
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