import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import TaskForm from './pages/task/CreateTaskForm';
import TaskManagement from './pages/task/TaskManagement';
import MyTasks from './components/assignements/MyTasks';
import VehiclesManagement from './pages/vehicles/VehiclesManagement';
import AddVehicleForm from './pages/vehicles/AddVehicleForm';
import UsersManagement from './pages/users/UserManagement';
import CreateUserForm from './pages/users/AddUser';
import ChatInternal from './components/chat/ChatRoom';
import NotificationsPage from './pages/NotificationsPage';
import GlobalHistory from './pages/History/GlobalHistory';
import IndividualHistory from './pages/History/IndividualHistory';
import './index.css';

function App() {
  const userRole: 'superAdmin' | 'admin' | 'user' = 'admin';

  return (
    <Router>
      <div className="app">
        <Sidebar userRole={userRole} />

        <div className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create-task" element={<TaskForm />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/vehicles" element={<VehiclesManagement />} />
            <Route path="/vehicles/add" element={<AddVehicleForm />} />
            <Route path="/users" element={<UsersManagement />} />
            <Route path="/users/create" element={<CreateUserForm />} />
            <Route path="/chat" element={<ChatInternal />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/history/global" element={<GlobalHistory />} />
            <Route path="/history/individual" element={<IndividualHistory />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
