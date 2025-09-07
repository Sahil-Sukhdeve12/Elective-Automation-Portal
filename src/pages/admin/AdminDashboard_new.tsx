import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData, AlertNotification } from '../../contexts/DataContext';
import { Users, BookOpen, BarChart3, Star, Building2, Plus, Trash2, Bell } from 'lucide-react';

// Alert Management Component
interface AlertManagementProps {
  createAlert: (alert: Omit<AlertNotification, 'id' | 'createdAt'>) => void;
  getActiveAlerts: (department?: string, semester?: number) => AlertNotification[];
  deleteAlert: (alertId: string) => void;
  departments: string[];
}

const AlertManagement: React.FC<AlertManagementProps> = ({ 
  createAlert, 
  getActiveAlerts, 
  deleteAlert,
  departments 
}) => {
  const [newAlert, setNewAlert] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'error' | 'success',
    department: '',
    semester: '',
    expiresAt: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAlert({
      title: newAlert.title,
      message: newAlert.message,
      type: newAlert.type,
      department: newAlert.department || undefined,
      semester: newAlert.semester ? parseInt(newAlert.semester) : undefined,
      expiresAt: newAlert.expiresAt ? new Date(newAlert.expiresAt) : undefined,
      priority: newAlert.priority,
      isActive: true
    });
    
    setNewAlert({
      title: '',
      message: '',
      type: 'info',
      department: '',
      semester: '',
      expiresAt: '',
      priority: 'medium'
    });
  };

  const alerts = getActiveAlerts();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Alert</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Title
              </label>
              <input
                type="text"
                value={newAlert.title}
                onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter alert title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Type
              </label>
              <select
                value={newAlert.type}
                onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="success">Success</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={newAlert.message}
              onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter alert message"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department (Optional)
              </label>
              <select
                value={newAlert.department}
                onChange={(e) => setNewAlert({ ...newAlert, department: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Semester (Optional)
              </label>
              <select
                value={newAlert.semester}
                onChange={(e) => setNewAlert({ ...newAlert, semester: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Semesters</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={newAlert.priority}
                onChange={(e) => setNewAlert({ ...newAlert, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expires At (Optional)
            </label>
            <input
              type="datetime-local"
              value={newAlert.expiresAt}
              onChange={(e) => setNewAlert({ ...newAlert, expiresAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Create Alert
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <p className="text-gray-500">No active alerts</p>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      alert.type === 'error' ? 'bg-red-100 text-red-800' :
                      alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      alert.type === 'success' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {alert.type}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      alert.priority === 'high' ? 'bg-red-100 text-red-800' :
                      alert.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {alert.priority}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{alert.message}</p>
                  <div className="text-sm text-gray-500">
                    {alert.department && <span>Department: {alert.department} • </span>}
                    {alert.semester && <span>Semester: {alert.semester} • </span>}
                    Created: {alert.createdAt.toLocaleDateString()}
                    {alert.expiresAt && <span> • Expires: {alert.expiresAt.toLocaleDateString()}</span>}
                  </div>
                </div>
                <button
                  onClick={() => deleteAlert(alert.id)}
                  className="text-red-600 hover:text-red-800 ml-4"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    electives, 
    tracks, 
    studentElectives, 
    getAvailableDepartments,
    createAlert,
    getActiveAlerts,
    deleteAlert
  } = useData();
  const [selectedView, setSelectedView] = useState<'overview' | 'departments' | 'alerts'>('overview');

  if (!user || user.role !== 'admin') return null;

  // Get admin-configured departments only
  const departments = getAvailableDepartments();

  // Calculate analytics
  const totalStudents = JSON.parse(localStorage.getItem('users') || '[]')
    .filter((u: { role: string }) => u.role === 'student').length;
  
  const totalElectives = electives.length;

  // Department-wise statistics
  const departmentStats = departments.map(dept => {
    const deptElectives = electives.filter(e => e.department === dept);
    const deptTracks = tracks.filter(t => t.department === dept);
    
    // Get electives with their selection counts
    const electivesWithSelections = deptElectives.map(elective => {
      const selections = studentElectives.filter(se => se.electiveId === elective.id).length;
      return { ...elective, selections };
    }).sort((a, b) => b.selections - a.selections);

    // Get tracks with their selection counts
    const tracksWithSelections = deptTracks.map(track => {
      const selections = studentElectives.filter(se => se.trackId === track.id).length;
      return { ...track, selections };
    }).sort((a, b) => b.selections - a.selections);

    return {
      department: dept,
      totalElectives: deptElectives.length,
      totalTracks: deptTracks.length,
      mostPopularElective: electivesWithSelections[0] || null,
      mostPopularTrack: tracksWithSelections[0] || null,
      allElectives: electivesWithSelections,
      allTracks: tracksWithSelections
    };
  });

  // Categorize electives by category
  const electiveCategories = ['Humanities', 'Departmental', 'Open'] as const;
  
  // Track popularity by category
  const categoryTrackStats = electiveCategories.map(category => {
    const categoryTracks = tracks.filter(track => track.category === category);
    
    const tracksWithSelections = categoryTracks.map(track => {
      const selections = studentElectives.filter(se => se.trackId === track.id).length;
      return { ...track, selections };
    }).sort((a, b) => b.selections - a.selections);

    return {
      category,
      totalTracks: categoryTracks.length,
      tracks: tracksWithSelections.slice(0, 5) // Top 5 tracks
    };
  });

  // Category-wise elective statistics  
  const categoryElectiveStats = electiveCategories.map(category => {
    const categoryElectives = electives.filter(elective => elective.category === category);
    
    const electivesWithSelections = categoryElectives.map(elective => {
      const selections = studentElectives.filter(se => se.electiveId === elective.id).length;
      return { ...elective, selections };
    }).sort((a, b) => b.selections - a.selections);

    return {
      category,
      totalElectives: categoryElectives.length,
      electives: electivesWithSelections.slice(0, 5) // Top 5 electives
    };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of electives, students, and system analytics
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'departments', label: 'Departments', icon: Building2 },
              { id: 'alerts', label: 'Alert System', icon: Bell }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedView(tab.id as 'overview' | 'departments' | 'alerts')}
                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  selectedView === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {selectedView === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
                  <p className="text-gray-600">Total Students</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <BookOpen className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{totalElectives}</p>
                  <p className="text-gray-600">Total Electives</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <Building2 className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{departments.length}</p>
                  <p className="text-gray-600">Departments</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Track Popularity by Category */}
            {categoryTrackStats.map((categoryData) => (
              <div key={categoryData.category} className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {categoryData.category} Track Popularity
                </h2>
                <div className="space-y-4">
                  {categoryData.tracks.length === 0 ? (
                    <p className="text-gray-500">No tracks available</p>
                  ) : (
                    categoryData.tracks.map((track, index) => (
                      <div key={track.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 w-6">#{index + 1}</span>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{track.name}</p>
                            <p className="text-xs text-gray-500">{track.department}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">{track.selections}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}

            {/* Elective Popularity by Category */}
            {categoryElectiveStats.map((categoryData) => (
              <div key={categoryData.category} className="bg-white p-6 rounded-lg shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {categoryData.category} Elective Popularity
                </h2>
                <div className="space-y-4">
                  {categoryData.electives.length === 0 ? (
                    <p className="text-gray-500">No electives available</p>
                  ) : (
                    categoryData.electives.map((elective, index) => (
                      <div key={elective.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 w-6">#{index + 1}</span>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{elective.name}</p>
                            <p className="text-xs text-gray-500">{elective.department}</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">{elective.selections}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Departments Tab */}
      {selectedView === 'departments' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {departmentStats.map((dept) => (
              <div key={dept.department} className="bg-white p-6 rounded-lg shadow-sm border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{dept.department}</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Electives Offered</span>
                    <span className="font-bold text-gray-900">{dept.totalElectives}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tracks Available</span>
                    <span className="font-bold text-gray-900">{dept.totalTracks}</span>
                  </div>
                  
                  {dept.mostPopularElective && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Most Popular Elective</h4>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium">{dept.mostPopularElective.name}</p>
                        <p className="text-xs text-gray-500">{dept.mostPopularElective.selections} selections</p>
                      </div>
                    </div>
                  )}
                  
                  {dept.mostPopularTrack && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Most Popular Track</h4>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-sm font-medium">{dept.mostPopularTrack.name}</p>
                        <p className="text-xs text-gray-500">{dept.mostPopularTrack.selections} selections</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert System Tab */}
      {selectedView === 'alerts' && (
        <div className="space-y-6">
          <AlertManagement 
            createAlert={createAlert}
            getActiveAlerts={getActiveAlerts}
            deleteAlert={deleteAlert}
            departments={departments}
          />
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
