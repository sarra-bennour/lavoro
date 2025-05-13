import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import { useNavigate , useParams } from 'react-router-dom';
import { useDebounce } from 'use-debounce';

const SearchMember = () => {
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [userSkills, setUserSkills] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(6);
  const [sortOption, setSortOption] = useState('alphabetical');
  const [filterOption, setFilterOption] = useState('all');
  const { id } = useParams();
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });


  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error("No token found");

        // Fetch user info
        await axios.get("https://lavoro-back.onrender.com/users/me", {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        // Fetch skills
        const skillsResponse = await axios.get(
          "https://lavoro-back.onrender.com/skills/getSkills",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (skillsResponse.data.success) setSkills(skillsResponse.data.data);

        // Fetch all devs
        const usersResponse = await axios.get(
          "https://lavoro-back.onrender.com/users/getAllDev",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUsers(usersResponse.data.data);

        // Fetch user skills
        if (usersResponse.data.data.length > 0) {
          const userIds = usersResponse.data.data.map(user => user._id);
          const skillsResponse = await axios.post(
            'https://lavoro-back.onrender.com/userSkills/getSkillsForMultipleUsers',
            { userIds },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setUserSkills(skillsResponse.data.data);
        }
      } catch (err) {
        console.error("Error:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate("/signin");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate]);

  // Filter and sort users
  useEffect(() => {
    let result = [...users];

    // Apply search filter
    if (debouncedSearchTerm.trim() !== '') {
      result = result.filter(user =>
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    // Apply skill filter
    if (selectedSkills.length > 0) {
      const skillIds = selectedSkills.map(skill => skill._id);
      result = result.filter(user => {
        const userSkillIds = userSkills[user._id]?.map(skill => skill._id.toString()) || [];
        return skillIds.some(id => userSkillIds.includes(id));
      });
    }

    // Apply role filter
    if (filterOption !== 'all') {
      result = result.filter(user => user.role?.toLowerCase() === filterOption);
    }

    // Apply sorting
    switch (sortOption) {
      case 'alphabetical':
        result.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
        break;
      case 'reverse':
        result.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        break;
    }

    setFilteredUsers(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, userSkills, debouncedSearchTerm, selectedSkills, sortOption, filterOption]);

  useEffect(() => {
    let timer;
    if (alert.show) {
      timer = setTimeout(() => {
        setAlert({ show: false, message: '', type: '' });
      }, 5000); // 5000 ms = 5 secondes
    }
    return () => clearTimeout(timer); // Nettoyage du timer
  }, [alert.show]);

  const handleAddTeamMember = async (userId) => {
    try {
      const token = localStorage.getItem('token');

      const response = await axios.post(
        'https://lavoro-back.onrender.com/teamMember/addTeamMembers',
        {
          team_id: id,
          user_id: userId,
          skills: userSkills[userId]?.map(skill => skill._id) || []
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Afficher l'alerte de succès
      setAlert({
        show: true,
        message: 'Member added successfully!',
        type: 'success'
      });

      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error:', error);

      // Afficher l'alerte d'erreur
      setAlert({
        show: true,
        message: error.response?.data?.message || 'Failed to add member',
        type: 'danger'
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Explore</title></Helmet>


      <div className="container-fluid">
        <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
          <div>
            <nav>
              <ol className="breadcrumb mb-1">
                <li className="breadcrumb-item"><a href="javascript:void(0);">Pages</a></li>
                <li className="breadcrumb-item active" aria-current="page">Explore</li>
              </ol>
            </nav>
            <h1 className="page-title fw-medium fs-18 mb-0">Explore</h1>
          </div>
        </div>


      {/* Ajout de l'alerte en haut de la page */}
      {alert.show && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show`} role="alert">
          {alert.message}
          <button
            type="button"
            className="btn-close"
            onClick={() => setAlert({ show: false, message: '', type: '' })}
          ></button>
        </div>
      )}

        <div className="row">
          <div className="col-xl-12">
            <SearchCard
              skills={skills}
              selectedSkills={selectedSkills}
              setSelectedSkills={setSelectedSkills}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              sortOption={sortOption}
              setSortOption={setSortOption}
              filterOption={filterOption}
              setFilterOption={setFilterOption}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-xl-12">
            <ResultsTabs
              users={currentUsers}
              userSkills={userSkills}
              onAddTeamMember={handleAddTeamMember}
              totalUsers={filteredUsers.length}
              usersPerPage={usersPerPage}
              currentPage={currentPage}
              paginate={setCurrentPage}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const SearchCard = ({
  skills,
  selectedSkills,
  setSelectedSkills,
  searchTerm,
  setSearchTerm,
  sortOption,
  setSortOption,
  filterOption,
  setFilterOption
}) => {
  const handleSkillClick = (skill) => {
    setSelectedSkills(prev =>
      prev.some(s => s._id === skill._id)
        ? prev.filter(s => s._id !== skill._id)
        : [...prev, skill]
    );
  };

  const handleClearAll = () => {
    setSelectedSkills([]);
    setSearchTerm('');
    setSortOption('alphabetical');
    setFilterOption('all');
  };

  return (
    <div className="card custom-card overflow-hidden">
      <div className="card-body p-0">
        <div className="p-3 border-bottom">
          <div className="input-group mb-3 search-result-input gap-2">
            <input
              type="text"
              className="form-control form-control-lg bg-light rounded-pill"
              placeholder="Explore Here ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="position-absolute start-0 text-muted mt-3 ms-3 lh-1 search-result-icon">
              <i className="ri-search-line"></i>
            </span>
            <button className="btn btn-primary btn-wave btn-w-sm rounded-pill">Search</button>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            {skills.map((skill) => (
              <button
                key={skill._id}
                className={`badge border text-default rounded-pill ${
                  selectedSkills.some(s => s._id === skill._id)
                    ? 'bg-primary1 text-white'
                    : 'bg-light'
                }`}
                onClick={() => handleSkillClick(skill)}
              >
                {skill.name}
                {selectedSkills.some(s => s._id === skill._id) && <span className="ms-1">×</span>}
              </button>
            ))}

            {skills.length === 0 && <span className="text-muted">No skills found</span>}

            <div className="ms-auto">
              <button
                className="text-primary text-decoration-underline fw-medium mx-2 bg-transparent border-0"
                onClick={handleClearAll}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        <div className="p-3 d-flex gap-2 justify-content-between flex-wrap align-items-center">
          <div className="text-muted">
            {selectedSkills.length > 0
              ? `${selectedSkills.length} skill(s) selected`
              : `Total of ${skills.length} skills available`
            }
          </div>
          <div className="ms-auto d-flex gap-2">
            <SortDropdown sortOption={sortOption} setSortOption={setSortOption} />
            <FilterDropdown filterOption={filterOption} setFilterOption={setFilterOption} />
          </div>
        </div>

        <TabNavigation />
      </div>
    </div>
  );
};

const SortDropdown = ({ sortOption, setSortOption }) => {
  const options = [
    { value: 'alphabetical', label: 'Alphabetical (A-Z)' },
    { value: 'reverse', label: 'Alphabetical (Z-A)' },
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' }
  ];

  return (
    <div className="dropdown">
      <button className="btn btn-sm btn-w-md btn-light text-muted dropdown-toggle" data-bs-toggle="dropdown">
        Sort By: {options.find(o => o.value === sortOption)?.label || 'Select'}
      </button>
      <ul className="dropdown-menu">
        {options.map(option => (
          <li key={option.value}>
            <button
              className={`dropdown-item ${sortOption === option.value ? 'active' : ''}`}
              onClick={() => setSortOption(option.value)}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const FilterDropdown = ({ filterOption, setFilterOption }) => {
  const options = [
    { value: 'all', label: 'All Roles' },
    { value: 'developer', label: 'Developers' },
    { value: 'designer', label: 'Designers' },
    { value: 'manager', label: 'Managers' }
  ];

  return (
    <div className="dropdown">
      <button className="btn btn-sm btn-w-md btn-primary dropdown-toggle" data-bs-toggle="dropdown">
        Filter By: {options.find(o => o.value === filterOption)?.label || 'All'}
      </button>
      <ul className="dropdown-menu">
        {options.map(option => (
          <li key={option.value}>
            <button
              className={`dropdown-item ${filterOption === option.value ? 'active' : ''}`}
              onClick={() => setFilterOption(option.value)}
            >
              {option.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

const TabNavigation = () => (
  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 px-3 pt-1 pb-3">
    <ul className="nav nav-tabs tab-style-6 p-0 search-tab gap-2" role="tablist">
      <li className="nav-item" role="presentation">
        <a className="nav-link active fw-medium" data-bs-toggle="tab" role="tab" href="#search-all">
          <i className="ri-search-line me-2"></i>All
        </a>
      </li>
      <li className="nav-item" role="presentation">
        <a className="nav-link fw-medium" data-bs-toggle="tab" role="tab" href="#search-news">
          <i className="ri-newspaper-line me-2"></i>Available Members
        </a>
      </li>
    </ul>
  </div>
);

const ResultsTabs = ({
  users = [],
  userSkills = {},
  onAddTeamMember,
  totalUsers,
  usersPerPage,
  currentPage,
  paginate
}) => (
  <div className="tab-content">
    <div className="tab-pane p-0 border-0 show active" id="search-all" role="tabpanel">
      <AllResults users={users} userSkills={userSkills} onAddTeamMember={onAddTeamMember} />
      {totalUsers > usersPerPage && (
        <Pagination
          usersPerPage={usersPerPage}
          totalUsers={totalUsers}
          currentPage={currentPage}
          paginate={paginate}
        />
      )}
    </div>
    <div className="tab-pane border-0 p-0" id="search-news" role="tabpanel">
      <NewsResults />
    </div>
  </div>
);

const AllResults = ({ users = [], userSkills = {}, onAddTeamMember }) => (
  <div className="row">
    {users.length > 0 ? (
      users.map((user) => {
        const skills = userSkills[user._id] || [];
        return (
          <div key={user._id} className="col-xl-6">
            <div className="card custom-card">
              <div className="card-body">
                <div className="d-flex align-items-start flex-wrap gap-3 justify-content-between">
                  <div className="d-flex align-items-center">
                    <div>
                      <span className="avatar avatar-xl bg-primary bg-opacity-10 border">
                      <img
                          src={
                            user.image?.startsWith('http') ||
                            user.image?.startsWith('//')
                              ? user.image
                              : `https://lavoro-back.onrender.com${user.image}`
                          }
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.target.src = '';
                            e.target.onerror = null;
                          }}
                          className="user-avatar"
                        />
                      </span>
                    </div>
                    <div className="ms-2">
                      <h6 className="fw-medium my-1 d-flex align-items-center">
                        {user.firstName} {user.lastName}
                      </h6>
                      <span className="d-block text-muted text-capitalize">{user.role || 'Developer'}</span>
                    </div>
                  </div>
                  <div className="btn-list">
                    <button
                      className="btn btn-sm btn-icon btn-warning-light me-0"
                      title="Add Member"
                      onClick={() => onAddTeamMember(user._id)}
                    >
                      <i className="ri-user-add-line"></i>
                    </button>
                  </div>
                </div>
                <div className="d-flex gap-2 justify-content-between mt-3">
                  <div className="popular-tags">
                    {skills.map((skill) => (
                      <span key={skill._id} className="badge rounded-pill bg-primary-transparent me-1">
                        {skill.name}
                      </span>
                    ))}
                    {skills.length === 0 && (
                      <span className="text-muted">No skills listed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })
    ) : (
      <div className="col-12 text-center py-5">
        <div className="d-flex flex-column align-items-center justify-content-center">
          <div className="avatar avatar-xl bg-light mb-3">
            <i className="ri-search-line fs-4"></i>
          </div>
          <h5 className="mb-1">No members found</h5>
          <span className="text-muted">Try adjusting your search criteria</span>
        </div>
      </div>
    )}
  </div>
);

const Pagination = ({ usersPerPage, totalUsers, currentPage, paginate }) => {
  const pageNumbers = [];
  const totalPages = Math.ceil(totalUsers / usersPerPage);

  // Show limited page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  return (
    <nav aria-label="Page navigation" className="pagination-style-4 mt-4">
      <ul className="pagination text-center justify-content-center gap-1">
        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
        </li>

        {getPageNumbers().map((number, index) => (
          <li
            key={index}
            className={`page-item ${currentPage === number ? 'active' : ''} ${number === '...' ? 'disabled' : ''}`}
          >
            {number === '...' ? (
              <span className="page-link">...</span>
            ) : (
              <button
                className="page-link"
                onClick={() => paginate(number)}
              >
                {number}
              </button>
            )}
          </li>
        ))}

        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
          <button
            className="page-link"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </li>
      </ul>
    </nav>
  );
};

// Placeholder components (keep your existing implementations)
const NewsResults = () => <div className="row"></div>;
const LoadingButton = () => null;
const ViewDropdown = () => null;

export default SearchMember;