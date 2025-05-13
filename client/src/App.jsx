import { Routes, BrowserRouter, Route, Navigate, useLocation } from "react-router-dom";
import SignUp from "./user/Signup";
import SignIn from "./user/Signin";
import Home from "./Home";
import VerifyEmail from "./user/verifymail";
import ForgotPassword from "./user/ForgetPassword";
import ResetPassword from "./user/ResetPassword";
import Profile from "./profile/profile";
import UpdateProfile from "./profile/updateProfile";
import AdminDashboard from "./admin/AdminDashboard";
import ActivitiesPage from "./user/ActivitiesPage";
import { GoogleOAuthProvider } from "@react-oauth/google";
import RefreshHandler from "./user/RefreshHandler";
import { useState, useEffect } from "react";
import Layout from "./partials/Layout";
import Sales from "./project/Sales";
import CreateProject from "./project/createProject";
import ListPro from "./project/ProList";
import ProjectDash from "./project/ProjectDash";
import "../public/assets/css/icons.css";
import "../public/assets/css/remixicon.css";
import 'remixicon/fonts/remixicon.css';
import ProjectOverview from "./project/ProjectOverview";
import AllProject from "./project/AllProject";
import Archieve from "./project/Archieve";
import UserActivity from "./admin/UserActivity";
import ArchiveOverview from "./project/ArchiveOverview";
import UpdateProject from "./project/updateProject";
import ProjectProgress from "./project/projetPorgress";
import CreateProjectWithAI from "./project/CreateProjectWithAI";
import CreateTeam from "./team/createTeam";
import TeamCards from "./team/teamList";
import TeamDetailsPage from "./team/teamDetails";
import UpdateTeam from "./team/updateTeam";
import { SearchSlashIcon } from "lucide-react";
import SearchTeam from "./team/searchTeam";
import TeamArchive from "./team/teamArchiveList";
import TeamArchiveDetailsPage from "./team/teamArchiveDetails";
import BestPerformerPage from "./BestPerformer/BestPerformerPage";
import ChatComponent from "./chat/ChatComponent";
import SearchMember from "./team/searchMember";
import MemberDetails from "./team/memberDetails";
import WinnersPodium from "./team/podium";
import Mail from "./user/mail";
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from "axios";
import { CreateTask } from "./Tasks/createTask";
import { TaskList } from "./Tasks/tasksList";
import { TaskDetail } from "./Tasks/taskDetail";
import { MyTasks } from "./Tasks/myTasks";
import { AITaskGenerator } from "./Tasks/createTaskWithAI";
import KanbanBoard from "./Tasks/KanbanBoard";
import DeveloperDashboard from "./Tasks/DeveloperDashboard";
import DeveloperKanbanBoard from "./Tasks/DeveloperKanbanBoard";
import DeveloperTaskDetail from "./Tasks/DeveloperTaskDetail";

import ReportsList from "./reports/ReportsList";
import PrioritizedTasks from "./Tasks/PrioritizedTasks";
import File from "./fileManager/file"
import TaskAssignement from "./Tasks/taskAssignement";
import Calendar from "./Tasks/calendar";
import Landing from "./Landing";
import DashTeam from "./team/DashTeam";
import Meet from "./Tasks/Meet";

