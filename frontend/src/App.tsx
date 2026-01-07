import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layout commun
import Layout from './components/common/Layout';

// Pages publiques
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

// Pages protégées
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';

import TaskForm from './pages/task/CreateTaskForm';
import TaskManagement from './pages/task/TaskManagement';

import MyTasks from './pages/assignements/MyTasks';
import ModeSelectionPage from './pages/assignements/AssignementList';
import AutoAssignmentPage from './pages/assignements/AutoAssignmentPage';
import ManualAssignmentPage from './pages/assignements/ManualAssignmentPage';
import SemiAutoAssignmentPage from './pages/assignements/SemiAutoAssignmentPage';

import AddVehicleForm from './pages/vehicles/AddVehicleForm';
import EditVehicleForm from './pages/vehicles/EditVehicleForm';
import VehiclesManagement from './pages/vehicles/VehiclesManagement';

import CreateUserForm from './pages/users/AddUser';
import UsersManagement from './pages/users/UserManagement';

import ChatInternal from './components/chat/ChatRoom';
import NotificationsPage from './pages/NotificationsPage';

import GlobalHistory from './pages/History/GlobalHistory';
import IndividualHistory from './pages/History/IndividualHistory';

import ProfilePage from './components/users/UserProfile';
import EditProfilePage from './components/users/EditProfilePage';


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
                    {/* Home - Accessible à tous les utilisateurs authentifiés */}
                    <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={['SUPERADMIN']}>
                        <Dashboard />

                      </ProtectedRoute>
                    } />

                    <Route path="/" element={<Home />} />

                    {/* Tâches - Création/Gestion (SUPERADMIN et ADMIN) */}
                    <Route 
                      path="/create-task" 
                      element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                          <TaskForm />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/tasks" 
                      element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                          <TaskManagement />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Mes tâches - Accessible à tous */}
                    <Route path="/my-tasks" element={<MyTasks />} />

                    {/* Affectation des tâches (SUPERADMIN et ADMIN) */}
                    <Route 
                      path="/assignment" 
                      element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                          <ModeSelectionPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/assignment/manual" 
                      element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                          <ManualAssignmentPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/assignment/semi-auto" 
                      element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                          <SemiAutoAssignmentPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/assignment/auto" 
                      element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                          <AutoAssignmentPage />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Véhicules - Gestion (SUPERADMIN et ADMIN) */}
                    <Route 
                      path="/vehicles" 
                      element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                          <VehiclesManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/vehicles/add" 
                      element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                          <AddVehicleForm />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/vehicles/edit/:id" 
                      element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                          <EditVehicleForm />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Utilisateurs - Gestion (SUPERADMIN et ADMIN) */}
                    <Route 
                      path="/users" 
                      element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                          <UsersManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/users/create" 
                      element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                          <CreateUserForm />
                        </ProtectedRoute>
                      } 
                    />

                    {/* Chat et notifications - Accessible à tous */}
                    <Route path="/chat" element={<ChatInternal />} />
                    <Route path="/notifications" element={<NotificationsPage />} />

                    {/* Historique */}
                    <Route 
                      path="/history/global" 
                      element={
                        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
                          <GlobalHistory />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/history/individual" element={<IndividualHistory />} />

                    {/* Profil - Accessible à tous */}
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/edit-profile" element={<EditProfilePage />} />

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