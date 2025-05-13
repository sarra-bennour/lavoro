import React from 'react';
import { RiTeamLine, RiGitRepositoryLine, RiUserLine } from 'react-icons/ri';

const DeveloperProjects = ({ projects }) => {
  // Default project image if none provided
  const getProjectImage = (project) => {
    if (project.image) {
      return project.image.startsWith('http') ? project.image : `https://lavoro-back.onrender.com${project.image}`;
    }
    return '../assets/images/faces/8.jpg'; // Default project image
  };

  return (
    <div className="col-xl-12">
      <div className="card custom-card">
        <div className="card-header justify-content-between">
          <div className="card-title">Projects You Contribute To</div>
          
        </div>
        <div className="card-body">
          {Array.isArray(projects) && projects.length > 0 ? (
            <div className="row">
              {projects.map((project) => (
                <div key={project._id} className="col-xl-12 col-lg-12 col-md-12 col-sm-12 mb-3">
                  <div className="card custom-card border border-info">
                    <a href={`/projects/${project._id}`} className="card-anchor"></a>
                    <div className="card-body">
                      <div className="d-flex align-items-center">
                        <div className="me-3">
                          <span className="avatar avatar-xl">
                            <img
                              src={getProjectImage(project)}
                              alt={project.name}
                              onError={(e) => {
                                e.target.src = '../assets/images/faces/8.jpg';
                              }}
                            />
                          </span>
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <p className="card-text text-info mb-0 fs-16 fw-medium">
                              {project.name}
                            </p>
                            <span className="badge bg-info-transparent">
                              {project.taskCount || 0} tasks
                            </span>
                          </div>
                            
                            <div className="col-md-4">
                              <div className="card-title fs-12 mb-1 d-flex align-items-center">
                                <RiUserLine className="me-1" />
                                PM: {project.projectManager ?
                                  `${project.projectManager.firstName} ${project.projectManager.lastName}` :
                                  'Not assigned'}
                              </div>
                            </div>
                            
                         

                          {/* Progress bar for task completion */}
                          <div className="mt-3">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="fs-11 text-muted">Progress</span>
                              <span className="fs-11 text-info">
                                {project.taskCount ?
                                  Math.round((project.completedTasks / project.taskCount) * 100) : 0}%
                              </span>
                            </div>
                            <div className="progress progress-sm">
                              <div
                                className="progress-bar bg-info"
                                role="progressbar"
                                style={{
                                  width: `${project.taskCount ?
                                    Math.round((project.completedTasks / project.taskCount) * 100) : 0}%`
                                }}
                                aria-valuenow={project.taskCount ?
                                  Math.round((project.completedTasks / project.taskCount) * 100) : 0}
                                aria-valuemin="0"
                                aria-valuemax="100"
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <i className="ri-git-repository-line fs-3 text-muted"></i>
              <p className="text-muted mt-2">No active projects found</p>
              <a href="/projects" className="btn btn-sm btn-outline-primary mt-2">
                Browse Projects
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperProjects;