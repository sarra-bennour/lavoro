import React, { useState, useEffect ,useRef} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';

export default function ArchiveOverview() {
  const { id } = useParams(); // Get the project ID from the URL
  const [archive, setArchive] = useState(null); // State for archive details
  const [history, setHistory] = useState([]); // State for project history
  const [loading, setLoading] = useState(true); // State for loading status
    const [manager, setManager] = useState(null); // State for manager details
  const [archivedProjects, setArchivedProjects] = useState([]);
  const navigate = useNavigate();
    const [projectManager, setProjectManager] = useState(null); // State for manager details



  const [currentPage, setCurrentPage] = useState(1); // Current page
    const [itemsPerPage] = useState(7); // Number of items per page


    // Calculate the index of the first and last item on the current page
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHistory = history.slice(indexOfFirstItem, indexOfLastItem);


  // Calculate the total number of pages
  const totalPages = Math.ceil(history.length / itemsPerPage);

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };


// Helper function to draw colored rectangles
const drawColoredSection = (pdf, x, y, width, height, color) => {
  pdf.setFillColor(...color)
  pdf.rect(x, y, width, height, "F")
}

// Helper function to draw circles
const drawCircle = (pdf, x, y, radius, color) => {
  pdf.setFillColor(...color)
  pdf.circle(x, y, radius, "F")
}



