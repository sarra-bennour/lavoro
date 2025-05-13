import React, { useEffect, useState, useRef } from 'react';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import ApexCharts from 'apexcharts';
import 'apexcharts/dist/apexcharts.css';
import axios from 'axios';

export default function Sales() {
  const [projectCount, setProjectCount] = useState(0);
  const [projects, setProjects] = useState([]);
  const [projectsByStatus, setProjectsByStatus] = useState({
    'Not Started': 0,
    'In Progress': 0,
    'Completed': 0,
    'Archived': 0
  });

  const [loading, setLoading] = useState(true);
  const [archiveCount, setArchiveCount] = useState(0);

  // Refs for chart containers
  const projectsPerMonthChartRef = useRef(null);
  const projectsByStatusChartRef = useRef(null);

  // Refs for chart instances
  const projectsPerMonthChartInstance = useRef(null);
  const projectsByStatusChartInstance = useRef(null);

  useEffect(() => {
    // Fetch project count
    const fetchProjectCount = async () => {
      try {
        const response = await axios.get("https://lavoro-back.onrender.com/project/countProject");
        setProjectCount(response.data.count);
      } catch (error) {
        console.error("Error fetching project count:", error);
      }
    };

    const fetchArchiveCount = async () => {
      try {
        const response = await axios.get("https://lavoro-back.onrender.com/project/countArchive");
        setArchiveCount(response.data.count);
      } catch (error) {
        console.error("Error fetching archive count:", error);
      }
    };

    // Fetch all projects
    const fetchProjects = async () => {
      try {
        const response = await axios.get("https://lavoro-back.onrender.com/project/dash");
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    // Fetch projects by status
    const fetchProjectsByStatus = async () => {
      try {
        const response = await axios.get("https://lavoro-back.onrender.com/project/projetStatus");
        setProjectsByStatus(response.data);
      } catch (error) {
        console.error("Error fetching projects by status:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectCount();
    fetchProjects();
    fetchProjectsByStatus();
    fetchArchiveCount();

    // Initialize flatpickr
    flatpickr("#daterange", {
      enableTime: true,
      dateFormat: "Y-m-d H:i",
    });

    // Cleanup function
    return () => {
      if (projectsPerMonthChartInstance.current) {
        projectsPerMonthChartInstance.current.destroy();
      }
      if (projectsByStatusChartInstance.current) {
        projectsByStatusChartInstance.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (projects.length === 0 || Object.keys(projectsByStatus).length === 0) return;
    if (!projectsPerMonthChartRef.current || !projectsByStatusChartRef.current) return;

    // Calculate projects per month - for both started and completed
    const getProjectsByMonth = () => {
      const projectsByStartMonth = Array(12).fill(0);
      const projectsByEndMonth = Array(12).fill(0);

      projects.forEach(project => {
        if (project.start_date) {
          const startDate = new Date(project.start_date);
          const startMonth = startDate.getMonth();
          projectsByStartMonth[startMonth]++;
        }

        if (project.end_date) {
          const endDate = new Date(project.end_date);
          const endMonth = endDate.getMonth();
          projectsByEndMonth[endMonth]++;
        }
      });

      return { projectsByStartMonth, projectsByEndMonth };
    };

    const { projectsByStartMonth, projectsByEndMonth } = getProjectsByMonth();

    // Destroy existing charts if they exist
    if (projectsPerMonthChartInstance.current) {
      projectsPerMonthChartInstance.current.destroy();
    }
    if (projectsByStatusChartInstance.current) {
      projectsByStatusChartInstance.current.destroy();
    }

    // Projects per month chart - combination of column and line
const projectsPerMonthOptions = {
    series: [
      {
        name: 'Projects Completed',
        type: "column",
        data: projectsByEndMonth
      },
      {
        name: 'Projects Created',
        type: "line",
        data: projectsByStartMonth
      }
    ],
    chart: {
      height: 315,
      type: 'line',
      toolbar: {
        show: false
      },
      dropShadow: {
        enabled: true,
        enabledOnSeries: [1],
        top: 7,
        left: 0,
        blur: 1,
        color: 'rgb(227, 84, 212)',
        opacity: 0.05,
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '18%',
        borderRadius: 2
      },
    },
    grid: {
      borderColor: '#f1f1f1',
      strokeDashArray: 3
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: [0, 2],
      curve: "smooth",
    },
    legend: {
      show: true,
      fontSize: "12px",
      position: 'bottom',
      horizontalAlign: 'center',
      fontWeight: 500,
      height: 40,
      offsetX: 0,
      offsetY: 10,
      labels: {
        colors: '#9ba5b7',
      },
      markers: {
        width: 7,
        height: 7,
        shape: "circle",
        size: 3.5,
        strokeWidth: 0,
        strokeColor: '#fff',
        fillColors: undefined,
        radius: 12,
        offsetX: 0,
        offsetY: 0
      },
    },
    colors: ['var(--primary-color)', 'rgb(227, 84, 212)'], // Blue for columns, pink for line
    yaxis: {
      title: {
        text: 'Number of Projects',
        style: {
          color: '#adb5be',
          fontSize: '14px',
          fontFamily: 'poppins, sans-serif',
          fontWeight: 600,
          cssClass: 'apexcharts-yaxis-label',
        },
      },
      labels: {
        formatter: function (y) {
          return y.toFixed(0) + "";
        },
        show: true,
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-xaxis-label',
        },
      }
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      axisBorder: {
        show: true,
        color: 'rgba(119, 119, 142, 0.05)',
        offsetX: 0,
        offsetY: 0,
      },
      axisTicks: {
        show: true,
        borderType: 'solid',
        color: 'rgba(119, 119, 142, 0.05)',
        width: 6,
        offsetX: 0,
        offsetY: 0
      },
      labels: {
        style: {
          colors: "#8c9097",
          fontSize: '11px',
          fontWeight: 600,
          cssClass: 'apexcharts-xaxis-label',
        },
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: function (y) {
          if (typeof y !== "undefined") {
            return y + " projects";
          }
          return y;
        },
      },
    },
    fill: {
      opacity: 1
    }
  };
    projectsPerMonthChartInstance.current = new ApexCharts(
      projectsPerMonthChartRef.current,
      projectsPerMonthOptions
    );
    projectsPerMonthChartInstance.current.render();

    // Projects by status chart
    const statusCounts = {
      'Not Started': projectsByStatus['Not Started'] || 0,
      'In Progress': projectsByStatus['In Progress'] || 0,
      'Completed': projectsByStatus['Completed'] || 0,
      'Archived': projectsByStatus['Archived'] || archiveCount || 0  // Include Archived status

    };

    const projectsByStatusOptions = {
        series: Object.values(statusCounts),
        labels: Object.keys(statusCounts),
        chart: {
          height: 300,
          type: 'donut',
        },
        dataLabels: {
          enabled: false,
        },
        legend: {
          show: true,
          position: 'bottom',
          horizontalAlign: 'center',
          height: 52,
          markers: {
            width: 8,
            height: 8,
            radius: 2,
            shape: "circle",
            size: 4,
            strokeWidth: 0
          },
          offsetY: 10,
        },
        stroke: {
          show: true,    // Disable stroke completely
          width: 0,       // Set width to 0
          color: '#0000' // Make stroke colors transparent
        },
        plotOptions: {
          pie: {
            startAngle: -90,
            endAngle: 90,
            offsetY: 10,
            expandOnClick: false,
            donut: {
              size: '80%',
              background: 'transparent',
              labels: {
                show: true,
                name: {
                  show: true,
                  fontSize: '20px',
                  color: '#495057',
                  offsetY: -25
                },
                value: {
                  show: true,
                  fontSize: '15px',
                  color: undefined,
                  offsetY: -20,
                  formatter: function (val) {
                    return val + ""
                  }
                },
                total: {
                  show: true,
                  showAlways: true,
                  label: 'Total',
                  fontSize: '22px',
                  fontWeight: 600,
                  color: '#495057',
                  formatter: function (w) {
                    return w.globals.seriesTotals.reduce((a, b) => a + b, 0)
                  }
                }
              }
            }
          }
        },
        grid: {
          padding: {
            bottom: -100
          }
        },
        colors: ["var(--primary-color)", "rgba(227, 84, 212, 1)", "rgba(255, 93, 159, 1)", "rgba(255, 142, 111, 1)"],
        tooltip: {
          enabled: true,
          y: {
            formatter: function(value) {
              return value + ' projects (' + Math.round(value / projectCount * 100) + '%)';
            }
          }
        }
      };


    projectsByStatusChartInstance.current = new ApexCharts(
      projectsByStatusChartRef.current,
      projectsByStatusOptions
    );
    projectsByStatusChartInstance.current.render();

  }, [projects, projectsByStatus, projectCount]);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <div className="d-flex align-items-center justify-content-between page-header-breadcrumb flex-wrap gap-2">
        <div>
          <ol className="breadcrumb mb-1">
            <li className="breadcrumb-item">
              <a href="javascript:void(0);">Dashboards</a>
            </li>
            <span className="mx-1">→</span>
            <li className="breadcrumb-item active" aria-current="page">
              Projects
            </li>
          </ol>
          <h1 className="page-title fw-medium fs-18 mb-0">Projects Dashboard</h1>
        </div>

      </div>

      <div className="row">
        <div className="col-xl-12">
          <div className="row g-3">
            {/* Total Projects */}
            <div className="col-xxl col-xl col-lg-3 col-md-6 col-sm-6">
              <div className="card custom-card overflow-hidden main-content-card">
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2 gap-1 flex-xxl-nowrap flex-wrap">
                    <div>
                      <span className="text-muted d-block mb-1 text-nowrap">
                        Total Projects
                      </span>
                      <h4 className="fw-medium mb-0">{projectCount}</h4>
                    </div>
                    <div className="lh-1">
                      <span className="avatar avatar-md avatar-rounded bg-primary">
                        <i className="ri-stack-line fs-5" />
                      </span>
                    </div>
                  </div>
                  <div className="text-muted fs-13">
                    Increased By{" "}
                    <span className="text-success">
                      2.56%
                      <i className="ri-arrow-up-line fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Not Started */}
            <div className="col-xxl col-xl col-lg-3 col-md-6 col-sm-6">
              <div className="card custom-card overflow-hidden main-content-card">
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2 gap-1 flex-xxl-nowrap flex-wrap">
                    <div>
                      <span className="text-muted d-block mb-1 text-nowrap">
                        Not Started
                      </span>
                      <h4 className="fw-medium mb-0">{projectsByStatus['Not Started'] || 0}</h4>
                    </div>
                    <div className="lh-1">
                      <span className="avatar avatar-md avatar-rounded bg-primary1">
                        <i className="ri-time-line fs-5" />
                      </span>
                    </div>
                  </div>
                  <div className="text-muted fs-13">
                    Increased By{" "}
                    <span className="text-success">
                      0.34%
                      <i className="ri-arrow-up-line fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* In Progress */}
            <div className="col-xxl col-xl col-lg-3 col-md-6 col-sm-6">
              <div className="card custom-card overflow-hidden main-content-card">
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2 gap-1 flex-xxl-nowrap flex-wrap">
                    <div>
                      <span className="text-muted d-block mb-1 text-nowrap">
                        In Progress
                      </span>
                      <h4 className="fw-medium mb-0">{projectsByStatus['In Progress'] || 0}</h4>
                    </div>
                    <div className="lh-1">
                      <span className="avatar avatar-md avatar-rounded bg-primary2">
                        <i className="ri-refresh-line fs-5" />
                      </span>
                    </div>
                  </div>
                  <div className="text-muted fs-13">
                    Increased By{" "}
                    <span className="text-success">
                      7.66%
                      <i className="ri-arrow-up-line fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed */}
            <div className="col-xxl col-xl col-lg-3 col-md-6 col-sm-6">
              <div className="card custom-card overflow-hidden main-content-card">
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2 gap-1 flex-xxl-nowrap flex-wrap">
                    <div>
                      <span className="text-muted d-block mb-1 text-nowrap">
                        Completed
                      </span>
                      <h4 className="fw-medium mb-0">{projectsByStatus['Completed'] || 0}</h4>
                    </div>
                    <div className="lh-1">
                      <span className="avatar avatar-md avatar-rounded bg-primary3">
                        <i className="ri-checkbox-circle-line fs-5" />
                      </span>
                    </div>
                  </div>
                  <div className="text-muted fs-13">
                    Decreased By{" "}
                    <span className="text-danger">
                      0.74%
                      <i className="ri-arrow-down-line fs-16" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Archived */}
            <div className="col-xxl col-xl col-lg-3 col-md-6 col-sm-6">
              <div className="card custom-card overflow-hidden main-content-card">
                <div className="card-body">
                  <div className="d-flex align-items-start justify-content-between mb-2 gap-1 flex-xxl-nowrap flex-wrap">
                    <div>
                      <span className="text-muted d-block mb-1 text-nowrap">
                        Archived
                      </span>
                      <h4 className="fw-medium mb-0">{projectsByStatus['Archived'] || archiveCount}</h4>
                    </div>
                    <div className="lh-1">
                      <span className="avatar avatar-md avatar-rounded bg-secondary">
                        <i className="ri-archive-line fs-5" />
                      </span>
                    </div>
                  </div>
                  <div className="text-muted fs-13">
                    <span className="text-muted">Archived projects</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="col-xl-8">
          <div className="row">
            <div className="col-xxl-12 col-xl-12">
              <div className="card custom-card">
                <div className="card-header justify-content-between">
                  <div className="card-title">Number of project per month</div>

                </div>
                <div className="card-body">
                  <div ref={projectsPerMonthChartRef} id="projects-per-month" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4">
          <div className="card custom-card overflow-hidden">
            <div className="card-header pb-0 justify-content-between">
              <div className="card-title">Project Status Distribution</div>
            </div>
            <div className="card-body py-4 px-3">
              <div ref={projectsByStatusChartRef} id="projects-by-status" className="my-2" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}