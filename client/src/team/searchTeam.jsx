import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const SearchTeam = () => {
    const [teams, setTeams] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [projectsLoading, setProjectsLoading] = useState(true);
    const [filters, setFilters] = useState({
      status: [],
      project: [],
      tags: []
    });
    const [sortBy, setSortBy] = useState('newest');
    const [totalTeams, setTotalTeams] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const teamsPerPage = 8;
    const navigate = useNavigate();
  // Fetch projects for filter options
  useEffect(() => {

const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await axios.get('https://lavoro-back.onrender.com/project', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('Projects API Response:', response);

      // Update this check to match the actual response structure
      if (response.data && Array.isArray(response.data)) {  // Changed from response.data.data
        setProjects(response.data);  // Changed from response.data.data
      } else {
        toast.error('Invalid projects data format');
        setProjects([]);
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      toast.error('Failed to fetch projects for filters');
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  };
    fetchProjects();
  }, []);

  // Fetch teams with filters
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://lavoro-back.onrender.com/teams/search', {
          params: {
            status: filters.status.join(','),
            project: filters.project.join(','),
            tags: filters.tags.join(','),
            sort: sortBy,
            page: currentPage,
            limit: teamsPerPage
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        setTeams(response.data?.data || []);
        setTotalTeams(response.data?.total || 0);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to fetch teams');
        console.error('Team search error:', err);
        setTeams([]);
        setTotalTeams(0);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [filters, sortBy, currentPage]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      const index = newFilters[filterType].indexOf(value);
      if (index === -1) {
        newFilters[filterType].push(value);
      } else {
        newFilters[filterType].splice(index, 1);
      }
      return newFilters;
    });
    setCurrentPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Extract unique tags from all teams for filter options
  const allTags = [...new Set(teams.flatMap(team => team?.tags || []))].filter(tag => tag);

  return (
    <div className="container-fluid">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
        <div>
          <nav>
            <ol className="breadcrumb mb-1">
              <li className="breadcrumb-item">
                <a href="#" onClick={(e) => { e.preventDefault(); navigate('/teamsList'); }}>
                  Teams
                </a>
              </li>
              <span className="mx-1">→</span>

              <li className="breadcrumb-item active" aria-current="page">
                Team Search
              </li>
            </ol>
          </nav>
          <h1 className="page-title fw-medium fs-18 mb-0">Team Search</h1>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-3 col-xl-4">
          <div className="card custom-card products-navigation-card">
            <div className="card-body p-0">
              {/* Status Filter */}
              <div className="p-3 border-bottom">
                <h6 className="fw-medium mb-0">Status</h6>
                <div className="py-3 pb-0">
                  {['Active', 'Archived'].map(status => (
                    <div className="form-check mb-2" key={status}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`status-${status.toLowerCase()}`}
                        checked={filters.status.includes(status)}
                        onChange={() => handleFilterChange('status', status)}
                      />
                      <label className="form-check-label" htmlFor={`status-${status.toLowerCase()}`}>
                        {status}
                      </label>
                      <span className="badge bg-light text-default fw-500 float-end">
                        {teams.filter(t => t?.status === status).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects Filter */}
              <div className="p-3 border-bottom">
                <h6 className="fw-medium mb-0">Projects</h6>
                {projectsLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 pb-0">
                    {projects.length > 0 ? (
                      projects.map(project => (
                        <div className="form-check mb-2" key={project._id}>
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`project-${project._id}`}
                            checked={filters.project.includes(project._id)}
                            onChange={() => handleFilterChange('project', project._id)}
                          />
                          <label className="form-check-label" htmlFor={`project-${project._id}`}>
                            {project.name}
                          </label>
                          <span className="badge bg-light text-default fw-500 float-end">
                            {teams.filter(t => t.project_id?._id === project._id).length}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted fs-12">No projects available</div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags Filter */}
              <div className="p-3">
                <h6 className="fw-medium mb-0">Tags</h6>
                <div className="py-3 pb-0">
                  {allTags?.slice(0, 5).map(tag => (
                    <div className="form-check mb-2" key={tag}>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`tag-${tag}`}
                        checked={filters.tags.includes(tag)}
                        onChange={() => handleFilterChange('tags', tag)}
                      />
                      <label className="form-check-label" htmlFor={`tag-${tag}`}>
                        {tag}
                      </label>
                      <span className="badge bg-light text-default fw-500 float-end">
                        {teams.filter(t => t?.tags?.includes(tag)).length}
                      </span>
                    </div>
                  ))}
                  {allTags?.length > 5 && (
                    <>
                      <div className="collapse" id="tags-more">
                        {allTags?.slice(5).map(tag => (
                          <div className="form-check mb-2" key={tag}>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`tag-${tag}`}
                              checked={filters.tags.includes(tag)}
                              onChange={() => handleFilterChange('tags', tag)}
                            />
                            <label className="form-check-label" htmlFor={`tag-${tag}`}>
                              {tag}
                            </label>
                            <span className="badge bg-light text-default fw-500 float-end">
                              {teams.filter(t => t?.tags?.includes(tag)).length}
                            </span>
                          </div>
                        ))}
                      </div>
                      <a className="ecommerce-more-link mt-3" data-bs-toggle="collapse" href="#tags-more">
                        {filters.tags.length > 5 ? 'SHOW LESS' : 'MORE'}
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xxl-9 col-xl-8">
          <div className="card custom-card p-3">
            <div className="row align-items-center p-3 bg-primary-transparent rounded mx-0 mb-3">
              <div className="col-sm-7">
                <div className="d-flex">
                  <h5 className="fw-medium mb-0">
                    <span className="fw-normal">Showing</span> {totalTeams} Teams
                  </h5>
                </div>
              </div>
              <div className="col-sm-5 text-sm-end mt-3 mt-sm-0">
                <div className="btn-group">
                  <button className="btn btn-primary border dropdown-toggle" type="button" data-bs-toggle="dropdown">
                    Sort By  
                  </button>
                  <ul className="dropdown-menu">
                    <li><button className="dropdown-item" onClick={() => handleSortChange('newest')}>Newest</button></li>
                    <li><button className="dropdown-item" onClick={() => handleSortChange('oldest')}>Oldest</button></li>
                    <li><button className="dropdown-item" onClick={() => handleSortChange('name-asc')}>Name (A-Z)</button></li>
                    <li><button className="dropdown-item" onClick={() => handleSortChange('name-desc')}>Name (Z-A)</button></li>
                  </ul>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="d-flex justify-content-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="row">
                {teams?.length > 0 ? (
                  teams.map(team => (
                    <div className="col-xl-6" key={team?._id}>
                      <div className="card custom-card featured-jobs shadow-none border">
                        <div className="card-body">
                          <div className="float-end dropdown ms-auto">
                            <a href="#" className="btn btn-white btn-icon btn-sm text-muted rounded-pill" data-bs-toggle="dropdown">
                              <i className="ri-more-2-line"></i>
                            </a>
                            <ul className="dropdown-menu dropdown-menu-end">
                              <li><button className="dropdown-item" onClick={() => navigate(`/teams/teamDetails/${team?._id}`)}>View Details</button></li>
                              <li><button className="dropdown-item" onClick={() => navigate(`/teams/updateTeam/${team?._id}`)}>Edit Team</button></li>
                            </ul>
                          </div>
                          <div className="d-flex mb-3 flex-wrap gap-2 align-items-center">
                            <span className="avatar avatar-md border p-1" style={{ backgroundColor: team?.color || '#3755e6' }}>
                              <img src="/assets/images/team.png" alt={team?.name} className="rounded-circle" />
                            </span>
                            <div>
                              <h5 className="fw-medium mb-0">
                                <a href="#" onClick={(e) => { e.preventDefault(); navigate(`/teams/teamDetails/${team?._id}`); }}>
                                  {team?.name || 'Unnamed Team'}
                                </a>
                              </h5>
                              <a href="#" className="text-muted" onClick={(e) => e.preventDefault()}>
                                <i className="ri-building-line me-1"></i>
                                {team?.project_id?.name || 'No project assigned'}
                              </a>
                            </div>
                          </div>
                          <div className="popular-tags mb-3 d-flex gap-2 flex-wrap">
                            {(team?.tags || []).filter(tag => tag).map(tag => (
                              <span key={tag} className="badge rounded-pill fs-11 bg-primary-transparent">
                                {tag}
                              </span>
                            ))}
                            <span className={`badge rounded-pill fs-11 ${team?.status === 'Active' ? 'bg-success-transparent' : 'bg-secondary-transparent'}`}>
                              <i className="ri-checkbox-blank-circle-fill me-1"></i> {team?.status || 'Unknown'}
                            </span>
                            <span className="badge rounded-pill fs-11 bg-primary-transparent">
                              <i className="ri-group-line me-1"></i> {team?.members?.length || 0} Members
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <p className="mb-0 text-muted fs-12">
                                Created: {team?.created_at ? new Date(team.created_at).toLocaleDateString() : 'Unknown date'}
                              </p>
                            </div>
                            <button
                              className="btn btn-primary btn-sm d-inline-flex"
                              onClick={() => navigate(`/teams/teamDetails/${team?._id}`)}
                            >
                              View Team <i className="ri-arrow-right-line ms-2"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center py-5">
                    <h5>No teams found matching your criteria</h5>
                    <button
                      className="btn btn-primary mt-3"
                      onClick={() => {
                        setFilters({ status: [], project: [], tags: [] });
                      }}
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {totalTeams > teamsPerPage && (
              <ul className="pagination mb-4 justify-content-end">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => paginate(currentPage - 1)}>
                    Prev
                  </button>
                </li>
                {[...Array(Math.ceil(totalTeams / teamsPerPage)).keys()].map(number => (
                  <li key={number} className={`page-item ${currentPage === number + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => paginate(number + 1)}>
                      {number + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === Math.ceil(totalTeams / teamsPerPage) ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => paginate(currentPage + 1)}>
                    Next
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchTeam;