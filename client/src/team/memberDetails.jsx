import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import RelatedProfiles from './relatedProfiles';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import ReportForm from '../reports/ReportForm';

// Enregistrer les composants nécessaires de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

const MemberDetails = () => {
    const [member, setMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showReportForm, setShowReportForm] = useState(false);
    const [teamInfo, setTeamInfo] = useState(null);
    const [projectInfo, setProjectInfo] = useState(null);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const timeout = setTimeout(() => {
            setLoading(false);
        }, 5000);

        const fetchUserInfo = async () => {
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

                if (!response.data) {
                    navigate("/signin");
                }
            } catch (err) {
                console.error("Error fetching user info:", err);
                if (err.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate("/signin");
                }
            } finally {
                clearTimeout(timeout);
                setLoading(false);
            }
        };

        fetchUserInfo();
        return () => clearTimeout(timeout);
    }, [navigate]);

    useEffect(() => {
        const fetchMember = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `https://lavoro-back.onrender.com/teamMember/getTeamMember/${id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        withCredentials: true
                    }
                );

                const memberData = response.data.data;
                setMember(memberData);

                // Récupérer les informations sur l'équipe
                if (memberData && memberData.teamId) {
                    try {
                        const teamResponse = await axios.get(
                            `https://lavoro-back.onrender.com/team/${memberData.teamId}`,
                            {
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                },
                                withCredentials: true
                            }
                        );

                        const teamData = teamResponse.data.data;
                        setTeamInfo(teamData);

                        // Récupérer les informations sur le projet
                        if (teamData && teamData.project_id) {
                            try {
                                const projectResponse = await axios.get(
                                    `https://lavoro-back.onrender.com/project/getProjectById/${teamData.project_id}`,
                                    {
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                        },
                                        withCredentials: true
                                    }
                                );

                                setProjectInfo(projectResponse.data);
                            } catch (projectError) {
                                console.error('Error fetching project:', projectError);

                                // Récupérer un projet par défaut si le projet de l'équipe n'est pas trouvé
                                try {
                                    const defaultProjectResponse = await axios.get(
                                        `https://lavoro-back.onrender.com/project/dash`,
                                        {
                                            headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                            },
                                            withCredentials: true
                                        }
                                    );

                                    if (Array.isArray(defaultProjectResponse.data) && defaultProjectResponse.data.length > 0) {
                                        setProjectInfo(defaultProjectResponse.data[0]);
                                    }
                                } catch (defaultProjectError) {
                                    console.error('Error fetching default project:', defaultProjectError);
                                }
                            }
                        } else {
                            // Si l'équipe n'a pas de projet, récupérer un projet par défaut
                            try {
                                const defaultProjectResponse = await axios.get(
                                    `https://lavoro-back.onrender.com/project/dash`,
                                    {
                                        headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                        },
                                        withCredentials: true
                                    }
                                );

                                if (Array.isArray(defaultProjectResponse.data) && defaultProjectResponse.data.length > 0) {
                                    setProjectInfo(defaultProjectResponse.data[0]);
                                }
                            } catch (defaultProjectError) {
                                console.error('Error fetching default project:', defaultProjectError);
                            }
                        }
                    } catch (teamError) {
                        console.error('Error fetching team:', teamError);
                    }
                }

                setLoading(true);
            } catch (error) {
                console.error('Error fetching member:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMember();
    }, [id]);

    if (loading) {
        return <div className="text-center py-4">Loading...</div>;
    }

    if (!member) {
        return <div className="text-center py-4">Member not found</div>;
    }

    // Fonction pour déterminer le niveau d'expérience
    const getExperienceLevel = (level) => {
        switch(level) {
            case 1: return { text: 'Junior', color: 'danger' };
            case 2: return { text: 'Mid-level', color: 'warning' };
            case 3: return { text: 'Senior', color: 'success' };
            default: return { text: 'Unknown', color: 'secondary' };
        }
    };

    const experienceInfo = getExperienceLevel(member.experience_level);

    // Données pour les graphiques
    const performanceData = {
        labels: ['Performance', 'Remaining'],
        datasets: [
            {
                data: [member.performance_score, 100 - member.performance_score],
                backgroundColor: ['#4b7bec', '#f1f2f6'],
                borderWidth: 0,
            },
        ],
    };

    const tasksData = {
        labels: ['Completed', 'Missed'],
        datasets: [
            {
                data: [member.total_tasks_completed, member.missed_deadlines],
                backgroundColor: ['#26de81', '#fc5c65'],
                borderWidth: 0,
            },
        ],
    };

    const chartOptions = {
        cutout: '70%',
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: false,
            },
        },
    };

    return (
        <div className="container-fluid">
            {/* Report Form Modal */}
            {showReportForm && (
                <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', marginLeft : '100px' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowReportForm(false)}
                                    aria-label="Close"
                                ></button>
                            </div>
                            <div className="modal-body" >

                                <ReportForm
                                    onClose={() => setShowReportForm(false)}
                                    onSuccess={() => {
                                        setShowReportForm(false);
                                        // Optionally refresh data or show success message
                                    }}
                                    initialData={{
                                        reported_user_id: id, // Pass the current member ID
                                        hideUserField: true, // Hide the user selection field
                                        hideProjectField: true, // Hide the project selection field
                                        memberName: member.name, // Pass the member name for display
                                        project_id: projectInfo?.project_id || projectInfo?._id, // Pass the project ID
                                        team_manager_id: teamInfo?.manager_id?._id, // Pass the team manager ID
                                        teamInfo: teamInfo, // Pass the team info
                                        projectInfo: projectInfo // Pass the project info
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
                <div>
                    <nav>
                        <ol className="breadcrumb mb-1">
                            
                            <li className="breadcrumb-item"><a href="#!">Teams</a></li>
                            <span className="mx-1">→</span>
                            <li className="breadcrumb-item"><a href="#!">Team List</a></li>
                            <span className="mx-1">→</span>
                            <li className="breadcrumb-item active">Member Details</li>
                        </ol>
                    </nav>
                    <h1 className="page-title fw-medium fs-18 mb-0">Member Details</h1>
                </div>
                
            </div>

            {/* Main Content */}
            <div className="row">
                <div className="col-xxl-8">
                    {/* Profile Card */}
                    <div className="card custom-card job-candidate-details">
                        <div className="candidate-bg-shape primary"></div>
                        <div className="card-body pt-5">
                            <div className="mb-3 lh-1 mt-4">
                                <span className="avatar avatar-xxl avatar-rounded">
                                    <img src={member.image.startsWith('http') ?
                                        member.image :
                                        `https://lavoro-back.onrender.com${member.image}`}
                                        alt={member.name} className="rounded-circle img-fluid shadow" />
                                </span>
                            </div>
                            <div className="d-flex gap-2 flex-wrap mb-3">
                                <div className="flex-fill">
                                    <h6 className="mb-1 fw-semibold">
                                        <a href="#!">{member.name} <i className="ri-check-line text-success fs-16" title="Verified candidate"></i></a>
                                    </h6>
                                    <p className="mb-0 text-muted">Developer</p>
                                    <div className="d-flex flex-wrap gap-2 align-items-center fs-12 text-muted">
                                        <p className="mb-0">Ratings: </p>
                                        <div className="min-w-fit-content ms-2">
                                            {[...Array(5)].map((_, i) => (
                                                <span key={i} className={i < Math.floor(member.performance_score / 20) ? "text-warning" : "text-muted"}>
                                                    <i className={i < Math.floor(member.performance_score / 20) ? "ri-star-fill" : "ri-star-line"}></i>
                                                </span>
                                            ))}
                                        </div>
                                        <span className="ms-1 min-w-fit-content text-muted">
                                            ({member.performance_score}%)
                                        </span>
                                    </div>
                                    <div className="d-flex fs-14 mt-3 gap-2 flex-wrap">
                                        <div className="me-3">
                                            <p className="mb-1"><i className="ri-task-line me-2 text-muted"></i>Completed Tasks: <span className="fw-medium">{member.total_tasks_completed}</span></p>
                                            <p className="mb-0"><i className="ri-alarm-warning-line me-2 text-muted"></i>Missed Deadlines: <span className="fw-medium">{member.missed_deadlines}</span></p>
                                        </div>
                                        <div className="me-3">
                                            <p className="mb-1"><i className="ri-mail-line me-2 text-muted"></i>Mail: <span className="fw-medium">{member.email}</span></p>
                                            <p className="mb-0"><i className="ri-calendar-line me-2 text-muted"></i>Joined: <span className="fw-medium">{new Date(member.joined_at).toLocaleDateString()}</span></p>
                                        </div>
                                    </div>
                                </div>
                                <div className="btn-list ms-auto">
                                    <button
                                        className="btn btn-danger rounded-pill btn-wave"
                                        onClick={() => setShowReportForm(true)}
                                    >
                                        <i className="ri-alarm-warning-line me-1" ></i> Report
                                    </button>
                                    
                                </div>
                            </div>
                            
                            <div className="d-flex gap-3 align-items-center flex-wrap">
                                <h6 className="mb-0">Experience Level:</h6>
                                <div className="popular-tags d-flex gap-2 flex-wrap">
                                    <span className={`badge rounded-pill fs-11 bg-${experienceInfo.color}-transparent`}>
                                        <i className="ri-user-line me-1"></i>{experienceInfo.text}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skills Section */}
                    <div className="row">
                        <div className="col-xl-6">
                            <div className="card custom-card">
                                <div className="card-header">
                                    <div className="card-title">Skills</div>
                                </div>
                                <div className="card-body">
                                    <div className="popular-tags d-flex gap-2 flex-wrap">
                                        {member.skills.slice(0, 5).map(skill => (
                                            <span key={skill.id} className="badge rounded-pill bg-primary-transparent">
                                                {skill.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-6">
                            <div className="card custom-card">
                                <div className="card-header">
                                    <div className="card-title">Performance Statistics</div>
                                </div>
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-6">
                                            <div className="text-center">
                                                <div style={{ width: '100px', height: '100px', margin: '0 auto' }}>
                                                    <Doughnut data={performanceData} options={chartOptions} />
                                                </div>
                                                <div className="mt-2">
                                                    <h6 className="mb-0">Performance</h6>
                                                    <span className="text-muted fs-12">{member.performance_score}%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div className="text-center">
                                                <div style={{ width: '100px', height: '100px', margin: '0 auto' }}>
                                                    <Doughnut data={tasksData} options={chartOptions} />
                                                </div>
                                                <div className="mt-2">
                                                    <h6 className="mb-0">Tasks</h6>
                                                    <span className="text-muted fs-12">
                                                        {member.total_tasks_completed} done / {member.missed_deadlines} missed
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <span className="fw-medium">Experience Level:</span>
                                            <span className={`badge bg-${experienceInfo.color}-transparent text-${experienceInfo.color}`}>
                                                {experienceInfo.text}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="col-xxl-4">
                    <RelatedProfiles teamId={member.teamId} currentMemberId={id} />
                </div>
            </div>
        </div>
    );
};

export default MemberDetails;