const handleDownloadPDF = () => {
  // Create a new PDF document
  const pdf = new jsPDF("p", "mm", "a4")
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15

  // Define colors
  const colors = {
    coral: [242, 132, 130], // Coral/pink color
    mint: [142, 187, 164], // Mint green color
    lightGray: [245, 245, 245], // Background for sections
    textColor: [80, 80, 80], // Dark gray for text
  }

  // Set default font
  pdf.setFont("helvetica", "normal")

  // Add title with gradient-like effect
  pdf.setFontSize(24)
  pdf.setTextColor(242, 132, 130) // Coral color
  pdf.text("ARCHIVED", pageWidth / 2 - 45, 20, { align: "left" })
  pdf.setTextColor(142, 187, 164) // Mint color
  pdf.text("PROJECT", pageWidth / 2, 20, { align: "left" })
  pdf.setTextColor(242, 132, 130) // Coral color
  pdf.text("DETAILS", pageWidth / 2 + 40, 20, { align: "left" })

  // Project header section
  drawColoredSection(pdf, margin, 30, pageWidth - 2 * margin, 15, colors.mint)
  pdf.setFontSize(14)
  pdf.setTextColor(255, 255, 255)
  pdf.text(`PROJECT: ${archive.name}`, margin + 5, 40)

  // Project overview section
  drawColoredSection(pdf, margin, 50, pageWidth - 2 * margin - 80, 60, colors.lightGray)
  pdf.setFontSize(12)
  pdf.setTextColor(...colors.textColor)
  pdf.text("PROJECT OVERVIEW:", margin + 5, 60)

  // Split description into lines to fit the box
  const descriptionLines = pdf.splitTextToSize(archive.description, pageWidth - 2 * margin - 90)
  pdf.text(descriptionLines, margin + 5, 70)

  // Dates section
  drawColoredSection(pdf, pageWidth - margin - 75, 50, 75, 60, colors.lightGray)
  pdf.text("START DATE:", pageWidth - margin - 70, 60)
  pdf.text(new Date(archive.start_date).toLocaleDateString(), pageWidth - margin - 70, 70)
  pdf.text("END DATE:", pageWidth - margin - 70, 85)
  pdf.text(new Date(archive.end_date).toLocaleDateString(), pageWidth - margin - 70, 95)

  // PROJECT DETAILS SECTION (MINT COLOR)
  drawColoredSection(pdf, margin, 120, (pageWidth - 2 * margin), 50, colors.coral)
  pdf.setFontSize(12)
  pdf.setTextColor(255, 255, 255)

  const managerName = manager && manager.firstName && manager.lastName
    ? `${manager.firstName} ${manager.lastName}`
    : "Manager not assigned"

  pdf.text(`Status: ${archive.originalStatus}`, margin + 10, 132)
  pdf.text(`Manager: ${managerName}`, margin + 10, 142)
  pdf.text(`Budget: ${archive.budget}`, margin + 10, 152)
  pdf.text(`Risk Level: ${archive.risk_level}`, margin + 10, 162)


  // TAGS SECTION (CORAL/PINK COLOR) - Placed below project details
  drawColoredSection(pdf, margin, 180, (pageWidth - 2 * margin), 40, colors.mint)
  pdf.setFontSize(12)
  pdf.setTextColor(255, 255, 255)
  pdf.text("TAGS", margin + 5, 189)

  const tags = archive.tags ? archive.tags.split(",").map((tag) => tag.trim()) : []
  tags.forEach((tag, index) => {
    const yPos = 200 + index * 10
    drawCircle(pdf, margin + 10, yPos - 3, 3, [255, 255, 255])
    pdf.text(tag, margin + 18, yPos)
  })

      // Add a new page for history
      pdf.addPage()

      // History title
      drawColoredSection(pdf, margin, 20, pageWidth - 2 * margin, 15, colors.mint)
      pdf.setFontSize(14)
      pdf.setTextColor(255, 255, 255)
      pdf.text("KEY TASKS", margin + 5, 30)
  const tasks = [
    "Design dashboard interface",
    "Integrate data sources and APIs",
    "Develop data visualizations",
    "Implement filters and sorting",
    "Create user authentication",
    "Perform usability testing",
  ]

  tasks.forEach((task, index) => {
    const yPos = 50 + index * 20
    drawCircle(pdf, margin + 10, yPos - 3, 3, colors.mint)
    pdf.text(`${index + 1}. ${task}`, margin + 18, yPos)
  })

  // Add a new page for history
  pdf.addPage()

  // History title
  drawColoredSection(pdf, margin, 20, pageWidth - 2 * margin, 15, colors.coral)
  pdf.setFontSize(14)
  pdf.setTextColor(255, 255, 255)
  pdf.text("PROJECT HISTORY", margin + 5, 30)

  // Add history items
  pdf.setTextColor(...colors.textColor)
  history.forEach((entry, index) => {
    const yPosition = 50 + index * 20

    if (yPosition > pageHeight - 30) {
      pdf.addPage()
      drawColoredSection(pdf, margin, 20, pageWidth - 2 * margin, 15, colors.coral)
      pdf.setFontSize(14)
      pdf.setTextColor(255, 255, 255)
      pdf.text("PROJECT HISTORY (CONTINUED)", margin + 5, 30)
      pdf.setTextColor(...colors.textColor)
      return
    }

    drawCircle(pdf, margin + 5, yPosition - 3, 3, colors.coral)
    pdf.setFontSize(11)
    pdf.setFont("helvetica", "bold")
    pdf.text(`${entry.change_type}`, margin + 15, yPosition)

    const dateStr = new Date(entry.changed_at).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

    pdf.setFont("helvetica", "normal")
    pdf.text(dateStr, pageWidth - margin - 50, yPosition)

    if (entry.change_type === "Project Created") {
      pdf.text(`Project ${entry.new_value}`, margin + 15, yPosition + 7)
    } else {
      pdf.text(`Changed from ${entry.old_value} to ${entry.new_value}`, margin + 15, yPosition + 7)
    }
  })

  pdf.save(`${archive.name}_Project_Details.pdf`);
}




  const handleDelete = async (projectId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action will permanently delete the archived project!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`https://lavoro-back.onrender.com/project/archived-projects/${projectId}`, {
            method: 'DELETE',
          });

          const data = await response.json();

          if (response.ok) {
            Swal.fire('Deleted!', data.message, 'success').then(() => {
              navigate('/archieve');
            });
          } else {
            Swal.fire('Error!', data.message || 'Failed to delete the archived project.', 'error');
          }
        } catch (error) {
          console.error('Error deleting archived project:', error);
          Swal.fire('Error!', 'An error occurred while deleting the archived project.', 'error');
        }
      }
    });
  };







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
          })
          .then((result) => {
            if (result.isConfirmed) {
              // Redirect to the projects list page after the user clicks "OK"
              navigate('/archieve'); // Replace '/listPro' with your actual projects list page route
            }
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


  // Fetch archive details
  const fetchArchiveDetails = async () => {
    try {
      const response = await fetch(`https://lavoro-back.onrender.com/project/archived-projects/${id}`);
      const data = await response.json();
      if (response.ok) {
        setArchive(data); // Set archive details
        if (data.manager_id) {
          console.log('Manager Data:', data.manager_id); // Log the manager object
          setManager(data.manager_id); // Set manager details
        }

        if (data.ProjectManager_id) {
          console.log('Project manager Data:', data.ProjectManager_id); // Log the manager object
          setProjectManager(data.ProjectManager_id); // Set manager details
        }

      } else {
        Swal.fire('Error!', data.message || 'Failed to fetch archive details.', 'error');
      }
    } catch (error) {
      console.error('Error fetching archive details:', error);
      Swal.fire('Error!', 'An error occurred while fetching archive details.', 'error');
    }
  };

  // Fetch project history
  const fetchProjectHistory = async () => {
    try {
      const response = await fetch(`https://lavoro-back.onrender.com/project/${id}/history`);
      const data = await response.json();
      if (response.ok) {
        setHistory(data); // Set project history
      } else {
        Swal.fire('Error!', data.message || 'Failed to fetch project history.', 'error');
      }
    } catch (error) {
      console.error('Error fetching project history:', error);
      Swal.fire('Error!', 'An error occurred while fetching project history.', 'error');
    }
  };

  // Fetch data when the component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await fetchArchiveDetails(); // Fetch archive details
        await fetchProjectHistory(); // Fetch project history
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Display loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  // Display error if archive is not found
  if (!archive) {
    return <div>Archive not found.</div>;
  }

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
              <li className="breadcrumb-item">
                <a href="/archieve" >
                  Projects Archive
                </a>
              </li>
              <span className="mx-1">→</span>
              <li className="breadcrumb-item active" aria-current="page">
                Archived Project Overview
              </li>
            </ol>
          </nav>
          <br />
          <h1 className="page-title fw-medium fs-18 mb-0">Archived Project Overview</h1>
        </div>
        <div className="btn-list">
          <button className="btn btn-primary btn-wave me-0" onClick={handleDownloadPDF}>
        <i className="ri-file-pdf-2-line me-1" /> PDF
          </button>
        </div>
      </div>

      <div className="row">
        <div className="col-xxl-8">
          <div className="card custom-card">
            <div className="card-header justify-content-between">
              <div className="card-title">Archived Project Details</div>

              <div className="d-flex gap-1">
              <a
  className="btn btn-sm btn-primary btn-wave"
  onClick={() => handleDelete(archive._id)}
>    Delete
  </a>

  <a className="btn btn-sm btn-primary1 btn-wave" onClick={() => handleUnarchive(archive._id)}
                >
                  Unarchive
                </a>
</div>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-4 gap-2 flex-wrap">
                <span className="avatar avatar-lg me-1 bg-primary-gradient">
                  <i className="ri-stack-line fs-24 lh-1" />
                </span>
                <div>
                  <h6 className="fw-medium mb-2 task-title">{archive.name}</h6>
                  <span className="badge bg-info-transparent">
                    {archive.status}
                  </span>
                  <span className="text-muted fs-12">
                    <i className="ri-circle-fill text-success mx-2 fs-9" />
                    Last Updated: {new Date(archive.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="fs-15 fw-medium mb-2">Project Description:</div>
              <p className="text-muted mb-4">{archive.description}</p>

              <div className="d-flex gap-5 mb-4 flex-wrap">
              <div className="d-flex align-items-center gap-2 me-3">
                  <span className="avatar avatar-md avatar-rounded me-1 bg-primary2-transparent">
                    <i className="ri-user-3-line fs-18 lh-1 align-middle" />
                  </span>
                  <div>
                    <span className="d-block fs-14 fw-medium">Project Manager</span>
                    <span className="fs-12 text-muted">
                      {projectManager && projectManager.firstName && projectManager.lastName
                        ? `${projectManager.firstName} ${projectManager.lastName}`
                        : 'projectManager not assigned'}
                    </span>
                  </div>
                </div>
                               <div className="d-flex align-items-center gap-2 me-3">
                  <span className="avatar avatar-md avatar-rounded me-1 bg-primary1-transparent">
                    <i className="ri-calendar-event-line fs-18 lh-1 align-middle" />
                  </span>
                  <div>
                    <div className="fw-medium mb-0 task-title">Start Date</div>
                    <span className="fs-12 text-muted">{new Date(archive.start_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2 me-3">
                  <span className="avatar avatar-md avatar-rounded me-1 bg-primary2-transparent">
                    <i className="ri-time-line fs-18 lh-1 align-middle" />
                  </span>
                  <div>
                    <div className="fw-medium mb-0 task-title">End Date</div>
                    <span className="fs-12 text-muted">{new Date(archive.end_date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 me-3">
                    <span className="avatar avatar-md avatar-rounded me-1 bg-primary1-transparent">
                      <i className="ri-money-dollar-circle-line fs-18 lh-1 align-middle" />
                    </span>
                    <div>
                      <div className="fw-medium mb-0 task-title">
                        Budget
                      </div>
                      <span className="fs-12 text-muted">{archive.budget} </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2 me-3">
                    <span className="avatar avatar-md avatar-rounded me-1 bg-primary2-transparent">
                      <i className="ri-user-3-line fs-18 lh-1 align-middle" />

                    </span>

  <div>
    <span className="d-block fs-14 fw-medium">
    Team Manager
    </span>
    <span className="fs-12 text-muted">
    {manager && manager.firstName && manager.lastName
        ? `${manager.firstName} ${manager.lastName}`
        : 'Manager not assigned'}
       </span>
  </div>
  </div>
                </div>
                <div className="mb-4">
  <div className="row">
    <div className="col-xl-6">
      <div className="fs-15 fw-medium mb-2">Key tasks :</div>
      <ul className="task-details-key-tasks mb-0">
        {archive?.tasks?.length > 0 ? (
          archive.tasks.map((task) => (
            <li key={task._id} className="d-flex align-items-center">
              <i className="ri-check-line fs-15 text-success me-2" />
              <span className="text-muted">{task.title}</span>
            </li>
          ))
        ) : (
          <div className="text-muted">No tasks yet</div>
        )}
      </ul>
    </div>
         <div className="col-xl-6">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="fs-15 fw-medium">Risks :</div>
                      <a
                        href="javascript:void(0);"
                        className="btn btn-primary-light btn-wave btn-sm waves-effect waves-light"
                      >
                        {archive.risk_level}
                      </a>
                    </div>
                    <ul className="list-group">
                      {(() => {
                        try {
                          const risksText = archive.risks || '';
                          if (risksText.includes('\n')) {
                            return risksText.split('\n')
                              .filter(line => line.trim().length > 0)
                              .map((risk, index) => (
                                <li key={index} className="list-group-item">
                                  <div className="d-flex align-items-center">
                                    <div className="me-2">
                                      <i className="ri-alert-line fs-15 text-danger" />
                                    </div>
                                    <div>{risk.trim()}</div>
                                  </div>
                                </li>
                              ));
                          }
                          const numberedItems = risksText.split(/\d+\.\s+/).filter(x => x.trim());
                          if (numberedItems.length > 1) {
                            return numberedItems.map((risk, index) => (
                              <li key={index} className="list-group-item">
                                <div className="d-flex align-items-center">
                                  <div className="me-2">
                                    <i className="ri-alert-line fs-15 text-danger" />
                                  </div>
                                  <div>{risk.trim()}</div>
                                </div>
                              </li>
                            ));
                          }
                          return (
                            <li className="list-group-item">
                              <div className="d-flex align-items-center">
                                <div className="me-2">
                                  <i className="ri-alert-line fs-15 text-danger" />
                                </div>
                                <div>{risksText || 'No risks identified'}</div>
                              </div>
                            </li>
                          );
                        } catch (error) {
                          console.error('Error parsing risks:', error);
                          return (
                            <li className="list-group-item text-muted">
                              Error displaying risks
                            </li>
                          );
                        }
                      })()}
                    </ul>
                  </div>
                </div>
              </div>
                <div className="fs-15 fw-medium mb-2">Tags :</div>
                <div className="d-flex gap-2 flex-wrap">
                {archive.tags ? archive.tags.split(',').map((tag, index) => (
              <span key={index} className="badge bg-light text-default border">
                {tag.trim()}
              </span>
            )) : <span className="badge bg-light text-default border">No tags</span>}


                </div>
              </div>


            </div>
            <div className="card custom-card overflow-hidden">

            </div>
          </div>

        {/* Project History */}
       <div className="col-xxl-4">
  <div className="card custom-card justify-content-between">
    <div className="card-header pb-0">
      <div className="card-title">Project History</div>
    </div>
    <div className="card-body">
      <ul className="list-unstyled profile-timeline">
        {currentHistory.length > 0 ? (
          currentHistory.map((entry, index) => (
            <li key={index}>
              <div>
                <span className="avatar avatar-sm shadow-sm bg-primary avatar-rounded profile-timeline-avatar">
                  {entry.change_type.charAt(0)}
                </span>
                <div className="mb-2 d-flex align-items-start gap-2">
                  <div>
                    <span className="fw-medium">{entry.change_type}</span>
                  </div>
                  <span className="ms-auto bg-light text-muted badge">
                    {new Date(entry.changed_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {entry.change_type === 'Project Created' ? (
                  <p className="text-muted mb-0">
                    Project <b>{entry.new_value}</b>
                  </p>
                ) : (
                  <p className="text-muted mb-0">
                    Changed from <b>{entry.old_value}</b> to <b>{entry.new_value}</b>.
                  </p>
                )}
              </div>
            </li>
          ))
        ) : (
          <li>
            <div className="text-muted">No history available.</div>
          </li>
        )}
      </ul>
    </div>
    <div className="card-footer">
  <div className="d-flex justify-content-center align-items-center w-100">
    <div className="d-flex align-items-center gap-2">
      <button
        className="btn btn-primary-light btn-wave waves-effect waves-light"
        type="button"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <i className="ri-arrow-left-s-line"></i>
      </button>
      <span className="btn-primary-light mx-2">
        {currentPage} / {totalPages}
      </span>
      <button
        className="btn btn-primary-light btn-wave waves-effect waves-light"
        type="button"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <i className="ri-arrow-right-s-line"></i>
      </button>
    </div>
  </div>
</div>
  </div>
</div>
 </div>

  </>
  );
}