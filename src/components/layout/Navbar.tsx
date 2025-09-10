import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useTheme } from '../../contexts/ThemeContext';
import { GraduationCap, LogOut, User, BarChart3, BookOpen, Map, Moon, Sun, MessageSquare, Bell, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { getActiveAlerts } = useData();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAlerts, setShowAlerts] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);

  // Close alerts dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(event.target as Node)) {
        setShowAlerts(false);
      }
    };

    if (showAlerts) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAlerts]);

  // Don't render navbar if user is not loaded yet
  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get active alerts for students
  const activeAlerts = user.role === 'student' ? getActiveAlerts(user.department, user.semester) : [];

  const handleAlertClick = (alertId: string) => {
    // Mark alert as read (you might want to implement this in the DataContext later)
    console.log(`Alert ${alertId} clicked`);
  };

  const isActive = (path: string) => location.pathname === path;

  const studentNavItems = [
    { path: '/electives', label: 'Electives', icon: BookOpen },
    { path: '/progress', label: 'Progress', icon: BarChart3 },
    { path: '/roadmap', label: 'Roadmap', icon: Map },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/feedback', label: 'Feedback', icon: MessageSquare }
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/electives', label: 'Manage Electives', icon: BookOpen },
    { path: '/admin/students', label: 'Students', icon: User },
    { path: '/admin/feedback', label: 'Feedback Forms', icon: MessageSquare },
    { path: '/admin/feedback-responses', label: 'Feedback Responses', icon: MessageSquare },
    { path: '/admin/alerts', label: 'Alerts', icon: Bell },
    { path: '/admin/system', label: 'System Management', icon: BarChart3 },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : studentNavItems;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg fixed w-full top-0 z-50 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">Elective </span>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-400'
                      : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell for Students */}
            {user?.role === 'student' && (
              <div className="relative" ref={alertsRef}>
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="relative p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {activeAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {activeAlerts.length}
                    </span>
                  )}
                </button>
                
                {/* Alerts Dropdown */}
                {showAlerts && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      <button
                        onClick={() => setShowAlerts(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {activeAlerts.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                          No new notifications
                        </div>
                      ) : (
                        activeAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleAlertClick(alert.id)}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                                alert.type === 'deadline' ? 'bg-red-500' :
                                alert.type === 'elective_reminder' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {alert.title}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                  {alert.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(alert.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">{user?.name}</span>
              {user?.role === 'student' && (
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {user?.department} - Sem {user?.semester}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-500 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive(item.path)
                    ? 'text-blue-600 bg-blue-50 dark:bg-blue-900 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;