import { useState } from "react";
import { Link } from "react-router-dom";

const Sidebar = ({ userRole }) => {
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isPagesOpen, setIsPagesOpen] = useState(false);
  const [isProjectsMenuOpen, setIsProjectsMenuOpen] = useState(false);
  const [isPagesOpenTask, setIsPagesOpenTask] = useState(false);


  const getMenuItems = () => {
    switch(userRole) {
      case 'Developer':
        return (
          <>
            <li className="slide__category">
              <span className="category-name">Main</span>
            </li>
            <li className="slide">
              <Link to="/developer-dashboard" className="side-menu__item">
                <i className="ri-user-line side-menu__icon"></i>
                <span className="side-menu__label">Dashboard</span>
              </Link>
            </li>
            <li className="slide">
              <Link to="/profile" className="side-menu__item">
                <i className="ri-user-line side-menu__icon"></i>
                <span className="side-menu__label">Profile</span>
              </Link>
            </li>
            

            <li className={`slide has-sub ${isPagesOpen ? "open" : ""}`}>
            <li className="slide__category">
              <span className="category-name">Tasks</span>
            </li>
              <button
                className="side-menu__item"
                onClick={() => setIsPagesOpen(!isPagesOpen)}
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
              >
                <i className="ri-arrow-down-s-line side-menu__angle"></i>
                <i className="ri-list-check-3 side-menu__icon"></i>
                <span className="side-menu__label">Tasks</span>
              </button>
              <ul className="slide-menu child1" style={{ display: isPagesOpen ? "block" : "none" }}>

                <li className="slide">
                  <Link to="/mytasks" className="side-menu__item">
                  My Tasks
                  </Link>
                </li>
                <li className="slide">
                  <Link to="/developer-kanban" className="side-menu__item">
                  Kanban Board
                  </Link>
                </li>
                <li className="slide">
                  <Link to="/meet" className="side-menu__item">
                   Meet
                  </Link>
                </li>


                

             </ul>
            </li>
            <li className="slide__category">
              <span className="category-name">Communication</span>
            </li>
            <li className="slide">
              <Link to="/chat" className="side-menu__item">
                <i className="ri-message-3-line side-menu__icon"></i>
                <span className="side-menu__label">Chat</span>
              </Link>
            </li>
          </>
        );

      case 'Project Manager':
        return (
          <>
            <li className="slide__category">
              <span className="category-name">Main</span>
            </li>
            <li className={`slide has-sub ${isPagesOpen ? "open" : ""}`}>
              <button
                className="side-menu__item"
                onClick={() => setIsPagesOpen(!isPagesOpen)}
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
              >
                <i className="ri-arrow-down-s-line side-menu__angle"></i>
                <i className="ri-home-line side-menu__icon"></i>
                <span className="side-menu__label">Main</span>
              </button>
              <ul className="slide-menu child1" style={{ display: isPagesOpen ? "block" : "none" }}>
                <li className="slide">
                  <Link to="/profile" className="side-menu__item">
                    Profile
                  </Link>
                </li>
                <li className="slide">
                  <Link to="/ProjectDash" className="side-menu__item">
                    Project dashboard
                  </Link>
                </li>

              </ul>
            </li>

            <li className="slide__category">
              <span className="category-name">Projects</span>
            </li>
            <li className={`slide has-sub ${isPagesOpen ? "open" : ""}`}>
              <button
                className="side-menu__item"
                onClick={() => setIsProjectsMenuOpen(!isProjectsMenuOpen)}
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
              >
                <i className="ri-arrow-down-s-line side-menu__angle"></i>
                <i className="ri-file-list-line side-menu__icon"></i>
                <span className="side-menu__label">Projects</span>
              </button>
              <ul className="slide-menu child1" style={{ display: isProjectsMenuOpen ? "block" : "none" }}>
                <li className="slide">
                  <Link to="/createPro" className="side-menu__item">
                    Create Project
                  </Link>
                </li>
                <li className="slide">
                  <Link to="/listPro" className="side-menu__item">
                    Projects List
                  </Link>
                </li>
                <li className="slide">
                  <Link to="/archieve" className="side-menu__item">
                    Projects Archive
                  </Link>
                </li>
                <li className="slide">
                  <Link to="/ProjectProgress" className="side-menu__item">
                    Projects Progress
                  </Link>
                </li>
              </ul>
            </li>
            <li className="slide__category">
              <span className="category-name">Communication</span>
            </li>
            <li className="slide">
              <Link to="/chat" className="side-menu__item">
                <i className="ri-message-3-line side-menu__icon"></i>
                <span className="side-menu__label">Chat</span>
              </Link>
            </li>
          </>
        );

      case 'Team Manager':
        return (
          <>
            <li className="slide__category">
              <span className="category-name">Main</span>
            </li>

            <li className="slide">
            <Link to="/DashTeam" className="side-menu__item">
                <i className="ri-user-line side-menu__icon"></i>
                <span className="side-menu__label">Dashboard</span>
              </Link>
              <Link to="/profile" className="side-menu__item">
                <i className="ri-user-line side-menu__icon"></i>
                <span className="side-menu__label">Profile</span>
              </Link>
            </li>


            <li className="slide__category">
              <span className="category-name">Projects</span>
            </li>
            <li className="slide">
              <Link to="/listPro" className="side-menu__item">
                <i className="ri-file-list-line side-menu__icon"></i>
                <span className="side-menu__label">Projects List</span>
              </Link>
            </li>
             <li className={`slide has-sub ${isPagesOpen ? "open" : ""}`}>
            <li className="slide__category">
              <span className="category-name">Teams</span>
            </li>
              <button
                className="side-menu__item"
                onClick={() => setIsPagesOpen(!isPagesOpen)}
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
              >
                <i className="ri-arrow-down-s-line side-menu__angle"></i>
                <i className="ri-team-line side-menu__icon"></i>
                <span className="side-menu__label">Team</span>
              </button>
              <ul className="slide-menu child1" style={{ display: isPagesOpen ? "block" : "none" }}>
              <li className="slide">
                  <Link to="/podium" className="side-menu__item">
Member of the year                  </Link>
                </li>
              <li className="slide">
                  <Link to="/best-performer" className="side-menu__item">
                  Best Performance
                  </Link>
                </li>

                <li className="slide">
                  <Link to="/teamsList" className="side-menu__item">
                  Teams List
                  </Link>
                </li>

                <li className="slide">
              <Link to="/teams/teamArchive" className="side-menu__item">
              Teams Archive
              </Link>
            </li>

                
                <li className="slide">
                  <Link to="/reports" className="side-menu__item">
                    Reports
                  </Link>
                </li>


              </ul>
            </li>

            <li className={`slide has-sub ${isPagesOpenTask ? "open" : ""}`}>
            <li className="slide__category">
              <span className="category-name">Tasks</span>
            </li>
              <button
                className="side-menu__item"
                onClick={() => setIsPagesOpenTask(!isPagesOpenTask)}
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
              >
                <i className="ri-arrow-down-s-line side-menu__angle"></i>
                <i className="ri-list-check-3 side-menu__icon"></i>
                <span className="side-menu__label">Tasks</span>
              </button>
              <ul className="slide-menu child1" style={{ display: isPagesOpenTask ? "block" : "none" }}>

                <li className="slide">
                  <Link to="/createTask" className="side-menu__item">
                  Create Task
                  </Link>
                </li>
                <li className="slide">
                  <Link to="/listTask" className="side-menu__item">
                   Task List
                  </Link>
                </li>
                <li className="slide">
                  <Link to="/calendar" className="side-menu__item">
                   Calendar
                  </Link>
                </li> 
                <li className="slide">
                  <Link to="/meet" className="side-menu__item">
                   Meet
                  </Link>
                </li>
             </ul>
            </li>
            <li className="slide__category">
              <span className="category-name">Communication</span>
            </li>
            <li className="slide">
              <Link to="/chat" className="side-menu__item">
                <i className="ri-message-3-line side-menu__icon"></i>
                <span className="side-menu__label">Chat</span>
              </Link>
            </li>
            
            
          </>
        );




      case 'Admin':
        return (
          <>

<li className="slide">
              <Link to="/admin-dashboard" className="side-menu__item">
                <i className="ri-user-line side-menu__icon"></i>
                <span className="side-menu__label">Admin</span>
              </Link>
            </li>
            <li className="slide__category">
              <span className="category-name">Main</span>
            </li>
            <li className={`slide has-sub ${isPagesOpen ? "open" : ""}`}>
              <button
                className="side-menu__item"
                onClick={() => setIsPagesOpen(!isPagesOpen)}
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
              >
                <i className="ri-arrow-down-s-line side-menu__angle"></i>
                <i className="ri-home-line side-menu__icon"></i>
                <span className="side-menu__label">Main</span>
              </button>
              <ul className="slide-menu child1" style={{ display: isPagesOpen ? "block" : "none" }}>
                <li className="slide">
                  <Link to="/profile" className="side-menu__item">
                    Profile
                  </Link>
                </li>
                <li className="slide">
                  <Link to="/ProjectDash" className="side-menu__item">
                    Project dashboard
                  </Link>
                </li>

              </ul>
            </li>

            <li className="slide__category">
              <span className="category-name">Projects</span>
            </li>
            <li className={`slide has-sub ${isPagesOpen ? "open" : ""}`}>
              <button
                className="side-menu__item"
                onClick={() => setIsPagesOpen(!isPagesOpen)}
                style={{ background: "none", border: "none", cursor: "pointer", width: "100%", textAlign: "left" }}
              >
                <i className="ri-arrow-down-s-line side-menu__angle"></i>
                <i className="ri-file-list-line side-menu__icon"></i>
                <span className="side-menu__label">Projects</span>
              </button>
              <ul className="slide-menu child1" style={{ display: isPagesOpen ? "block" : "none" }}>
                <li className="slide">
                  <Link to="/createPro" className="side-menu__item">
                    Create Project
                  </Link>
                </li>
                <li className="slide">
                  <Link to="/listPro" className="side-menu__item">
                    Projects List
                  </Link>
                </li>

                <li className="slide">
                  <Link to="/archieve" className="side-menu__item">
                    Projects Archive
                  </Link>
                </li>
                <li className="slide">
                  <Link to="/ProjectProgress" className="side-menu__item">
                    Projects Progress
                  </Link>
                </li>
              </ul>
            </li>
            <li className="slide__category">
              <span className="category-name">Teams</span>
            </li>
            <li className="slide">
              <Link to="/teamsList" className="side-menu__item">
                <i className="ri-team-line side-menu__icon"></i>
                <span className="side-menu__label">Teams List</span>
              </Link>
            </li>
            <li className="slide">
              <Link to="/teams/teamArchive" className="side-menu__item">
                <i className="ri-file-list-line side-menu__icon"></i>
                <span className="side-menu__label">Teams Archive</span>
              </Link>
            </li>
            <li className="slide">
              <Link to="/best-performer" className="side-menu__item">
                <i className="ri-award-line side-menu__icon"></i>
                <span className="side-menu__label">Best Performance</span>
              </Link>
            </li>
            <li className="slide">
              <Link to="/reports" className="side-menu__item">
                <span className="side-menu__label">Reports</span>
              </Link>
            </li>

            <li className="slide__category">
              <span className="category-name">Communication</span>
            </li>
            <li className="slide">
              <Link to="/chat" className="side-menu__item">
                <i className="ri-message-3-line side-menu__icon"></i>
                <span className="side-menu__label">Chat</span>
              </Link>
            </li>
          </>

        );

      // Add more roles as needed
      default:
        return (
          <>
            <li className="slide">
              <Link to="/profile" className="side-menu__item">
                <i className="ri-user-line side-menu__icon"></i>
                <span className="side-menu__label">Profile</span>
              </Link>
            </li>
            <li className="slide__category">
              <span className="category-name">Communication</span>
            </li>
            <li className="slide">
              <Link to="/chat" className="side-menu__item">
                <i className="ri-message-3-line side-menu__icon"></i>
                <span className="side-menu__label">Messagerie</span>
              </Link>
            </li>
          </>
        );
    }
  };


  return (
<aside className="app-sidebar sticky" id="sidebar">
<div className="main-sidebar-header">
    <img src="/public/logo.png" alt="logo" className="desktop-white" style ={{ width: "145px", height: "120px" }} />

</div>

<div className="main-sidebar" id="sidebar-scroll">
<nav className="main-menu-container nav nav-pills flex-column sub-open">
      <ul className="main-menu">
        {getMenuItems()}
      </ul>
    </nav>

</div>
</aside>
  );
};

export default Sidebar;