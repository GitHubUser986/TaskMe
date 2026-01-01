import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout commun
import Layout from './components/common/Layout';

// Pages publiques
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

// Pages protégées
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
import ProfilePage from './components/users/UserProfile';

function App() {
  const userName: string = 'Admin User';

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Routes protégées avec Layout commun */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout userName={userName}>
                  <Routes>
                    {/* Dashboard */}
                    <Route path="/" element={<Dashboard />} />

                    {/* Tâches */}
                    <Route path="/create-task" element={<TaskForm />} />
                    <Route path="/tasks" element={<TaskManagement />} />
                    <Route path="/my-tasks" element={<MyTasks />} />
                    <Route path="/assignment" element={<ModeSelectionPage />} />
                    <Route path="/assignment/manual" element={<ManualAssignmentPage />} />
                    <Route path="/assignment/semi-auto" element={<SemiAutoAssignmentPage />} />
                    <Route path="/assignment/auto" element={<AutoAssignmentPage />} />

                    {/* Véhicules */}
                    <Route path="/vehicles" element={<VehiclesManagement />} />
                    <Route path="/vehicles/add" element={<AddVehicleForm />} />

                    {/* Utilisateurs */}
                    <Route path="/users" element={<UsersManagement />} />
                    <Route path="/users/create" element={<CreateUserForm />} />

                    {/* Chat et notifications */}
                    <Route path="/chat" element={<ChatInternal />} />
                    <Route path="/notifications" element={<NotificationsPage />} />

                    {/* Historique */}
                    <Route path="/history/global" element={<GlobalHistory />} />
                    <Route path="/history/individual" element={<IndividualHistory />} />

                    {/* Profil */}
                    <Route path="/profile" element={<ProfilePage />} />

                    {/* Redirection par défaut vers Dashboard */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
