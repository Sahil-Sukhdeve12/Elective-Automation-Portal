import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentElectiveSelection from './pages/student/StudentElectiveSelection';
import StudentProgress from './pages/student/StudentProgress';
import StudentRoadmap from './pages/student/StudentRoadmap';
import StudentProfile from './pages/student/StudentProfile';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminElectives from './pages/admin/AdminElectives';
import AdminStudents from './pages/admin/AdminStudents';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import Navbar from './components/layout/Navbar';
import NotificationToast from './components/common/NotificationToast';
import StudentRedirect from './components/common/StudentRedirect';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function StudentRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  if (!user || user.role !== 'student') {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" replace />} />
      
      {/* Home Route */}
      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'student' ? <StudentRedirect /> : <AdminDashboard />}
        </ProtectedRoute>
      } />
      <Route path="/electives" element={
        <StudentRoute>
          <StudentElectiveSelection />
        </StudentRoute>
      } />
      <Route path="/progress" element={
        <StudentRoute>
          <StudentProgress />
        </StudentRoute>
      } />
      <Route path="/roadmap" element={
        <StudentRoute>
          <StudentRoadmap />
        </StudentRoute>
      } />
      <Route path="/profile" element={
        <StudentRoute>
          <StudentProfile />
        </StudentRoute>
      } />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      <Route path="/admin/electives" element={
        <AdminRoute>
          <AdminElectives />
        </AdminRoute>
      } />
      <Route path="/admin/students" element={
        <AdminRoute>
          <AdminStudents />
        </AdminRoute>
      } />
      <Route path="/admin/analytics" element={
        <AdminRoute>
          <AdminAnalytics />
        </AdminRoute>
      } />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <NotificationProvider>
            <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <Navbar />
                <main className="pt-16">
                  <AppRoutes />
                </main>
                <NotificationToast />
              </div>
            </Router>
          </NotificationProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;