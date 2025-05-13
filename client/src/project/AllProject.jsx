import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AllProject = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Appeler l'API pour récupérer les projets
        axios.get('https://lavoro-back.onrender.com/project')
            .then(response => {
                setProjects(response.data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching projects:', err);
                setError('Failed to fetch data');
                setLoading(false);
            });
    }, []);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div className="card custom-card">
            <div className="card-header justify-content-between">
                <div className="card-title">Projects Summary</div>
                <div className="d-flex flex-wrap">
                    <div className="me-3 my-1">
                        <input className="form-control form-control-sm" type="text" placeholder="Search Here" aria-label=".form-control-sm example" />
                    </div>
                    <div className="dropdown my-1">
                        <a href="javascript:void(0);" className="btn btn-primary btn-sm" data-bs-toggle="dropdown" aria-expanded="false">
                            Sort By<i className="ri-arrow-down-s-line align-middle ms-1 d-inline-block"></i>
                        </a>
                        <ul className="dropdown-menu" role="menu">
                            <li><a className="dropdown-item" href="javascript:void(0);">New</a></li>
                            <li><a className="dropdown-item" href="javascript:void(0);">Popular</a></li>
                            <li><a className="dropdown-item" href="javascript:void(0);">Relevant</a></li>
                        </ul>
                    </div>
                </div>
            </div>
            <div className="card-body">
                <div className="table-responsive">
                    <table className="table table-hover text-nowrap table-bordered">
                        <thead>
                            <tr>
                                <th scope="col">S.No</th>
                                <th scope="col">Project Title</th>
                                <th scope="col">Tasks</th>
                                <th scope="col">Progress</th>
                                <th scope="col">Assigned Team</th>
                                <th scope="col">Status</th>
                                <th scope="col">Due Date</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projects.map((project, index) => (
                                <tr key={project._id}>
                                    <td>{index + 1}</td>
                                    <td><span className="fw-medium">{project.name}</span></td>
                                    <td>{project.tasksCompleted} <span className="op-7">/{project.totalTasks}</span></td>
                                    <td>
                                        <div className="d-flex align-items-center">
                                            <div className="progress progress-sm w-100" role="progressbar" aria-valuenow={project.progress} aria-valuemin="0" aria-valuemax="100">
                                                <div className="progress-bar bg-primary" style={{ width: `${project.progress}%` }}></div>
                                            </div>
                                            <div className="ms-2">{project.progress}%</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="avatar-list-stacked">
                                            {project.assignedTeam.map((member, i) => (
                                                <span key={i} className="avatar avatar-xs avatar-rounded">
                                                    <img src={member.avatar} alt={member.name} />
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${project.status === 'Completed' ? 'bg-success-transparent' : 'bg-primary-transparent'}`}>
                                            {project.status}
                                        </span>
                                    </td>
                                    <td>{new Date(project.dueDate).toLocaleDateString()}</td>
                                    <td>
                                        <div className="btn-list">
                                            <a aria-label="anchor" href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="View" className="btn btn-icon rounded-pill btn-sm btn-primary-light"><i className="ti ti-eye"></i></a>
                                            <a aria-label="anchor" href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Edit" className="btn btn-icon rounded-pill btn-sm btn-secondary-light"><i className="ti ti-pencil"></i></a>
                                            <a aria-label="anchor" href="javascript:void(0);" data-bs-toggle="tooltip" data-bs-placement="top" data-bs-title="Delete" className="btn btn-icon rounded-pill btn-sm btn-danger-light"><i className="ti ti-trash"></i></a>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AllProject;