import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/common/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import TaskForm from './pages/task/CreateTaskForm';
import TaskManagement from './pages/task/TaskManagement';
import MyTasks from './components/assignements/MyTasks';
import ManualAssignmentPage from './components/assignements/ManualAssignmentPage';
import ModeSelectionPage from './components/assignements/AssignementList';
import SemiAutoAssignmentPage from './components/assignements/SemiAutoAssignmentPage';
import AutoAssignmentPage from './components/assignements/AutoAssignmentPage';
import VehiclesManagement from './pages/vehicles/VehiclesManagement';
import AddVehicleForm from './pages/vehicles/AddVehicleForm';
import UsersManagement from './pages/users/UserManagement';
import CreateUserForm from './pages/users/AddUser';
import ChatInternal from './components/chat/ChatRoom';
import NotificationsPage from './pages/NotificationsPage';
import GlobalHistory from './pages/History/GlobalHistory';
import IndividualHistory from './pages/History/IndividualHistory';
import LoginPage from './pages/Login';
import ProfilePage from './components/users/UserProfile';
import './index.css';

function App() {
  const userName: string = 'Admin User';

  return (
    <Router>
      <Routes>
        {/* Routes publiques */}
        <Route path="/login" element={<LoginPage />} />

        {/* Routes protégées avec Layout */}
        <Route
          path="/*"
          element={
            <Layout userName={userName}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/create-task" element={<TaskForm />} />
                <Route path="/tasks" element={<TaskManagement />} />
                <Route path="/my-tasks" element={<MyTasks />} />
                <Route path="/assignment" element={<ModeSelectionPage />} />
                <Route path="/assignment/manual" element={<ManualAssignmentPage />} />
                <Route path="/assignment/semi-auto" element={<SemiAutoAssignmentPage />} />
                <Route path="/assignment/auto" element={<AutoAssignmentPage />} />
                <Route path="/vehicles" element={<VehiclesManagement />} />
                <Route path="/vehicles/add" element={<AddVehicleForm />} />
                <Route path="/users" element={<UsersManagement />} />
                <Route path="/users/create" element={<CreateUserForm />} />
                <Route path="/chat" element={<ChatInternal />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/history/global" element={<GlobalHistory />} />
                <Route path="/history/individual" element={<IndividualHistory />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