// ProtectedRoute component to check authentication and roles
const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuthAndRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:3000/users/me', {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (response.data) {
          setUserRole(response.data.role?.RoleName);

          // If no specific roles required or user has one of the allowed roles
          if (!allowedRoles || allowedRoles.includes(response.data.role?.RoleName)) {
            setIsAuthorized(true);
          } else {
            setIsAuthorized(false);
          }
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error('Error checking authentication:', err);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndRole();
  }, [location, allowedRoles]);

  if (isLoading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  if (!isAuthorized) {
    // Redirect to signin if not authorized, or to home if unauthorized for specific route
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <GoogleOAuthProvider clientId="893053722717-a3eudc815ujr6ne3tf5q3dlrvkbmls6d.apps.googleusercontent.com">
      <BrowserRouter>
        <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/resetpassword" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          {/* <Route path="/" element={<Navigate to="/signin" />} /> */}
          <Route path="*" element={<Navigate to="/signin" />} />


          {/* Protected routes with role-based access */}
          <Route element={<Layout />}>

            {/* Common routes for all authenticated users */}
            <Route path="/home" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />

<Route path="/DashTeam" element={
              <ProtectedRoute allowedRoles={['Team Manager']}>
                <DashTeam />
              </ProtectedRoute>
            } />


<Route path="/meet" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin','Developer']}>
                <Meet />
              </ProtectedRoute>
            } />

            <Route path="/update-profile" element={
              <ProtectedRoute>
                <UpdateProfile />
              </ProtectedRoute>
            } />

            <Route path="/activities" element={
              <ProtectedRoute>
                <ActivitiesPage />
              </ProtectedRoute>
            } />


             <Route path="/calendar" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin','Developer']}>
                <Calendar />
              </ProtectedRoute>
            } /> 

            <Route path="/taskAssignement/:taskId" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
                <TaskAssignement />
              </ProtectedRoute>
            } /> 

            {/* Admin-only routes */}
            <Route path="/admin-dashboard" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />

            <Route path="/user-activity/:userId" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <UserActivity />
              </ProtectedRoute>
            } />

            {/* Project Manager routes */}
            <Route path="/createPro" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin']}>
                <CreateProject />
              </ProtectedRoute>
            } />

            <Route path="/createProWithAI" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin']}>
                <CreateProjectWithAI />
              </ProtectedRoute>
            } />

            <Route path="/ProjectDash" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin']}>
                <ProjectDash />
              </ProtectedRoute>
            } />

            <Route path="/updateProjects/:id" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin']}>
                <UpdateProject />
              </ProtectedRoute>
            } />



            <Route path="/AllProject" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin']}>
                <AllProject />
              </ProtectedRoute>
            } />

            <Route path="/archieve" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin']}>
                <Archieve />
              </ProtectedRoute>
            } />

            <Route path="/ProjectProgress" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin']}>
                <ProjectProgress />
              </ProtectedRoute>
            } />

            {/* Team Manager routes */}
            <Route path="/createTeam" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
                <CreateTeam />
              </ProtectedRoute>
            } />

            <Route path="/teamsList" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin', 'Project Manager']}>
                <TeamCards />
              </ProtectedRoute>
            } />

            <Route path="/teams/teamDetails/:id" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
                <TeamDetailsPage />
              </ProtectedRoute>
            } />

            <Route path="/teams/updateTeam/:id" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
                <UpdateTeam />
              </ProtectedRoute>
            } />

            <Route path="/best-performer" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
                <BestPerformerPage />
              </ProtectedRoute>
            } />

            <Route path="/podium" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
                <WinnersPodium />
              </ProtectedRoute>
            } />

            <Route path="/member-details/:id" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
                <MemberDetails />
              </ProtectedRoute>
            } />

            <Route path="/searchMember/:id" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
                <SearchMember />
              </ProtectedRoute>
            } />

         

            {/* Shared routes for multiple roles */}
            <Route path="/ListPro" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin', 'Team Manager']}>
                <ListPro />
              </ProtectedRoute>
            } />

            <Route path="/overviewPro/:id" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin', 'Team Manager']}>
                <ProjectOverview />
              </ProtectedRoute>
            } />

            <Route path="/overviewArchive/:id" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin']}>
                <ArchiveOverview />
              </ProtectedRoute>
            } />

            {/* Communication routes */}
            <Route path="/chat" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin', 'Team Manager', 'Developer']}>
                <ChatComponent />
              </ProtectedRoute>
            } />

            <Route path="/mail" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin', 'Team Manager','Developer']}>
                <Mail />
              </ProtectedRoute>
            } />

            {/* File management */}
            <Route path="/file" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin', 'Team Manager','Developer']}>
                <File />
              </ProtectedRoute>
            } />


            <Route path="/mytasks" element={
              <ProtectedRoute allowedRoles={['Developer']}>
                <MyTasks />
              </ProtectedRoute>
            } />

            <Route path="/createTask" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
                <CreateTask />
              </ProtectedRoute>
            } />



            <Route path="/listTask" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
                <TaskList />
              </ProtectedRoute>
            } />

<Route path="/taskdetails/:taskId" element={
  <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
    <TaskDetail />
  </ProtectedRoute>
} />
<Route path="/generateTasksAI" element={
  <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
    <AITaskGenerator />
  </ProtectedRoute>
} />
<Route path="/generateTasksAI/:id" element={
  <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
    <AITaskGenerator />
  </ProtectedRoute>
} />
<Route path="/projects/:projectId/kanban" element={
  <ProtectedRoute allowedRoles={['Team Manager', 'Admin', 'Project Manager']}>
    <KanbanBoard />
  </ProtectedRoute>
} />
<Route path="/developer-kanban" element={
  <ProtectedRoute allowedRoles={['Developer']}>
    <DeveloperKanbanBoard />
  </ProtectedRoute>
} />
<Route path="/developer/taskdetails/:taskId" element={
  <ProtectedRoute allowedRoles={['Developer']}>
    <DeveloperTaskDetail />
  </ProtectedRoute>
} />




            {/* Sales - example route */}
            <Route path="/sales" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin']}>
                <Sales />
              </ProtectedRoute>
            } />
                    <Route path="/createTeam" element={
              <ProtectedRoute allowedRoles={[ 'Admin', 'Team Manager']}>
                <CreateTeam />
              </ProtectedRoute>
            } />

            <Route path="/teamsList" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin', 'Team Manager', 'Developer']}>
                <TeamCards />
              </ProtectedRoute>
            } />

            <Route path="/teams/teamDetails/:id" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin', 'Team Manager', 'Developer']}>
                <TeamDetailsPage />
              </ProtectedRoute>
            } />

            <Route path="/teams/updateTeam/:id" element={
              <ProtectedRoute allowedRoles={[ 'Admin', 'Team Manager']}>
                <UpdateTeam />
              </ProtectedRoute>
            } />

            <Route path="/teams/searchTeam" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin', 'Team Manager', 'Developer']}>
                <SearchTeam />
              </ProtectedRoute>
            } />

            <Route path="/teams/teamArchive" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin', 'Team Manager']}>
                <TeamArchive />
              </ProtectedRoute>
            } />
            <Route path="/teams/teamArchiveDetails/:id" element={
              <ProtectedRoute allowedRoles={['Project Manager', 'Admin', 'Team Manager']}>
                <TeamArchiveDetailsPage />
              </ProtectedRoute>
            } />


                      <Route path="/developer-dashboard" element={
              <ProtectedRoute allowedRoles={['Developer', 'Team Manager']}>
                <DeveloperDashboard />
</ProtectedRoute>
} />
            {/* Reports route */}
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['Team Manager', 'Admin']}>
                <ReportsList />
              </ProtectedRoute>
            } />

            {/* Prioritized Tasks route */}
            <Route path="/prioritized-tasks" element={
              <ProtectedRoute allowedRoles={['Developer']}>
                <PrioritizedTasks />
              </ProtectedRoute>
            } />
          </Route>





        </Routes>
      </BrowserRouter>
    </GoogleOAuthProvider>
  );
}

export default App;
