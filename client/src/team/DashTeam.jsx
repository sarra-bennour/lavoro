import React, { useEffect, useState, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import ApexCharts from 'apexcharts';
import 'apexcharts/dist/apexcharts.css';
import axios from 'axios';
import { Table, Dropdown, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';


export default function Dashboard() {
  // États pour les projets
  const [projectCount, setProjectCount] = useState(0);
  const [projectsByStatus, setProjectsByStatus] = useState({
    'Not Started': 0,
    'In Progress': 0,
    'Completed': 0,
    'Archived': 0
  });
  const [archiveCount, setArchiveCount] = useState(0);
  const [nbrProjects, setNbrProjects] = useState(0);

  // États pour les équipes et membres
  const [teamStats, setTeamStats] = useState({
    totalTeams: 0,
    teamsByProject: []
  });
  const [members, setMembers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  // Refs pour les charts et le calendrier
  const teamsChartRef = useRef(null);
  const teamsChartInstance = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch des données de projets, équipes, membres, et toutes les équipes
        const [projectCountRes, archiveRes, statusRes, teamStatsRes, membersRes, nbrProjectsRes, teamsRes] = await Promise.all([
          axios.get("https://lavoro-back.onrender.com/project/countProject"),
          axios.get("https://lavoro-back.onrender.com/project/countArchive"),
          axios.get("https://lavoro-back.onrender.com/project/projetStatus"),
          axios.get("https://lavoro-back.onrender.com/teams/getTeamStat"),
          axios.get(`https://lavoro-back.onrender.com/teams/getTeamMember?page=${pagination.page}&limit=${pagination.limit}&role=Developer`),
          axios.get("https://lavoro-back.onrender.com/teams/nbrProject"),
          axios.get("https://lavoro-back.onrender.com/teams/getAllTeams")
        ]);

        setProjectCount(projectCountRes.data.count);
        setArchiveCount(archiveRes.data.count);
        setProjectsByStatus(statusRes.data);
        setTeamStats(teamStatsRes.data.data);
        setMembers(membersRes.data.data.members || []);
        setNbrProjects(nbrProjectsRes.data.projectCount);
        setTeams(teamsRes.data.data || []);
        setPagination({
          ...pagination,
          total: membersRes.data.data.total || 0,
          pages: membersRes.data.data.pages || 1
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();

    // Initialiser flatpickr pour le daterange
    flatpickr("#daterange", {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
    });

    // Initialiser flatpickr pour le calendrier dans la carte Teams Distribution
    if (calendarRef.current) {
      flatpickr(calendarRef.current, {
        inline: true, // Afficher le calendrier en ligne
        dateFormat: 'Y-m-d',
        defaultDate: new Date(), // Définir par défaut à aujourd'hui
        onReady: function (selectedDates, dateStr, instance) {
          // Mettre en surbrillance la date d'aujourd'hui
          const today = new Date();
          const todayCell = instance.days.querySelector(
            `.flatpickr-day[aria-label="${today.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}"]`
          );
          if (todayCell) {
            todayCell.classList.add('today-highlight');
          }
        },
        onChange: function (selectedDates, dateStr, instance) {
          // Optionnel : Gérer la sélection de date si nécessaire
          console.log('Selected date:', dateStr);
        },
      });
    }

    // Cleanup
    return () => {
      if (teamsChartInstance.current) teamsChartInstance.current.destroy();
    };
  }, [pagination.page]);

  useEffect(() => {
    if (teamStats.teamsByProject.length > 0 && teamsChartRef.current) {
      if (teamsChartInstance.current) teamsChartInstance.current.destroy();

      const teamsOptions = {
        series: [{ name: 'Teams', data: teamStats.teamsByProject.map(item => item.count) }],
        chart: { type: 'bar', height: 350, toolbar: { show: false } },
        plotOptions: { bar: { borderRadius: 4, horizontal: false, columnWidth: '45%' } },
        dataLabels: { enabled: false },
        xaxis: {
          categories: teamStats.teamsByProject.map(item => item.projectName),
          labels: { style: { colors: "#8c9097", fontSize: '11px', fontWeight: 600 } }
        },
        yaxis: {
          title: {
            text: 'Number of Teams',
            style: { color: '#adb5be', fontSize: '14px', fontFamily: 'poppins, sans-serif', fontWeight: 600 }
          },
          labels: { style: { colors: "#8c9097", fontSize: '11px', fontWeight: 600 } }
        },
        colors: ['#6c5ffc'],
        tooltip: { y: { formatter: (val) => val + " teams" } }
      };

      teamsChartInstance.current = new ApexCharts(teamsChartRef.current, teamsOptions);
      teamsChartInstance.current.render();
    }
  }, [teamStats]);

  const handlePageChange = (page) => {
    setPagination({ ...pagination, page });
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  return (
    <>
      <style>
        {`
          .amazing-table-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .amazing-table-card .card-header {
            background: #6c5ffc;
            border-bottom: none;
            padding: 20px;
          }
          .amazing-table-card .card-title {
            color: #000000;
            font-size: 1.25rem;
            font-weight: 700;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .amazing-table {
            background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
            border-collapse: separate;
            border-spacing: 0 12px;
          }
          .amazing-table tr {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            animation: fadeIn 0.5s ease forwards;
          }
          .amazing-table tr:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
          }
          .amazing-table td {
            padding: 16px;
            vertical-align: middle;
            border: none;
          }
          .amazing-table .team-name {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            color: #2d3436;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
          }
          .amazing-table .team-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.5), 0 0 8px rgba(0, 0, 0, 0.2);
            transition: transform 0.2s ease;
          }
          .amazing-table .team-avatar:hover {
            transform: scale(1.1);
          }
          .amazing-table .members {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 0.9rem;
            color: #636e72;
          }
          .amazing-table .members-badge {
            background: #e9ecef;
            color: #495057;
            font-size: 0.8rem;
            padding: 4px 10px;
            border-radius: 12px;
            transition: transform 0.2s ease;
          }
          .amazing-table .members-badge:hover {
            transform: scale(1.05);
          }
          .amazing-table .description {
            max-width: 200px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #636e72;
            background: rgba(0, 0, 0, 0.02);
            padding: 6px 10px;
            border-radius: 8px;
          }
          .amazing-table .status-badge {
            padding: 6px 14px;
            border-radius: 16px;
            font-size: 0.85rem;
            font-weight: 500;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          }
          .amazing-table .status-badge.active {
            background: linear-gradient(135deg, #00e396 0%, #00b894 100%);
            color: #fff;
          }
          .amazing-table .status-badge.archived {
            background: #fd7e14;
            color: #fff;
          }
          .amazing-table .status-badge:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          /* Styles pour le calendrier */
          .amazing-calendar-container {
            padding: 20px;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            display: flex;
            justify-content: center;
            align-items: center;
          }
          .flatpickr-calendar {
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(108, 95, 252, 0.2);
            font-family: 'Poppins', sans-serif;
            width: 100%;
            max-width: 320px;
          }
          .flatpickr-day {
            border-radius: 8px;
            transition: all 0.2s ease;
            color: #2d3436;
            font-weight: 500;
          }
          .flatpickr-day:hover {
            background: #6c5ffc;
            color: #fff;
            transform: scale(1.1);
          }
          .flatpickr-day.today-highlight {
            background: #6c5ffc !important;
            color: #fff !important;
            box-shadow: 0 0 0 3px rgba(108, 95, 252, 0.3);
            transform: scale(1.1);
            font-weight: 700;
          }
          .flatpickr-day.selected {
            background: #00e396;
            color: #fff;
            border: none;
          }
          .flatpickr-month {
            background: #6c5ffc;
            color: #fff;
            border-radius: 12px 12px 0 0;
            padding: 10px;
          }
          .flatpickr-current-month {
            color: #fff;
            font-weight: 600;
            font-size: 1.1rem;
          }
          .flatpickr-weekdays {
            background: #f8f9fa;
            border-radius: 0;
          }
          .flatpickr-weekday {
            color: #2d3436;
            font-weight: 600;
            font-size: 0.9rem;
          }
          .numInputWrapper {
            display: none;
          }
          .flatpickr-prev-month,
          .flatpickr-next-month {
            color: #fff;
            font-size: 1.2rem;
            padding: 8px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.2);
          }
          .flatpickr-prev-month:hover,
          .flatpickr-next-month:hover {
            background: rgba(255, 255, 255, 0.4);
          }
          @keyframes calendarFadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .flatpickr-calendar {
            animation: calendarFadeIn 0.5s ease forwards;
          }
        `}
      </style>

      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
        <div>
          <ol className="breadcrumb mb-1">
            <li className="breadcrumb-item">
              <a href="javascript:void(0);">Dashboards</a>
            </li>
            <span className="mx-1">→</span>
            <li className="breadcrumb-item active" aria-current="page">
               Teams
            </li>
          </ol>
          <h1 className="page-title fw-medium fs-18 mb-0">Teams Dashboard</h1>
        </div>

      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="row g-3">
            {/* Nombre de projets (depuis /teams/nbrProject) */}
            <div className="col-xxl col-xl col-lg-3 col-md-6 col-sm-6">
              <div className="card custom-card overflow-hidden main-content-card">
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2 gap-1 flex-xxl-nowrap flex-wrap">
                    <div>
                      <span className="text-muted d-block mb-1 text-nowrap">
                        Projects
                      </span>
                      <h4 className="fw-medium mb-0">{nbrProjects}</h4>
                    </div>
                    <div className="lh-1">
                      <span className="avatar avatar-md avatar-rounded bg-primary">
                        <i className="ri-folder-line fs-5" />
                      </span>
                    </div>
                  </div>
                 
                </div>
              </div>
            </div>

            {/* Total Teams */}
            <div className="col-xxl col-xl col-lg-3 col-md-6 col-sm-6">
              <div className="card custom-card overflow-hidden main-content-card">
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2 gap-1 flex-xxl-nowrap flex-wrap">
                    <div>
                      <span className="text-muted d-block mb-1 text-nowrap">
                        Total Teams
                      </span>
                      <h4 className="fw-medium mb-0">{teamStats.totalTeams}</h4>
                    </div>
                    <div className="lh-1">
                      <span className="avatar avatar-md avatar-rounded bg-primary1">
                        <i className="ri-time-line fs-5" />
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Total Members */}
            <div className="col-xxl col-xl col-lg-3 col-md-6 col-sm-6">
              <div className="card custom-card overflow-hidden main-content-card">
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2 gap-1 flex-xxl-nowrap flex-wrap">
                    <div>
                      <span className="text-muted d-block mb-1 text-nowrap">
                        Total Members
                      </span>
                      <h4 className="fw-medium mb-0">{pagination.total}</h4>
                    </div>
                    <div className="lh-1">
                      <span className="avatar avatar-md avatar-rounded bg-primary2">
                        <i className="ri-refresh-line fs-5" />
                      </span>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <div className="row">
        {/* Left Column - All Teams Table */}
        <div className="col-xl-8">
          <div className="card custom-card amazing-table-card">
            <div className="card-header">
              <div className="card-title">All Teams</div>
            </div>
            <div className="card-body p-4">
              <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <Table className="amazing-table">
                  <tbody>
                    {teams.map((team, index) => (
                      <tr key={team._id} style={{ animationDelay: `${index * 0.1}s` }}>
                        <td>
                          <div className="team-name">
                            <span
                              className="team-avatar"
                              style={{ backgroundColor: team.color || '#6c5ffc' }}
                            ></span>
                            {team.name}
                          </div>
                        </td>
                        <td>
                          <div className="members">
                            <i className="ri-user-line fs-16 text-muted"></i>
                            <span className="members-badge">
                              {team.members.length > 0
                                ? `${team.members.length} Member${team.members.length > 1 ? 's' : ''}`
                                : 'No Members'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="description" title={team.description || 'No Description'}>
                            {team.description || 'No Description'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-badge ${team.status === 'Active' ? 'active' : 'archived'}`}
                          >
                            {team.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Calendar */}
        <div className="col-xl-4">
          {/* Teams Distribution by Project Card */}
          <div className="card custom-card">
            <div className="card-header justify-content-between">
            </div>

              <div ref={teamsChartRef} id="teams-chart"></div>

          </div>

          {/* Team Members Table Card */}
          <div className="card custom-card mt-3">
            <div className="card-header justify-content-between">
              <div className="card-title">Team Members</div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                <Table hover striped bordered className="table-sm mb-0">
                  <thead>
                    <tr>
                      <th scope="col" className="text-center">Member</th>
                      <th scope="col" className="text-center">Role</th>
                      <th scope="col" className="text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(member => (
                      <tr key={member._id}>
                        <td className="text-nowrap">
                          <div className="d-flex align-items-center">
                            <div className="me-2">
                              {member.image ? (
                                <img
                                  src={`https://lavoro-back.onrender.com/${member.image}`}
                                  alt="user"
                                  className="avatar avatar-xs rounded-circle"
                                />
                              ) : (
                                <span className="avatar avatar-xs bg-light rounded-circle">
                                  {member.firstName?.charAt(0)}
                                  {member.lastName?.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="mb-0 fw-medium">
                                {member.firstName} {member.lastName}
                              </p>
                              <span className="text-muted fs-11">{member.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">
                          <span className="badge bg-info text-white">
                            {member.role?.RoleName}
                          </span>
                        </td>
                        <td className="text-center">
                          <span
                            className={`badge ${
                              member.status === 'active'
                                ? 'bg-success text-white'
                                : 'bg-warning text-dark'
                            }`}
                          >
                            {member.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
            <div className="card-footer">
              <Pagination className="justify-content-center">
                <Pagination.Prev
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                />
                {[...Array(pagination.pages)].map((_, idx) => (
                  <Pagination.Item
                    key={idx + 1}
                    active={idx + 1 === pagination.page}
                    onClick={() => handlePageChange(idx + 1)}
                  >
                    {idx + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={pagination.page === pagination.pages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                />
              </Pagination>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}